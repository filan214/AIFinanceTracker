import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  todayParts,
  ymd,
  dateRangeForPeriod,
  monthRange,
  currentMonth,
} from "./dates";

export function buildChatTools(
  supabase: SupabaseClient,
  userId: string
) {
  return {
    getTransactions: tool({
      description:
        "Fetch user transactions. Use when the user asks about specific transactions, wants to see their spending list, or needs raw data.",
      inputSchema: z.object({
        period: z
          .enum([
            "today",
            "this_month",
            "last_month",
            "last_3_months",
            "last_6_months",
            "this_year",
          ])
          .describe("Time period to fetch"),
        category: z
          .string()
          .optional()
          .describe(
            "Filter by category_key (food, transport, entertainment, shopping, bills, health, education, savings, income). Omit for all."
          ),
        type: z
          .enum(["income", "expense"])
          .optional()
          .describe("Filter by transaction type. Omit for both."),
        limit: z
          .number()
          .min(1)
          .max(50)
          .default(10)
          .describe("Number of transactions to return"),
      }),
      execute: async ({ period, category, type, limit }) => {
        const { from, to } = dateRangeForPeriod(period);
        let q = supabase
          .from("transactions")
          .select("id, amount, type, description, category_key, date")
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to)
          .order("date", { ascending: false })
          .limit(limit);
        if (category) q = q.eq("category_key", category);
        if (type) q = q.eq("type", type);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { transactions: data ?? [], from, to };
      },
    }),

    getMonthlySummary: tool({
      description:
        "Get total income, total expense, and net balance for a specific month. Use when the user asks about monthly totals or overall financial summary.",
      inputSchema: z.object({
        month: z
          .string()
          .optional()
          .describe(
            "Month in YYYY-MM format. Defaults to the current month if omitted."
          ),
      }),
      execute: async ({ month }) => {
        const target = month || currentMonth();
        const { from, to } = monthRange(target);
        const { data, error } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to);
        if (error) return { error: error.message };
        let totalIncome = 0;
        let totalExpense = 0;
        for (const t of data ?? []) {
          const amt = Number(t.amount);
          if (t.type === "income") totalIncome += amt;
          else totalExpense += amt;
        }
        return {
          month: target,
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount: data?.length ?? 0,
        };
      },
    }),

    getCategoryBreakdown: tool({
      description:
        "Get spending broken down by category. Use when the user asks where their money went, which category is most expensive, or wants a spending breakdown.",
      inputSchema: z.object({
        month: z
          .string()
          .optional()
          .describe("Month in YYYY-MM format. Defaults to the current month."),
        period: z
          .enum(["this_month", "last_month", "last_3_months"])
          .optional()
          .describe("Alternative to month — use a relative period."),
      }),
      execute: async ({ month, period }) => {
        const { from, to } = period
          ? dateRangeForPeriod(period)
          : monthRange(month || currentMonth());
        const { data, error } = await supabase
          .from("transactions")
          .select("amount, category_key")
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", from)
          .lte("date", to);
        if (error) return { error: error.message };
        const totals: Record<string, { total: number; count: number }> = {};
        let grand = 0;
        for (const t of data ?? []) {
          const k = t.category_key || "uncategorized";
          if (!totals[k]) totals[k] = { total: 0, count: 0 };
          const amt = Number(t.amount);
          totals[k].total += amt;
          totals[k].count += 1;
          grand += amt;
        }
        const breakdown = Object.entries(totals)
          .map(([category_key, v]) => ({
            category_key,
            total: v.total,
            count: v.count,
            percentage: grand > 0 ? +((v.total / grand) * 100).toFixed(1) : 0,
          }))
          .sort((a, b) => b.total - a.total);
        return { from, to, total: grand, breakdown };
      },
    }),

    getSpendingTrend: tool({
      description:
        "Get monthly spending trend over multiple months. Use when the user asks about trends, whether spending is increasing or decreasing, or wants historical comparison.",
      inputSchema: z.object({
        months: z
          .number()
          .min(2)
          .max(12)
          .default(3)
          .describe("Number of months to look back, including current month"),
      }),
      execute: async ({ months }) => {
        const { y, m } = todayParts();
        const oldestFrom = ymd(y, m - (months - 1), 1);
        const newestTo = ymd(y, m + 1, 0);
        const { data, error } = await supabase
          .from("transactions")
          .select("amount, type, date")
          .eq("user_id", userId)
          .gte("date", oldestFrom)
          .lte("date", newestTo);
        if (error) return { error: error.message };
        const byMonth: Record<
          string,
          { month: string; totalIncome: number; totalExpense: number; balance: number }
        > = {};
        for (let i = months - 1; i >= 0; i--) {
          const key = ymd(y, m - i, 1).slice(0, 7);
          byMonth[key] = { month: key, totalIncome: 0, totalExpense: 0, balance: 0 };
        }
        for (const t of data ?? []) {
          const key = t.date.slice(0, 7);
          if (!byMonth[key]) continue;
          const amt = Number(t.amount);
          if (t.type === "income") byMonth[key].totalIncome += amt;
          else byMonth[key].totalExpense += amt;
        }
        const trend = Object.values(byMonth).map((r) => ({
          ...r,
          balance: r.totalIncome - r.totalExpense,
        }));
        return { trend };
      },
    }),

    getTopExpenses: tool({
      description:
        "Get the largest individual expenses. Use when the user asks what their biggest expenses were, or wants to know where most money was spent.",
      inputSchema: z.object({
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(5)
          .describe("Number of top expenses to return"),
        month: z
          .string()
          .optional()
          .describe("Month in YYYY-MM format. Defaults to the current month."),
      }),
      execute: async ({ limit, month }) => {
        const { from, to } = monthRange(month || currentMonth());
        const { data, error } = await supabase
          .from("transactions")
          .select("amount, description, category_key, date")
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", from)
          .lte("date", to)
          .order("amount", { ascending: false })
          .limit(limit);
        if (error) return { error: error.message };
        return { from, to, expenses: data ?? [] };
      },
    }),

    getBalance: tool({
      description:
        "Get current balance and compare with the previous month. Use when the user asks about their financial health, savings rate, or how this month compares to last month.",
      inputSchema: z.object({
        month: z
          .string()
          .optional()
          .describe("Month to check in YYYY-MM format. Defaults to the current month."),
      }),
      execute: async ({ month }) => {
        const target = month || currentMonth();
        const [ty, tm] = target.split("-").map(Number);
        const prevKey = ymd(ty, tm - 2, 1).slice(0, 7);

        async function summary(key: string) {
          const { from, to } = monthRange(key);
          const { data, error } = await supabase
            .from("transactions")
            .select("amount, type")
            .eq("user_id", userId)
            .gte("date", from)
            .lte("date", to);
          if (error) return { totalIncome: 0, totalExpense: 0, balance: 0, error: error.message };
          let totalIncome = 0;
          let totalExpense = 0;
          for (const t of data ?? []) {
            const amt = Number(t.amount);
            if (t.type === "income") totalIncome += amt;
            else totalExpense += amt;
          }
          return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
        }

        const current = await summary(target);
        const previous = await summary(prevKey);
        const change = current.balance - previous.balance;
        const changePercent =
          previous.balance !== 0
            ? +((change / Math.abs(previous.balance)) * 100).toFixed(1)
            : null;
        const savingsRate =
          current.totalIncome > 0
            ? +((current.balance / current.totalIncome) * 100).toFixed(1)
            : null;
        return {
          currentMonth: { month: target, ...current },
          previousMonth: { month: prevKey, ...previous },
          change,
          changePercent,
          savingsRate,
        };
      },
    }),

    compareMonths: tool({
      description:
        "Compare spending between two specific months side by side, including a per-category breakdown and percentage changes. Use this (instead of calling getCategoryBreakdown twice) whenever the user asks to compare two months, e.g. 'compare April and May'. It renders a visual comparison chart.",
      inputSchema: z.object({
        monthA: z
          .string()
          .optional()
          .describe(
            "Earlier month in YYYY-MM format. Defaults to the month before monthB."
          ),
        monthB: z
          .string()
          .optional()
          .describe("Later month in YYYY-MM format. Defaults to the current month."),
      }),
      execute: async ({ monthA, monthB }) => {
        const b = monthB || currentMonth();
        const [by, bm] = b.split("-").map(Number);
        const a = monthA || ymd(by, bm - 2, 1).slice(0, 7);

        async function expenseTotals(key: string) {
          const { from, to } = monthRange(key);
          const { data, error } = await supabase
            .from("transactions")
            .select("amount, category_key")
            .eq("user_id", userId)
            .eq("type", "expense")
            .gte("date", from)
            .lte("date", to);
          if (error) return { total: 0, byCategory: {} as Record<string, number> };
          const byCategory: Record<string, number> = {};
          let total = 0;
          for (const t of data ?? []) {
            const k = t.category_key || "uncategorized";
            const amt = Number(t.amount);
            byCategory[k] = (byCategory[k] ?? 0) + amt;
            total += amt;
          }
          return { total, byCategory };
        }

        const [ra, rb] = await Promise.all([expenseTotals(a), expenseTotals(b)]);
        const pct = (curr: number, prev: number) =>
          prev > 0 ? +(((curr - prev) / prev) * 100).toFixed(1) : curr > 0 ? null : 0;

        const keys = Array.from(
          new Set([...Object.keys(ra.byCategory), ...Object.keys(rb.byCategory)])
        );
        const categories = keys
          .map((category_key) => {
            const totalA = ra.byCategory[category_key] ?? 0;
            const totalB = rb.byCategory[category_key] ?? 0;
            return {
              category_key,
              totalA,
              totalB,
              change: totalB - totalA,
              changePercent: pct(totalB, totalA),
            };
          })
          .sort((x, y) => Math.max(y.totalA, y.totalB) - Math.max(x.totalA, x.totalB));

        return {
          monthA: { month: a, total: ra.total },
          monthB: { month: b, total: rb.total },
          totalChange: rb.total - ra.total,
          totalChangePercent: pct(rb.total, ra.total),
          categories,
        };
      },
    }),
  };
}
