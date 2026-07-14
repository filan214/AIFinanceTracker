import { describe, it, expect } from "vitest";
import { buildReportDoc, type ReportPdfOptions } from "./report-pdf";
import type { ReportData, AIReportContent } from "@/types/report";

const data: ReportData = {
  month: "2026-07",
  generatedAt: "2026-07-31T00:00:00.000Z",
  metrics: {
    totalSpent: 4250000,
    totalIncome: 6000000,
    saved: 1750000,
    savingsRate: 29,
    spentChange: 12,
    incomeChange: 3,
    savingsRateStatus: "above_average",
  },
  categoryBreakdown: [
    { categoryKey: "food", total: 1200000, vsLastMonth: 8 },
    { categoryKey: "transport", total: 800000, vsLastMonth: -5 },
    { categoryKey: "shopping", total: 540000, vsLastMonth: 0 },
    { categoryKey: "uncategorized", total: 210000, vsLastMonth: 40 },
  ],
  monthlyTrend: [
    { month: "2026-02", totalSpent: 3800000 },
    { month: "2026-03", totalSpent: 4100000 },
    { month: "2026-04", totalSpent: 3950000 },
    { month: "2026-05", totalSpent: 4300000 },
    { month: "2026-06", totalSpent: 3790000 },
    { month: "2026-07", totalSpent: 4250000 },
  ],
  biggestMovers: [
    { categoryKey: "food", previousMonth: 900000, thisMonth: 1200000, changePercent: 33, changeAbsolute: 300000, direction: "up" },
    { categoryKey: "transport", previousMonth: 950000, thisMonth: 800000, changePercent: 16, changeAbsolute: 150000, direction: "down" },
  ],
  highlights: {
    mostExpensiveDay: { date: "2026-07-14", description: "Grocery run at Superindo", amount: 480000 },
    topCategory: { categoryKey: "food", percentage: 28 },
    transactionCount: { total: 59, averageAmount: 72000 },
    newSubscriptions: { count: 2, names: ["Spotify", "Netflix"] },
  },
};

const ai: AIReportContent = {
  summary: {
    paragraph1:
      "You spent Rp 4.250.000 this month against Rp 6.000.000 income, saving 29% which is above the typical range. ".repeat(3),
    paragraph2:
      "**Food & Drink** rose 33% versus last month, the biggest mover, driven by more frequent dining out. ".repeat(2),
    paragraph3:
      "On the bright side, transport fell 16%. Your most notable outlier was a Rp 480K grocery run on July 14.",
  },
  recommendations: [
    { id: "01", title: "Cap dining out", description: "Set a weekly Rp 300K limit for restaurants and cafes to pull food spending back toward last month.", outcome: "Save ~Rp 300K" },
    { id: "02", title: "Review subscriptions", description: "Two new subscriptions started this month. Cancel any you no longer use.", outcome: "Save ~Rp 120K" },
    { id: "03", title: "Automate savings", description: "Move 29% to savings on payday so it is set aside before discretionary spending.", outcome: "Lock in 29%" },
  ],
};

const identity = (k: string) => k;
const base: ReportPdfOptions = {
  data,
  ai,
  monthLabel: "July 2026",
  periodMeta: "1-31 July 2026",
  locale: "en",
  t: identity,
  tCat: identity,
};

// A jsPDF document serialized to bytes must begin with the PDF magic header.
function pdfMagic(doc: ReturnType<typeof buildReportDoc>): string {
  return Buffer.from(doc.output("arraybuffer")).subarray(0, 5).toString("latin1");
}

describe("buildReportDoc", () => {
  it("produces a valid PDF for a full report", () => {
    const doc = buildReportDoc(base);
    expect(pdfMagic(doc)).toBe("%PDF-");
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("handles a report with no AI content", () => {
    const doc = buildReportDoc({ ...base, ai: null });
    expect(pdfMagic(doc)).toBe("%PDF-");
  });

  it("handles empty highlights and the Indonesian locale", () => {
    const doc = buildReportDoc({
      ...base,
      locale: "id",
      data: {
        ...data,
        highlights: {
          mostExpensiveDay: null,
          topCategory: null,
          transactionCount: { total: 0, averageAmount: 0 },
          newSubscriptions: { count: 0, names: [] },
        },
      },
    });
    expect(pdfMagic(doc)).toBe("%PDF-");
  });
});
