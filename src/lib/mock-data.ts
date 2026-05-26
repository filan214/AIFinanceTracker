export type CategoryKey =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "bills"
  | "health"
  | "education"
  | "savings"
  | "income";

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  category_key: CategoryKey;
  date: string;
};

export const CATEGORY_KEYS: CategoryKey[] = [
  "food",
  "transport",
  "entertainment",
  "shopping",
  "bills",
  "health",
  "education",
  "savings",
  "income",
];

export const CATEGORY_COLOR: Record<CategoryKey, string> = {
  food: "#f59e0b",
  transport: "#3b82f6",
  entertainment: "#a855f7",
  shopping: "#ec4899",
  bills: "#0ea5e9",
  health: "#ef4444",
  education: "#14b8a6",
  savings: "#10b981",
  income: "#22c55e",
};

const seed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const DESCRIPTIONS: Record<CategoryKey, string[]> = {
  food: ["Lunch at warung", "Coffee", "Grocery run", "Dinner with friend"],
  transport: ["Grab to office", "Gas top up", "Train ticket", "Parking"],
  entertainment: ["Netflix", "Spotify", "Movie ticket", "Concert ticket"],
  shopping: ["New shirt", "Sneakers", "Skincare", "Books"],
  bills: ["Electricity", "Internet", "Phone", "Water"],
  health: ["Pharmacy", "Doctor visit", "Vitamins", "Gym"],
  education: ["Online course", "Stationery", "Book"],
  savings: ["Reksadana", "Savings transfer", "Emergency fund"],
  income: ["Salary", "Freelance project", "Side hustle"],
};

function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length];
}

function buildMonth(year: number, monthIdx: number): Transaction[] {
  const txns: Transaction[] = [];
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  txns.push({
    id: `${monthKey}-inc-1`,
    amount: 4500000,
    type: "income",
    description: "Salary",
    category_key: "income",
    date: `${monthKey}-01`,
  });

  const expenseCats: CategoryKey[] = [
    "food",
    "transport",
    "entertainment",
    "shopping",
    "bills",
    "health",
    "savings",
  ];
  const txnsPerMonth = 26;
  for (let i = 0; i < txnsPerMonth; i++) {
    const day = ((seed(monthKey + i) % daysInMonth) + 1);
    const cat = pick(expenseCats, seed(monthKey + "cat" + i));
    const baseAmount =
      cat === "food"
        ? 25000 + (seed(monthKey + "f" + i) % 60000)
        : cat === "transport"
          ? 15000 + (seed(monthKey + "t" + i) % 80000)
          : cat === "entertainment"
            ? 50000 + (seed(monthKey + "e" + i) % 200000)
            : cat === "shopping"
              ? 80000 + (seed(monthKey + "s" + i) % 250000)
              : cat === "bills"
                ? 150000 + (seed(monthKey + "b" + i) % 200000)
                : cat === "health"
                  ? 50000 + (seed(monthKey + "h" + i) % 150000)
                  : 200000 + (seed(monthKey + "sv" + i) % 300000);
    txns.push({
      id: `${monthKey}-exp-${i}`,
      amount: Math.round(baseAmount / 1000) * 1000,
      type: "expense",
      description: pick(DESCRIPTIONS[cat], seed(monthKey + "d" + i)),
      category_key: cat,
      date: `${monthKey}-${String(day).padStart(2, "0")}`,
    });
  }
  return txns;
}

const NOW = new Date("2026-05-26");

export const MOCK_TRANSACTIONS: Transaction[] = [
  ...buildMonth(2026, 2),
  ...buildMonth(2026, 3),
  ...buildMonth(2026, 4),
].sort((a, b) => (a.date < b.date ? 1 : -1));

export function currentMonthKey(): string {
  return `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey(): string {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getTransactionsForMonth(monthKey: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.date.startsWith(monthKey));
}

export type MonthSummary = {
  income: number;
  expense: number;
  balance: number;
  byCategory: { category_key: CategoryKey; total: number }[];
  dailyTotals: { day: string; total: number }[];
};

export function summarizeMonth(monthKey: string): MonthSummary {
  const txns = getTransactionsForMonth(monthKey);
  let income = 0;
  let expense = 0;
  const catMap = new Map<CategoryKey, number>();
  const dayMap = new Map<string, number>();
  for (const t of txns) {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
      catMap.set(t.category_key, (catMap.get(t.category_key) ?? 0) + t.amount);
      dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.amount);
    }
  }
  return {
    income,
    expense,
    balance: income - expense,
    byCategory: Array.from(catMap.entries())
      .map(([category_key, total]) => ({ category_key, total }))
      .sort((a, b) => b.total - a.total),
    dailyTotals: Array.from(dayMap.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => (a.day < b.day ? -1 : 1)),
  };
}
