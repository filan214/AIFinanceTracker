import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Locale } from "@/i18n/locale-provider";
import { formatCurrency, formatCompactCurrency, formatDate } from "@/lib/format";
import type { ReportData, AIReportContent } from "@/types/report";

type Translate = (key: string) => string;
type RGB = readonly [number, number, number];

const INK: RGB = [24, 24, 27];
const INK_SOFT: RGB = [63, 63, 70];
const MUTED: RGB = [113, 113, 122];
const EMERALD: RGB = [16, 185, 129];
const ROSE: RGB = [225, 60, 90];
const ZEBRA: RGB = [250, 250, 249];
const BORDER: RGB = [228, 228, 231];

// jsPDF's built-in fonts are WinAnsi-only: strip **markdown** and swap the few
// glyphs the UI uses (arrows, non-breaking space, smart quotes) for ASCII so
// nothing renders as a blank box.
function clean(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[→➔↗↘]/g, "->")
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .trim();
}

export type ReportPdfOptions = {
  data: ReportData;
  ai: AIReportContent | null;
  monthLabel: string;
  periodMeta: string;
  locale: Locale;
  t: Translate; // "reports" namespace
  tCat: Translate; // "categories" namespace
};

export function buildReportDoc(opts: ReportPdfOptions): jsPDF {
  const { data, ai, monthLabel, periodMeta, locale, t, tCat } = opts;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const txt = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const draw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const money = (n: number) => clean(formatCurrency(n, locale));
  const compact = (n: number) => clean(formatCompactCurrency(n, locale));
  const catLabel = (key: string) => clean(tCat(key));
  const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;
  // Column headers we introduce (no existing i18n key), kept bilingual inline
  // to match the app's `locale === "id" ? ...` style used across components.
  const L = (id: string, en: string) => (locale === "id" ? id : en);

  function ensure(space: number) {
    if (y + space > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Section heading + short accent underline.
  function heading(text: string) {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    txt(INK);
    doc.text(clean(text), margin, y);
    y += 1.8;
    draw(EMERALD);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + 14, y);
    y += 6.5;
  }

  function paragraphs(items: string[], color: RGB, size: number, gap: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setLineHeightFactor(1.45);
    txt(color);
    for (const raw of items) {
      const lines = doc.splitTextToSize(clean(raw), contentW) as string[];
      const h = lines.length * size * doc.getLineHeightFactor() * 0.3528;
      ensure(h + gap);
      doc.text(lines, margin, y);
      y += h + gap;
    }
    doc.setLineHeightFactor(1.15);
  }

  function afterTable() {
    const last = (doc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable;
    if (last) y = last.finalY + 9;
  }

  // ---- Header band ----
  fill(INK);
  doc.rect(0, 0, pageW, 30, "F");
  fill(EMERALD);
  doc.rect(pageW - margin - 9, 12, 9, 2.6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  txt([255, 255, 255]);
  doc.text("Smart Finn Track", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  txt([190, 190, 196]);
  doc.text(
    `${locale === "id" ? "Laporan Bulanan" : "Monthly Report"} - ${clean(monthLabel)}`,
    margin,
    21
  );
  doc.setFontSize(8.5);
  doc.text(clean(periodMeta), margin, 26);
  y = 40;

  // ---- Metrics (2x2) ----
  const m = data.metrics;
  const cells = [
    { label: t("totalSpent"), value: money(m.totalSpent), sub: m.spentChange ? `${pct(m.spentChange)} ${t("vsLastMonth")}` : "" },
    { label: t("totalIncome"), value: money(m.totalIncome), sub: m.incomeChange ? `${pct(m.incomeChange)} ${t("vsLastMonth")}` : "" },
    { label: t("saved"), value: money(m.saved), sub: "" },
    {
      label: t("savingsRate"),
      value: `${m.savingsRate}%`,
      sub: t(
        m.savingsRateStatus === "above_average"
          ? "rateAbove"
          : m.savingsRateStatus === "average"
            ? "rateAverage"
            : "rateBelow"
      ),
    },
  ];
  const cellW = contentW / 2;
  const cellH = 22;
  cells.forEach((c, i) => {
    const cx = margin + (i % 2) * cellW;
    const cy = y + Math.floor(i / 2) * cellH;
    draw(BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, cellW - 4, cellH - 4, 1.6, 1.6, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    txt(MUTED);
    doc.text(clean(c.label).toUpperCase(), cx + 4, cy + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    txt(INK);
    doc.text(c.value, cx + 4, cy + 12.5);
    if (c.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      txt(MUTED);
      doc.text(clean(c.sub), cx + 4, cy + 16.5);
    }
  });
  y += Math.ceil(cells.length / 2) * cellH + 4;

  // ---- AI summary ----
  if (ai) {
    const paras = [
      ai.summary.paragraph1,
      ai.summary.paragraph2,
      ai.summary.paragraph3,
    ].filter((p) => p && p.trim());
    if (paras.length) {
      heading(t("summaryTitle"));
      paragraphs(paras, INK_SOFT, 9.5, 3);
      y += 3;
    }
  }

  // ---- Category breakdown ----
  if (data.categoryBreakdown.length) {
    heading(t("categoryBreakdown"));
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[L("Kategori", "Category"), L("Jumlah", "Amount"), t("vsLastMonth")]],
      body: data.categoryBreakdown.map((c) => [
        catLabel(c.categoryKey),
        money(c.total),
        c.vsLastMonth === 0 ? "-" : pct(c.vsLastMonth),
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: [...INK] },
      headStyles: { fillColor: [...INK], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [...ZEBRA] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
    afterTable();
  }

  // ---- Biggest movers ----
  if (data.biggestMovers.length) {
    heading(t("biggestMovers"));
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[L("Kategori", "Category"), L("Bln lalu", "Prev"), L("Bln ini", "This"), L("Perubahan", "Change")]],
      body: data.biggestMovers.map((mv) => [
        catLabel(mv.categoryKey),
        compact(mv.previousMonth),
        compact(mv.thisMonth),
        `${pct(mv.changePercent)} (${mv.direction === "up" ? "+" : "-"}${compact(mv.changeAbsolute)})`,
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: [...INK] },
      headStyles: { fillColor: [...INK], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [...ZEBRA] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      didParseCell: (d) => {
        if (d.section === "body" && d.column.index === 3) {
          const up = data.biggestMovers[d.row.index].direction === "up";
          d.cell.styles.textColor = up ? [...ROSE] : [...EMERALD];
        }
      },
    });
    afterTable();
  }

  // ---- Six-month trend ----
  if (data.monthlyTrend.length) {
    const monthShort = (key: string) => {
      const [yy, mm] = key.split("-").map(Number);
      return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
        month: "short",
        year: "numeric",
      }).format(new Date(yy, mm - 1, 1));
    };
    heading(t("sixMonthTrend"));
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[L("Bulan", "Month"), t("totalSpent")]],
      body: data.monthlyTrend.map((p) => [monthShort(p.month), money(p.totalSpent)]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: [...INK] },
      headStyles: { fillColor: [...INK], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [...ZEBRA] },
      columnStyles: { 1: { halign: "right" } },
    });
    afterTable();
  }

  // ---- Highlights ----
  const h = data.highlights;
  const highlightRows: [string, string][] = [
    [
      t("mostExpensiveDay"),
      h.mostExpensiveDay
        ? `${formatDate(h.mostExpensiveDay.date, locale)} - ${clean(h.mostExpensiveDay.description)} (${money(h.mostExpensiveDay.amount)})`
        : "-",
    ],
    [
      t("topCategory"),
      h.topCategory
        ? `${catLabel(h.topCategory.categoryKey)} (${h.topCategory.percentage}% ${t("ofSpending")})`
        : "-",
    ],
    [
      t("transactions"),
      `${h.transactionCount.total} ${t("transactionsUnit")} - ${money(h.transactionCount.averageAmount)} ${t("average")}`,
    ],
    [
      t("newSubscriptions"),
      h.newSubscriptions.count > 0
        ? `${h.newSubscriptions.count} ${t("detected")}: ${clean(h.newSubscriptions.names.join(", "))}`
        : t("noneDetected"),
    ],
  ];
  heading(t("highlights"));
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: highlightRows.map(([k, v]) => [k, v]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: [...INK] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [...MUTED] },
      1: { textColor: [...INK] },
    },
    theme: "plain",
  });
  afterTable();

  // ---- AI recommendations ----
  if (ai && ai.recommendations.length) {
    heading(t("aiRecommendations"));
    for (const r of ai.recommendations) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(clean(r.description), contentW) as string[];
      const blockH = 5 + descLines.length * 4 + (r.outcome ? 6 : 3);
      ensure(blockH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      txt(INK);
      doc.text(clean(`${r.id}. ${r.title}`), margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      txt(MUTED);
      doc.text(descLines, margin, y);
      y += descLines.length * 4;
      if (r.outcome) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        txt(EMERALD);
        doc.text(clean(`> ${r.outcome}`), margin, y);
        y += 6;
      } else {
        y += 3;
      }
    }
  }

  // ---- Footer on every page ----
  const generated =
    (locale === "id" ? "Dibuat " : "Generated ") + formatDate(new Date(), locale);
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    txt(MUTED);
    doc.text(generated, margin, pageH - 8);
    doc.text(`${p} / ${pages}`, pageW - margin, pageH - 8, { align: "right" });
  }

  return doc;
}

// Build + trigger the browser download. Kept separate from buildReportDoc so
// the generation logic can be unit-tested without a DOM.
export function downloadReportPdf(opts: ReportPdfOptions): void {
  buildReportDoc(opts).save(`smart-finn-track-report-${opts.data.month}.pdf`);
}
