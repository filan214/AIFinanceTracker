import type { ExpenseCategoryKey } from "./draft";

// Deterministic keyword fallback for when the AI categorizer is unavailable
// (rate-limited, out of credits) or replies with something unusable. Checked
// in order, so more specific words ("grabfood") come before generic ones ("grab").
const RULES: [ExpenseCategoryKey, string[]][] = [
  ["food", ["makan", "makanan", "minum", "minuman", "kopi", "nasi", "mie", "bakso", "sate", "ayam", "warteg", "resto", "restoran", "kafe", "cafe", "jajan", "snack", "sarapan", "martabak", "gofood", "grabfood", "shopeefood", "groceries", "sayur", "buah", "lunch", "dinner", "breakfast", "coffee", "food"]],
  ["transport", ["bensin", "pertalite", "pertamax", "solar", "bbm", "parkir", "tol", "gojek", "goride", "grab", "grabbike", "grabcar", "ojek", "ojol", "taksi", "taxi", "bus", "kereta", "krl", "mrt", "lrt", "transjakarta", "angkot", "fuel", "gas station", "parking", "toll", "uber"]],
  ["education", ["kuliah", "ukt", "spp", "sekolah", "kursus", "les", "buku", "seminar", "pelatihan", "udemy", "coursera", "tuition", "course", "training", "books"]],
  ["bills", ["listrik", "pln", "token", "pdam", "internet", "wifi", "indihome", "pulsa", "kuota", "sewa", "kos", "kost", "kontrakan", "asuransi", "bpjs", "cicilan", "tagihan", "rent", "electricity", "insurance", "bill"]],
  ["health", ["obat", "apotek", "dokter", "klinik", "rumah sakit", "vitamin", "gym", "fitness", "medicine", "doctor", "hospital", "pharmacy", "clinic"]],
  ["entertainment", ["netflix", "spotify", "youtube", "disney", "bioskop", "nonton", "film", "konser", "game", "steam", "movie", "cinema", "concert"]],
  ["savings", ["tabungan", "nabung", "investasi", "reksadana", "saham", "deposito", "emas", "savings", "investment"]],
  ["shopping", ["baju", "sepatu", "celana", "tas", "kaos", "jaket", "shopee", "tokopedia", "lazada", "belanja", "clothes", "shoes", "shopping"]],
];

// Whole-word (or whole-phrase) match, so "tol" doesn't match "stolen".
export function guessCategory(description: string): ExpenseCategoryKey | null {
  const text = ` ${description.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  if (text.trim() === "") return null;
  for (const [category, words] of RULES) {
    if (words.some((w) => text.includes(` ${w} `))) return category;
  }
  return null;
}
