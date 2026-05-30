import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReportData,
  ReportMetrics,
  ReportMover,
  SavingsRateStatus,
} from "@/types/report";

type Txn = {
  amount: number;
  type: string;
  category_key: string;
  date: string;
  description: string | null;
};

// Keywords that flag a likely recurring subscription in a transaction description.
const SUBSCRIPTION_RE =
  /netflix|spotify|youtube|disney|hbo|prime|apple|google one|icloud|subscription|langganan|premium|\bplus\b/i;

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  return { y, m, start, end };
}

// Rounded % change of current vs previous. 100% when there was no prior value.
function pct(curr: number, prev: number): number {
  if (prev > 0) return Math.round(((curr - prev) / prev) * 100);
  return curr > 0 ? 100 : 0;
}

// Everything on the Reports page that comes from the database (no AI).
export async function computeReportData(
  supabase: SupabaseClient,
  userId: string,
  month: string
): Promise<ReportData> {
  const { y, m, start, end } = monthBounds(month);

  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const { start: prevStart, end: prevEnd } = monthBounds(prevMonth);

  // Six month keys ending at the report month (oldest → newest), for the trend.
  const trendKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    trendKeys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  const sixStart = `${trendKeys[0]}-01`;

  const [cur, prev, trend] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type, category_key, date, description")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("transactions")
      .select("amount, type, category_key, date, description")
      .eq("user_id", userId)
      .gte("date", prevStart)
      .lte("date", prevEnd),
    supabase
      .from("transactions")
      .select("amount, type, date")
      .eq("user_id", userId)
      .gte("date", sixStart)
      .lte("date", end),
  ]);

  const curTxns = (cur.data as Txn[] | null) ?? [];
  const prevTxns = (prev.data as Txn[] | null) ?? [];
  const trendTxns = (trend.data as Txn[] | null) ?? [];

  const sum = (txns: Txn[]) => {
    let income = 0;
    let spent = 0;
    const byCat: Record<string, number> = {};
    for (const t of txns) {
      const amt = Number(t.amount);
      if (t.type === "income") {
        income += amt;
      } else {
        spent += amt;
        byCat[t.category_key] = (byCat[t.category_key] || 0) + amt;
      }
    }
    return { income, spent, byCat };
  };

  const c = sum(curTxns);
  const p = sum(prevTxns);

  // Metric cards.
  const saved = c.income - c.spent;
  const savingsRate = c.income > 0 ? Math.round((saved / c.income) * 100) : 0;
  const savingsRateStatus: SavingsRateStatus =
    savingsRate >= 20 ? "above_average" : savingsRate >= 10 ? "average" : "below_average";
  const metrics: ReportMetrics = {
    totalSpent: c.spent,
    totalIncome: c.income,
    saved,
    savingsRate,
    spentChange: pct(c.spent, p.spent),
    incomeChange: p.income > 0 ? pct(c.income, p.income) : null,
    savingsRateStatus,
  };

  // Category breakdown (expense only, biggest first).
  const catKeys = new Set([
    ...Object.keys(c.byCat),
    ...Object.keys(p.byCat),
  ]);
  const categoryBreakdown = [...catKeys]
    .map((categoryKey) => ({
      categoryKey,
      total: c.byCat[categoryKey] || 0,
      vsLastMonth: pct(c.byCat[categoryKey] || 0, p.byCat[categoryKey] || 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  // Six-month spend trend.
  const trendSpend: Record<string, number> = Object.fromEntries(
    trendKeys.map((k) => [k, 0])
  );
  for (const t of trendTxns) {
    if (t.type !== "expense") continue;
    const k = t.date.slice(0, 7);
    if (k in trendSpend) trendSpend[k] += Number(t.amount);
  }
  const monthlyTrend = trendKeys.map((k) => ({ month: k, totalSpent: trendSpend[k] }));

  // Biggest movers (largest absolute % change, in either direction).
  const biggestMovers: ReportMover[] = [...catKeys]
    .map((categoryKey) => {
      const thisMonth = c.byCat[categoryKey] || 0;
      const previousMonth = p.byCat[categoryKey] || 0;
      const changeAbsolute = thisMonth - previousMonth;
      return {
        categoryKey,
        previousMonth,
        thisMonth,
        changePercent: pct(thisMonth, previousMonth),
        changeAbsolute,
        direction: changeAbsolute >= 0 ? "up" : "down",
      } as ReportMover;
    })
    .filter((mv) => mv.thisMonth > 0 || mv.previousMonth > 0)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  // Highlights.
  const curExpenses = curTxns.filter((t) => t.type === "expense");
  let mostExpensiveDay: ReportData["highlights"]["mostExpensiveDay"] = null;
  for (const t of curExpenses) {
    const amt = Number(t.amount);
    if (!mostExpensiveDay || amt > mostExpensiveDay.amount) {
      mostExpensiveDay = { date: t.date, description: t.description || "", amount: amt };
    }
  }
  const topCat = categoryBreakdown[0];
  const topCategory =
    topCat && c.spent > 0
      ? { categoryKey: topCat.categoryKey, percentage: Math.round((topCat.total / c.spent) * 100) }
      : null;
  const txTotal = curExpenses.length;
  const averageAmount = txTotal ? Math.round(c.spent / txTotal) : 0;

  // New subscriptions: descriptions appearing this month but not last, matching keywords.
  const prevDescs = new Set(
    prevTxns.map((t) => (t.description || "").trim().toLowerCase()).filter(Boolean)
  );
  const subNames: string[] = [];
  const seen = new Set<string>();
  for (const t of curExpenses) {
    const d = (t.description || "").trim();
    const key = d.toLowerCase();
    if (!d || seen.has(key)) continue;
    if (SUBSCRIPTION_RE.test(d) && !prevDescs.has(key)) {
      seen.add(key);
      subNames.push(d);
    }
  }

  return {
    month,
    generatedAt: new Date().toISOString(),
    metrics,
    categoryBreakdown,
    monthlyTrend,
    biggestMovers,
    highlights: {
      mostExpensiveDay,
      topCategory,
      transactionCount: { total: txTotal, averageAmount },
      newSubscriptions: { count: subNames.length, names: subNames.slice(0, 5) },
    },
  };
}
