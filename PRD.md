# PRD — Smart Finn Track

**Nama Produk:** Smart Finn Track  
**Tagline:** Your AI-powered personal finance companion  
**Versi:** 1.3  
**Tanggal:** 15 Mei 2026  
**Status:** Draft  
**Author:** Filan  

---

## Daftar Isi

1. [Ringkasan Produk](#1-ringkasan-produk)
2. [Latar Belakang & Motivasi](#2-latar-belakang--motivasi)
3. [Tujuan Produk](#3-tujuan-produk)
4. [Target Pengguna](#4-target-pengguna)
5. [Core Features](#5-core-features)
6. [Internasionalisasi — Multi-Language](#6-internasionalisasi--multi-language)
7. [User Workflow](#7-user-workflow)
8. [Tech Stack](#8-tech-stack)
9. [Arsitektur Sistem](#9-arsitektur-sistem)
10. [Database Schema](#10-database-schema)
11. [AI Integration](#11-ai-integration)
12. [UI/UX Design System](#12-uiux-design-system)
13. [Frontend Implementation Guide](#13-frontend-implementation-guide)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Batasan & Asumsi](#15-batasan--asumsi)
16. [Metrik Keberhasilan](#16-metrik-keberhasilan)
17. [Roadmap](#17-roadmap)

---

## 1. Ringkasan Produk

**Smart Finn Track** adalah aplikasi web manajemen keuangan pribadi yang menggabungkan pencatatan transaksi harian dengan analisis cerdas berbasis AI. Nama "Smart Finn Track" mencerminkan tiga pilar produk: kecerdasan AI (*Smart*), keuangan (*Finn*, dari *finance*), dan pelacakan pengeluaran (*Track*).

Pengguna dapat mencatat pemasukan dan pengeluaran, mendapatkan kategorisasi otomatis, melihat visualisasi keuangan, dan berkonsultasi dengan AI advisor yang memahami data keuangan mereka secara personal.

Aplikasi tersedia dalam dua bahasa — **Bahasa Indonesia** dan **English** — yang dapat dipilih pengguna kapan saja. Seluruh antarmuka, notifikasi, laporan AI, dan respons chat advisor menyesuaikan bahasa yang dipilih secara konsisten.

Aplikasi ini dibangun sebagai project portofolio full-stack dengan menggunakan teknologi modern yang relevan di industri, dengan total biaya operasional Rp 0 per bulan.

---

## 2. Latar Belakang & Motivasi

Mayoritas aplikasi keuangan yang ada di pasaran memiliki dua masalah utama: terlalu kompleks untuk penggunaan harian, atau terlalu sederhana sehingga tidak memberikan insight yang berarti. Pengguna sering kali tahu bahwa mereka harus mencatat keuangan, tapi berhenti karena prosesnya terasa merepotkan.

Dengan memanfaatkan AI untuk mengotomasi kategorisasi dan menghasilkan insight naratif, hambatan pencatatan keuangan dapat diminimalkan sekaligus nilai yang didapatkan pengguna menjadi jauh lebih tinggi dibanding aplikasi spreadsheet biasa.

Dukungan multi-bahasa ditambahkan agar aplikasi dapat menjangkau pengguna yang lebih luas — baik pengguna lokal Indonesia maupun pengguna internasional — serta memperkuat nilai portofolio dengan mendemonstrasikan kemampuan implementasi i18n dalam aplikasi full-stack.

---

## 3. Tujuan Produk

### Tujuan utama

- Membangun aplikasi manajemen keuangan yang mudah digunakan sehari-hari
- Mengintegrasikan AI untuk mengotomasi proses yang biasanya membutuhkan effort manual
- Menghasilkan insight keuangan yang dapat langsung ditindaklanjuti
- Mendukung dua bahasa (Indonesia dan English) secara penuh dan konsisten

### Tujuan portofolio

- Mendemonstrasikan kemampuan full-stack development dengan Next.js, Supabase, dan TypeScript
- Menunjukkan implementasi nyata integrasi AI API (Google Gemini) dalam aplikasi web
- Mendemonstrasikan implementasi i18n (internasionalisasi) yang proper dalam aplikasi Next.js
- Menampilkan kualitas UI/UX production-grade dengan design system yang konsisten
- Menyediakan aplikasi yang dapat di-demo secara live via URL publik

---

## 4. Target Pengguna

### Persona utama

**Mahasiswa atau fresh graduate** (18–26 tahun) yang:
- Mulai mengelola keuangan sendiri untuk pertama kali
- Terbiasa dengan aplikasi mobile/web modern
- Punya keterbatasan waktu untuk mencatat keuangan secara detail
- Ingin tahu ke mana uangnya pergi setiap bulan
- Bisa berbahasa Indonesia atau English (atau keduanya)

### Pain points yang diselesaikan

| Pain Point | Solusi di App |
|---|---|
| Malas memilih kategori manual | Kategorisasi otomatis oleh AI |
| Tidak tahu pola pengeluaran sendiri | Dashboard visual + laporan naratif |
| Tidak ada yang mengingatkan kalau boros | Deteksi anomali otomatis |
| Harus hitung sendiri untuk dapat insight | Chat advisor yang menjawab pertanyaan spesifik |
| Aplikasi keuangan hanya tersedia satu bahasa | Pilihan bahasa Indonesia atau English |

---

## 5. Core Features

### Feature 1 — Pencatatan transaksi

Pengguna mencatat pemasukan dan pengeluaran harian dengan input yang seminimal mungkin.

**Input yang dibutuhkan:**
- Jumlah (angka)
- Deskripsi singkat (teks bebas — boleh dalam bahasa apapun)
- Tanggal (default: hari ini)
- Tipe: pemasukan atau pengeluaran

**Behaviour:**
- Setelah disimpan, AI otomatis memproses kategori di background
- Pengguna tidak perlu menunggu — transaksi langsung muncul di list
- Kategori hasil AI bisa diubah manual jika kurang tepat
- Label UI mengikuti bahasa yang dipilih pengguna

---

### Feature 2 — Kategorisasi otomatis dengan AI

Setiap transaksi baru dikirim ke Gemini API untuk diklasifikasikan ke dalam kategori standar.

**Kategori tersedia (bilingual):**

| Bahasa Indonesia | English | Key internal |
|---|---|---|
| Makanan & minuman | Food & drinks | `food` |
| Transportasi | Transportation | `transport` |
| Hiburan & rekreasi | Entertainment | `entertainment` |
| Belanja & fashion | Shopping & fashion | `shopping` |
| Tagihan & utilitas | Bills & utilities | `bills` |
| Kesehatan | Healthcare | `health` |
| Pendidikan | Education | `education` |
| Tabungan & investasi | Savings & investment | `savings` |
| Pemasukan | Income | `income` |

**Behaviour:**
- AI menerima deskripsi transaksi dalam bahasa apapun dan tetap menghasilkan kategori yang tepat
- Kategori disimpan di database sebagai key internal (bukan label bahasa)
- Label kategori yang ditampilkan di UI selalu dalam bahasa pilihan pengguna
- Pengguna bisa tap kategori untuk mengubah manual

---

### Feature 3 — Dashboard keuangan

Halaman utama berisi ringkasan visual keuangan bulan berjalan.

**Komponen dashboard:**
- **Ringkasan angka:** total pemasukan, total pengeluaran, dan sisa saldo bulan ini
- **Donut chart:** breakdown pengeluaran per kategori
- **Line chart:** trend pengeluaran harian sepanjang bulan
- **Kartu perbandingan:** persentase perubahan dibanding bulan lalu
- **Notifikasi anomali:** card peringatan jika ada pola tidak wajar

Semua label, judul, dan teks pada dashboard mengikuti bahasa pilihan pengguna.

---

### Feature 4 — Deteksi pengeluaran tidak wajar

AI secara berkala menganalisis pola pengeluaran dan memberi peringatan jika ditemukan anomali.

**Jenis anomali yang dideteksi:**
- Lonjakan di satu kategori yang signifikan dibanding rata-rata
- Transaksi berulang baru yang belum pernah ada sebelumnya
- Total pengeluaran mingguan melebihi rata-rata 3 minggu sebelumnya

**Behaviour:**
- Analisis berjalan otomatis setiap pengguna membuka dashboard
- Teks notifikasi dihasilkan AI dalam bahasa pilihan pengguna
- Setiap notifikasi bisa di-dismiss

---

### Feature 5 — Laporan bulanan naratif

Di awal bulan baru, AI menghasilkan laporan ringkasan bulan sebelumnya dalam format teks naratif.

**Isi laporan:**
- Ringkasan perubahan total pengeluaran vs bulan lalu
- Kategori dengan perubahan terbesar
- Highlight pengeluaran tertinggi
- 2–3 saran konkret untuk bulan berikutnya

**Contoh output (Bahasa Indonesia):**
> "Bulan Oktober kamu menghabiskan Rp 2.340.000, naik 18% dibanding September. Lonjakan terbesar ada di kategori Hiburan (+42%), kemungkinan karena ada 2 langganan baru yang masuk. Untuk November, coba pertimbangkan untuk batasi pengeluaran hiburan di bawah Rp 400.000."

**Contoh output (English):**
> "In October, you spent Rp 2,340,000 — up 18% from September. The biggest jump was in Entertainment (+42%), likely due to 2 new subscriptions. For November, consider keeping your entertainment spending under Rp 400,000."

**Behaviour:**
- Laporan dibuat dalam bahasa yang aktif saat laporan digenerate
- Jika pengguna ganti bahasa setelah laporan dibuat, laporan lama tetap dalam bahasa semula
- Laporan semua bulan tersimpan dan bisa diakses kembali

---

### Feature 6 — Chat advisor

Fitur tanya jawab AI yang memahami data transaksi pengguna.

**Contoh pertanyaan (Bahasa Indonesia):**
- "Berapa total pengeluaran makan saya bulan ini?"
- "Kategori apa yang paling boros 3 bulan terakhir?"
- "Bagaimana cara saya hemat Rp 500.000 bulan depan?"

**Contoh pertanyaan (English):**
- "How much did I spend on food this month?"
- "Which category was my biggest expense last 3 months?"
- "How can I save Rp 500,000 next month?"

**Behaviour:**
- Pengguna bisa bertanya dalam bahasa apapun — AI tetap memahami
- AI merespons dalam bahasa yang sedang aktif di preferensi pengguna
- Backend mengambil data transaksi relevan sebelum mengirim ke AI
- Riwayat chat dalam satu sesi tersimpan selama pengguna tidak menutup halaman

---

### Feature 7 — Pengaturan bahasa

Pengguna dapat memilih dan mengganti bahasa kapan saja.

**Behaviour:**
- Pilihan bahasa pertama muncul saat onboarding (setelah verifikasi email)
- Pengaturan bahasa tersimpan di profil pengguna di database
- Pengguna bisa ganti bahasa kapan saja via menu Settings
- Seluruh UI berubah secara instan tanpa full page reload
- Bahasa default: `id` (Bahasa Indonesia)

---

## 6. Internasionalisasi — Multi-Language

### 6.1 Pendekatan teknis

Aplikasi menggunakan library **`next-intl`** untuk manajemen terjemahan di Next.js App Router. Semua string UI disimpan dalam file terjemahan terstruktur, tidak ada teks yang di-hardcode di dalam komponen.

**Struktur file terjemahan:**
```
/messages
  en.json     ← semua string bahasa Inggris
  id.json     ← semua string bahasa Indonesia
```

**Contoh isi file terjemahan:**
```json
// en.json
{
  "dashboard": {
    "title": "Dashboard",
    "total_income": "Total Income",
    "total_expense": "Total Expenses",
    "balance": "Balance"
  },
  "categories": {
    "food": "Food & Drinks",
    "transport": "Transportation",
    "entertainment": "Entertainment",
    "shopping": "Shopping & Fashion",
    "bills": "Bills & Utilities",
    "health": "Healthcare",
    "education": "Education",
    "savings": "Savings & Investment",
    "income": "Income"
  }
}
```

```json
// id.json
{
  "dashboard": {
    "title": "Dashboard",
    "total_income": "Total Pemasukan",
    "total_expense": "Total Pengeluaran",
    "balance": "Sisa Saldo"
  },
  "categories": {
    "food": "Makanan & Minuman",
    "transport": "Transportasi",
    "entertainment": "Hiburan & Rekreasi",
    "shopping": "Belanja & Fashion",
    "bills": "Tagihan & Utilitas",
    "health": "Kesehatan",
    "education": "Pendidikan",
    "savings": "Tabungan & Investasi",
    "income": "Pemasukan"
  }
}
```

---

### 6.2 Bagaimana bahasa ditentukan

```
1. Preferensi tersimpan di user_profiles.language (database)  ← prioritas tertinggi
2. Pilihan eksplisit saat onboarding
3. Default: "id" (Bahasa Indonesia)
```

---

### 6.3 Bagaimana AI menggunakan bahasa

```
user_profiles.language ("en" / "id")
        ↓
API route membaca language preference
        ↓
Prompt dikirim ke Gemini dengan instruksi bahasa eksplisit
        ↓
Gemini merespons dalam bahasa yang diminta
        ↓
Teks hasil disimpan ke database (dengan tag bahasa)
        ↓
Frontend menampilkan teks sesuai bahasa aktif
```

> Kategorisasi selalu menghasilkan **key internal** (`food`, `transport`, dll) — language-agnostic, di-resolve ke label bahasa di frontend.

---

### 6.4 Format angka dan tanggal

| Format | Bahasa Indonesia (`id-ID`) | English (`en-US`) |
|---|---|---|
| Mata uang | Rp 2.340.000 | Rp 2,340,000 |
| Tanggal | 15 Mei 2026 | May 15, 2026 |
| Tanggal singkat | 15/05/2026 | 05/15/2026 |

---

## 7. User Workflow

### 7.1 Onboarding
```
Buka app → Landing page
→ Daftar dengan email + password → Verifikasi email
→ Pilih bahasa: Bahasa Indonesia / English
→ Dashboard kosong + panduan pertama
→ Input transaksi pertama → AI kategorisasi → Dashboard ter-update
```

### 7.2 Penggunaan harian
```
Buka app → Dashboard (semua teks dalam bahasa aktif)
→ Klik "+" / "Add" → Input transaksi → Simpan
→ AI proses kategori background (~1–2 detik)
→ Transaksi muncul terkategorisasi
→ Jika anomali → Notifikasi muncul
```

### 7.3 Ganti bahasa
```
Settings → Language → Pilih EN / ID
→ UI berubah seketika (< 300ms) → Tersimpan ke database
```

### 7.4 Refleksi bulanan
```
Login awal bulan baru → Pop-up laporan bulan lalu
→ Baca laporan naratif AI → Dismiss
→ Dashboard reset ke bulan baru
```

---

## 8. Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | Next.js 15 (App Router) | Frontend + API routes |
| Language | TypeScript | Type safety |
| UI Styling | Tailwind CSS | Utility-first styling |
| Charting | Recharts | Visualisasi data |
| i18n | next-intl | Multi-language EN/ID |
| Database | Supabase (PostgreSQL) | Data storage, free 500 MB |
| Auth | Supabase Auth | Login, session, RLS |
| AI | Google Gemini API (Flash) | Kategorisasi + advisor |
| Deploy | Vercel (Hobby) | Hosting + CDN + CI/CD |
| Version Control | GitHub | Source code |
| Dev Tools | ESLint + Prettier | Code quality |

**Total biaya bulanan: Rp 0**

---

## 9. Arsitektur Sistem

```
┌──────────────────────────────────────────────────────┐
│                  Vercel (Hosting)                    │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │           Next.js App (React)                │   │
│   │  next-intl Provider (reads user.language)    │   │
│   │  Pages & Components                          │   │
│   └────────────────────┬─────────────────────────┘   │
│                        │                             │
│   ┌────────────────────▼─────────────────────────┐   │
│   │           Next.js API Routes                 │   │
│   │  /api/transactions  /api/ai/categorize       │   │
│   │  /api/ai/anomaly    /api/ai/report           │   │
│   │  /api/ai/chat       /api/user/language       │   │
│   └───────┬───────────────────────┬──────────────┘   │
└───────────┼───────────────────────┼──────────────────┘
            │                       │
     ┌──────▼──────┐         ┌──────▼──────────────┐
     │  Supabase   │         │    Gemini API        │
     │  Postgres   │         │  input: prompt +     │
     │  + Auth     │         │  language param      │
     │  + RLS      │         │  output: text in     │
     └─────────────┘         │  requested language  │
                             └──────────────────────┘
```

---

## 10. Database Schema

### Tabel `user_profiles`

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| id | uuid | — | Primary key = users.id |
| language | text | `'id'` | `'id'` atau `'en'` |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | — |

### Tabel `transactions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| amount | numeric | Jumlah transaksi |
| type | text | `'income'` atau `'expense'` |
| description | text | Deskripsi bebas (bahasa apapun) |
| category_key | text | Key internal: `'food'`, `'transport'`, dll |
| date | date | Tanggal transaksi |
| created_at | timestamptz | — |

### Tabel `ai_insights`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| type | text | `'anomaly'` atau `'monthly_report'` |
| content | text | Teks hasil AI |
| language | text | `'id'` atau `'en'` |
| month | text | Format `'YYYY-MM'` |
| is_read | boolean | Status dibaca |
| created_at | timestamptz | — |

### Row Level Security (RLS)

```sql
CREATE POLICY "Users access own profile"
ON user_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users access own transactions"
ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own insights"
ON ai_insights FOR ALL USING (auth.uid() = user_id);
```

---

## 11. AI Integration

### 11.1 Kategorisasi transaksi

**Endpoint:** `POST /api/ai/categorize`  
**Model:** `gemini-2.5-flash`

```
You are a financial transaction categorizer.
Return ONLY the category key from this list:
food, transport, entertainment, shopping, bills, health, education, savings, income

Transaction: "{description}"
Return only the key. No explanation.
```

### 11.2 Deteksi anomali

**Endpoint:** `POST /api/ai/anomaly`  
**Model:** `gemini-2.5-flash`

```
Analyze the weekly spending data (IDR) and identify anomalies.

Data (last 4 weeks): {data_json}

- Respond in {language === 'en' ? 'English' : 'Bahasa Indonesia'}
- Only flag real anomalies (significant spikes, new recurring charges)
- If anomaly: explain in 1–2 sentences, actionable
- If none: respond exactly "normal"
```

### 11.3 Laporan bulanan

**Endpoint:** `POST /api/ai/report`  
**Model:** `gemini-2.5-flash`

```
Write a monthly finance summary.

{prev_month} data: {prev_data_json}
{two_months_ago} data: {older_data_json}

- Respond in {language === 'en' ? 'English' : 'Bahasa Indonesia'}
- Informal, friendly, second-person tone
- Max 4–5 sentences, no bullet points
- Cover: overall change %, biggest category change, 2–3 tips for next month
```

### 11.4 Chat advisor

**Endpoint:** `POST /api/ai/chat`  
**Model:** `gemini-2.5-flash`

```
You are a personal finance advisor with the user's transaction data.

Transaction summary (last 90 days): {transactions_summary_json}
Conversation history: {session_history}
User message: "{user_message}"

- Respond in {language === 'en' ? 'English' : 'Bahasa Indonesia'}
- Answer based strictly on the data provided
- Be concise, specific, and helpful
```

---

## 12. UI/UX Design System

### 12.1 Design references

| Referensi | Yang diadopsi |
|---|---|
| **Linear.app** | Sidebar navigation, whitespace, typography hierarchy |
| **Vercel Dashboard** | Metric cards, dark/light mode, professional data layout |
| **Monarch Money** | Finance dashboard layout, spending breakdown, transaction list |
| **Stripe Dashboard** | Data-dense tables, status badges, empty states |
| **Notion** | Typography system, readable content-heavy pages (reports) |

### 12.2 Design principles

- **Minimal but not cold** — whitespace generous, warmth dari accent color dan friendly copy
- **Data-first** — angka dan chart adalah hero, bukan elemen dekoratif
- **Trustworthy** — professional dan aman; hindari gradien mencolok atau pattern ramai
- **Fast-feeling** — setiap interaksi terasa instan; optimistic UI + skeleton loading
- **Consistent** — spacing system, border radius, dan shadow system sama di seluruh app

### 12.3 Color palette

```
Background   : white / zinc-50 (light)   |  zinc-950 / zinc-900 (dark)
Surface cards: white / zinc-100 (light)  |  zinc-800 (dark)
Primary      : emerald-500 / emerald-600  ← income, positive, CTA
Danger       : rose-500                  ← expense, warning, negative
Text primary : zinc-900
Text muted   : zinc-500
Text placeholder: zinc-400
Border       : zinc-200 (light) | zinc-700 (dark)
```

### 12.4 Typography

```
Font         : Inter (next/font/google)
Page title   : text-2xl font-semibold
Section title: text-lg font-medium
Card label   : text-xs font-medium uppercase tracking-wide text-zinc-500
Body         : text-sm text-zinc-700
Currency     : font-mono (untuk alignment di tabel)
```

### 12.5 Layout — Authenticated pages

```
┌─────────────────────────────────────────────┐
│ Sidebar (240px fixed)  │  Main content area │
│                        │                    │
│  Logo: Smart Finn Track│  Page header       │
│                        │  (title + actions) │
│  Nav items:            │                    │
│  - Dashboard           │  Content           │
│  - Transactions        │                    │
│  - Reports             │                    │
│  - Chat Advisor        │                    │
│  - Settings            │                    │
│                        │                    │
│  [Language toggle]     │                    │
│  [User avatar + email] │                    │
└─────────────────────────────────────────────┘
```

Mobile: sidebar collapses to bottom tab bar (5 items).

---

## 13. Frontend Implementation Guide

### 13.1 Reusable components

| Komponen | Deskripsi |
|---|---|
| `Skeleton` | Base animate-pulse component, reusable dengan className prop |
| `MetricCard` | Icon + label + value + optional % change badge |
| `TransactionRow` | Date + category badge + description + colored amount |
| `CategoryBadge` | Colored pill dengan category icon dan label |
| `AnomalyAlert` | Yellow warning card dengan dismiss button |
| `SkeletonDashboard` | Full dashboard skeleton layout |
| `SkeletonTable` | Configurable rows skeleton |
| `ChatBubble` | Message bubble (user vs AI, alignment berbeda) |
| `EmptyState` | Illustration + title + subtitle + optional CTA |

### 13.2 Skeleton loading — wajib di semua halaman

```tsx
// components/ui/skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700",
        className
      )}
    />
  )
}
```

**Skeleton per halaman:**

| Halaman | Elemen yang di-skeleton |
|---|---|
| Dashboard | 3 metric cards (h-24), donut chart (circle w-48 h-48), line chart (h-48), 5 transaction rows (h-12) |
| Transactions | 8 rows dengan varying widths (table header tetap muncul) |
| Reports | 3 paragraph lines (w-full, w-4/5, w-3/5) per report card |
| Chat | Skeleton bubbles alternating left/right |
| Settings | Avatar circle + 2 lines (hanya profile section) |

### 13.3 Empty states

| Halaman | Copy |
|---|---|
| Dashboard | "No transactions yet" + "Add your first transaction" button |
| Transactions | Sama dengan dashboard |
| Reports | "Your first report will appear at the start of next month" |
| Chat | "Ask me anything about your finances" + 3 suggested prompts |

### 13.4 Page-specific notes

**Dashboard:**
- Metric cards: Income | Expenses | Balance (Balance paling prominent)
- Chart: donut kiri, line chart kanan (stacked di mobile)
- Recent transactions: 5 terakhir + "View all" link

**Transactions page:**
- Sticky filter bar: month picker + category filter + search
- Tabel: Date | Description | Category | Amount | Actions
- Amount: hijau untuk income, merah untuk expense, font-mono
- Inline edit on row click

**Chat advisor page:**
- Referensi layout: Claude.ai / ChatGPT
- Sticky input bar di bawah
- AI messages: label "Smart Finn Track AI"
- Suggested prompts saat chat kosong

**Landing page:**
- Hero: nama + tagline + mockup/screenshot + "Get started free"
- 3 feature highlights: AI categorization, Smart insights, Multi-language

### 13.5 Accessibility requirements

- Semua elemen interaktif: `focus-visible` styles
- Color contrast: minimum AA (4.5:1 untuk teks)
- Loading states: `aria-busy` dan `aria-label`
- Skeleton: `role="status"` + `aria-label="Loading..."`

---

## 14. Non-Functional Requirements

### Performa
- Dashboard FCP: < 2 detik
- Simpan transaksi: < 1 detik (tidak menunggu AI)
- Kategorisasi AI: < 3 detik (background)
- Language switch: < 300ms tanpa full reload
- Skeleton loading di semua halaman — tidak ada blank screen atau layout shift

### Keamanan
- Semua data protected by Row Level Security (RLS)
- `GEMINI_API_KEY` hanya di server-side, tidak pernah expose ke browser
- Autentikasi via Supabase Auth dengan session management aman

### Ketersediaan
- Uptime 99.9% via Vercel + Supabase infrastructure
- Jika Gemini API down: app tetap berjalan, fitur AI di-disable sementara
- Error message tampil dalam bahasa aktif pengguna

### Skalabilitas
- File terjemahan mudah diperluas untuk bahasa ketiga
- Category key system: tambah bahasa baru tanpa migrasi database
- Supabase free 500 MB: cukup untuk ±5 tahun data harian satu pengguna
- Gemini free 500 req/day: cukup untuk 10–15 transaksi/hari

---

## 15. Batasan & Asumsi

### Batasan

- Dua bahasa saja di v1.0 (ID + EN)
- Laporan AI tidak di-regenerate saat ganti bahasa
- Satu pengguna per akun, tidak ada multi-user
- Tidak ada koneksi ke rekening bank — pencatatan manual
- Tidak ada fitur budgeting di v1.0
- Hanya Rupiah (IDR)
- Hanya web app (responsive, bukan native mobile)

### Asumsi

- Pengguna memiliki akses internet
- Browser modern (Chrome, Firefox, Safari terbaru)
- Deskripsi transaksi boleh bahasa apapun — Gemini tetap mengkategorikan
- Pengguna memahami salah satu dari dua bahasa yang tersedia

---

## 16. Metrik Keberhasilan

| Metrik | Target |
|---|---|
| Live demo tersedia | URL publik bisa diakses |
| 7 core features berfungsi | 100% end-to-end |
| Multi-language penuh | UI + AI output + notifikasi mengikuti bahasa pilihan |
| Language switch instan | < 300ms tanpa full reload |
| AI kategorisasi akurat | ≥ 85% pada percobaan manual |
| AI output bahasa benar | 100% sesuai preferensi pengguna |
| Chat advisor relevan | Menjawab dari data user, bukan generik |
| Dashboard load time | < 2 detik koneksi normal |
| Skeleton loading | Tampil di semua halaman saat fetching |
| Biaya operasional | Rp 0 / bulan |

---

## 17. Roadmap

### v1.0 — MVP (Target: 4–6 minggu)

- [ ] Setup Next.js 15 + Supabase + TypeScript
- [ ] Setup `next-intl` dengan `en.json` dan `id.json`
- [ ] Tabel `user_profiles` dengan kolom `language`
- [ ] Autentikasi (register, login, logout)
- [ ] Onboarding — pilih bahasa di awal
- [ ] Pencatatan transaksi CRUD
- [ ] Kategorisasi otomatis via Gemini (output: category key)
- [ ] Dashboard dengan chart (bilingual labels)
- [ ] Settings — ganti bahasa kapan saja
- [ ] Deploy ke Vercel

### v1.1 — AI Features (Target: +2 minggu)

- [ ] Deteksi anomali (output dalam bahasa aktif)
- [ ] Laporan bulanan naratif (output dalam bahasa aktif)
- [ ] Chat advisor (respons dalam bahasa aktif)

### v1.2 — Polish (Target: +1 minggu)

- [ ] Skeleton loading pada semua halaman
- [ ] Responsive mobile design + bottom tab bar
- [ ] Dark mode
- [ ] Format angka dan tanggal per locale (`id-ID` / `en-US`)
- [ ] Export data ke CSV
- [ ] Onboarding flow yang lebih smooth
- [ ] Empty states di semua halaman
- [ ] Accessibility audit (focus styles, ARIA labels, contrast)

### v2.0 — Future (Opsional)

- Bahasa ketiga (Melayu, Mandarin)
- Regenerasi laporan dalam bahasa baru
- Fitur budgeting (set batas per kategori)
- Import transaksi dari CSV bank
- Multi-currency support
- Recurring transaction otomatis

---

*Dokumen ini merupakan living document — akan diperbarui seiring perkembangan project.*
