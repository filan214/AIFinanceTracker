// Report page data model.
// Split per the redesign: everything in ReportData is computed from the DB,
// everything in AIReportContent is LLM-generated (and cached in ai_insights.content).

export type SavingsRateStatus = "above_average" | "average" | "below_average";

export interface ReportMetrics {
  totalSpent: number;
  totalIncome: number;
  saved: number;
  savingsRate: number; // percentage, e.g. 24
  spentChange: number; // % vs last month (positive = up)
  incomeChange: number | null;
  savingsRateStatus: SavingsRateStatus;
}

export interface ReportCategory {
  categoryKey: string;
  total: number;
  vsLastMonth: number; // % change
}

export interface ReportTrendPoint {
  month: string; // "2026-01"
  totalSpent: number;
}

export interface ReportMover {
  categoryKey: string;
  previousMonth: number;
  thisMonth: number;
  changePercent: number;
  changeAbsolute: number;
  direction: "up" | "down";
}

export interface ReportHighlights {
  mostExpensiveDay: { date: string; description: string; amount: number } | null;
  topCategory: { categoryKey: string; percentage: number } | null;
  transactionCount: { total: number; averageAmount: number };
  newSubscriptions: { count: number; names: string[] };
}

export interface ReportData {
  month: string; // "2026-05"
  generatedAt: string; // ISO date
  metrics: ReportMetrics;
  categoryBreakdown: ReportCategory[];
  monthlyTrend: ReportTrendPoint[];
  biggestMovers: ReportMover[];
  highlights: ReportHighlights;
}

export interface AIReportSummary {
  paragraph1: string; // overall spending + income + savings rate
  paragraph2: string; // biggest category change + why
  paragraph3: string; // positive note + outlier transaction
}

export interface AIReportRecommendation {
  id: string; // "01" | "02" | "03"
  title: string;
  description: string;
  outcome: string; // short outcome label, e.g. "Save Rp 60K"
}

export interface AIReportContent {
  summary: AIReportSummary;
  recommendations: AIReportRecommendation[];
}
