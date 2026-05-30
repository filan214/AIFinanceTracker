# Chat Advisor — Missing Features
# Smart Finn Track v1.4 Addition

Dokumen ini mendefinisikan fitur-fitur yang terlihat di implementasi target
namun belum terdefinisi di PRD. Semua fitur di sini adalah **frontend + database
changes only** — tidak mengubah AI pipeline yang sudah ada.

---

## Analisa gap: PRD vs screenshot

| Fitur | Di PRD | Di screenshot | Status |
|---|---|---|---|
| Streaming chat | ✅ | ✅ | Done |
| Tool calls | ✅ | ✅ | Done |
| Suggested prompts | ✅ (4 prompts) | ✅ (6 prompts, grid 2x3) | Needs update |
| Conversation history sidebar | ❌ | ✅ | **Missing** |
| Session persistence ke DB | ❌ | ✅ | **Missing** |
| Auto-generated session title | ❌ | ✅ | **Missing** |
| Personalized greeting | ❌ | ✅ | **Missing** |
| Context transparency card | ❌ | ✅ | **Missing** |
| Privacy disclaimer | ❌ | ✅ | **Missing** |
| Keyboard shortcut hints | ❌ | ✅ | **Missing** |
| Attachment button | ❌ | ✅ | **Missing** |
| Quick action button | ❌ | ✅ | **Missing** |

---

## Feature 1 — Conversation history sidebar

### Deskripsi
Panel kiri menampilkan daftar sesi percakapan yang tersimpan, dikelompokkan
berdasarkan waktu. User bisa klik sesi lama untuk membaca kembali atau
melanjutkan percakapan.

### Tampilan
```
LEFT SIDEBAR (240px)
─────────────────────
TODAY
  □ Food spending this month
  □ Entertainment anomaly

YESTERDAY
  □ April savings plan

OLDER
  □ Compare March & April
  □ Can I afford a laptop?

─────────────────────
ⓘ Your data is not retained
  by the model. Each
  conversation is sandboxed
  by session.
```

### Behaviour
- Sesi dikelompokkan: TODAY / YESTERDAY / OLDER
- Judul sesi di-generate otomatis dari pesan pertama (lihat Feature 3)
- Klik sesi → load pesan dari database → tampilkan di area chat
- Sesi aktif: bold atau highlighted
- Sesi baru dibuat otomatis saat user mulai percakapan baru
- Tombol "+ New chat" di atas list (opsional)

### Database schema tambahan

```sql
-- Tabel baru: chat_sessions
CREATE TABLE chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'New conversation',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Tabel baru: chat_messages
CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        text NOT NULL, -- 'user' | 'assistant'
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- RLS
CREATE POLICY "Users access own sessions"
ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own messages"
ON chat_messages FOR ALL
USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);
```

### API endpoints tambahan

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/chat/sessions` | GET | Ambil semua sesi user (untuk sidebar) |
| `/api/chat/sessions` | POST | Buat sesi baru, return session_id |
| `/api/chat/sessions/[id]` | GET | Ambil pesan dalam satu sesi |
| `/api/chat/sessions/[id]` | DELETE | Hapus sesi |
| `/api/chat/sessions/[id]/title` | PATCH | Update judul sesi |

---

## Feature 2 — Session persistence

### Deskripsi
Setiap pesan (user + assistant) disimpan ke database sehingga percakapan
bisa diakses kembali setelah halaman ditutup.

### Behaviour
- Saat user kirim pesan: simpan ke `chat_messages` dengan `role: 'user'`
- Setelah AI selesai streaming: simpan ke `chat_messages` dengan `role: 'assistant'`
- Saat load sesi lama: fetch semua messages dari `chat_messages` WHERE session_id = X
- Pass messages yang diload ke `useChat` sebagai `initialMessages`

### Alur lengkap

```
User buka /chat → fetch daftar sesi dari DB → tampilkan di sidebar
      ↓
User klik sesi lama → fetch messages sesi itu → set sebagai initialMessages
      ↓
User kirim pesan baru → simpan ke DB → stream ke AI → simpan response ke DB
```

### Implementasi di API route

```ts
// Setelah streamText selesai (onFinish callback):
onFinish: async ({ text }) => {
  // Simpan pesan user
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: userMessage,
  })
  // Simpan respons AI
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: text,
  })
  // Update updated_at di chat_sessions
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}
```

### Privacy note
Sesuai disclaimer di sidebar: **"Each conversation is sandboxed by session"**
— artinya AI tidak membawa context dari sesi sebelumnya ke sesi baru.
Setiap sesi mulai fresh. Hanya messages dalam sesi yang sama yang dikirim
sebagai conversation history ke AI.

---

## Feature 3 — Auto-generated session title

### Deskripsi
Judul sesi di-generate otomatis dari pesan pertama user, bukan dari
timestamp. Hasilnya lebih informatif di sidebar ("Food spending this month"
lebih bermakna dari "Chat - 15 Mei 2026").

### Behaviour
- Trigger: saat pesan pertama dalam sesi baru dikirim
- Bukan AI call terpisah — cukup ambil 4-5 kata pertama dari pesan user,
  atau gunakan AI mini-call yang sangat murah
- Judul di-truncate ke max 35 karakter
- Update ke kolom `chat_sessions.title`

### Implementasi (dua opsi)

**Opsi A — Simple truncation (tidak butuh AI call):**
```ts
function generateTitle(message: string): string {
  return message.length > 35
    ? message.substring(0, 32) + '...'
    : message
}
```

**Opsi B — AI summarization (lebih natural, 1 extra call):**
```ts
// Satu panggilan ringan ke AI, hanya saat pesan PERTAMA di sesi
const { text } = await generateText({
  model: openrouter('google/gemini-2.5-flash'),
  prompt: `Summarize this question in 4-5 words max, title case, no punctuation: "${userMessage}"`,
  maxTokens: 20,
})
// Result: "Food Spending This Month"
```

Rekomendasi: **Opsi B** untuk hasil lebih natural. Cost sangat minimal
(~20 token per sesi baru).

---

## Feature 4 — Personalized greeting

### Deskripsi
Halaman awal chat (state kosong, sebelum ada percakapan) menampilkan
greeting personal dengan nama user dan indikator "aktif".

### Tampilan
```
● Hi, Filan 👋
How can I help you today?
I have access to your transactions for the past 90 days.
Try one of these to begin:
```

### Komponen
- **Green dot** (`●`): status indicator, warna `var(--accent)` / emerald
- **Nama user**: diambil dari `supabase.auth.getUser()` → `user.user_metadata.full_name` atau
  email prefix sebelum `@` sebagai fallback
- **Heading**: `font-size: clamp(28px, 4vw, 40px); font-weight: 700`
- **Subtitle**: `font-size: 16px; color: var(--ink-3); max-width: 480px`

### Bilingual

| | Bahasa Indonesia | English |
|---|---|---|
| Greeting | `Hi, {nama} 👋` | `Hi, {nama} 👋` |
| Heading | `Bisa bantu apa hari ini?` | `How can I help you today?` |
| Subtitle | `Saya punya akses ke transaksi 90 hari terakhirmu.` | `I have access to your transactions for the past 90 days.` |
| CTA | `Coba salah satu ini:` | `Try one of these to begin:` |

---

## Feature 5 — Context transparency card

### Deskripsi
Card yang menjelaskan secara eksplisit data apa yang bisa diakses AI.
Meningkatkan kepercayaan user — mereka tahu persis apa yang AI "tahu"
tentang mereka.

### Tampilan
```
┌────────────────────────────────────────────────────────┐
│ 🗄 CONTEXT I USE                                       │
│                                                        │
│ ✓ Transactions from the past 90 days                  │
│ ✓ Totals per category                                  │
│ ✓ Monthly trends & anomalies                           │
│ ✓ Active language (ID/EN)                              │
└────────────────────────────────────────────────────────┘
```

### Style
- Background: `var(--surface)`, border: `1px solid var(--border)`
- Border radius: `12px`, padding: `16px 20px`
- Label "CONTEXT I USE": `font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: var(--ink-4); text-transform: uppercase`
- Checkmark items: `font-size: 13px; color: var(--ink-3)` dengan ikon ✓ berwarna `var(--accent)`
- Items tampil sebagai chips horizontal (flex wrap), bukan list vertikal

### Bilingual

| | Bahasa Indonesia | English |
|---|---|---|
| Label | `KONTEKS YANG SAYA GUNAKAN` | `CONTEXT I USE` |
| Item 1 | `Transaksi 90 hari terakhir` | `Transactions from the past 90 days` |
| Item 2 | `Total per kategori` | `Totals per category` |
| Item 3 | `Tren & anomali bulanan` | `Monthly trends & anomalies` |
| Item 4 | `Bahasa aktif (ID/EN)` | `Active language (ID/EN)` |

---

## Feature 6 — Enhanced suggested prompts (update dari PRD)

### Perubahan dari PRD
PRD mendefinisikan 4 prompt dalam layout sederhana. Screenshot menunjukkan
**6 prompt dalam grid 2x3** dengan icon berwarna, judul bold, dan deskripsi.

### 6 Prompt yang ditampilkan

| Icon | Judul (EN) | Judul (ID) | Deskripsi (EN) | Deskripsi (ID) |
|---|---|---|---|---|
| 📊 | Biggest spending category | Kategori terboros | Which category was my biggest expense over the last 3 months? | Kategori apa yang paling banyak saya keluarkan 3 bulan terakhir? |
| ⚡ | Saving suggestions | Saran hemat | How can I save Rp 500,000 next month? | Bagaimana cara saya hemat Rp 500.000 bulan depan? |
| 🍔 | Food & drinks total | Total makan & minum | How much did I spend on food this month? | Berapa pengeluaran makan saya bulan ini? |
| 🔄 | New subscriptions | Langganan baru | Are there any new subscriptions this month? | Apakah ada langganan baru bulan ini? |
| 📅 | Compare months | Bandingkan bulan | Compare my April and May spending. | Bandingkan pengeluaran April dan Mei saya. |
| 🎯 | Savings target | Target tabungan | Is a Rp 2 million monthly savings target realistic for me? | Apakah target tabungan Rp 2 juta per bulan realistis untuk saya? |

### Style tiap card
```
┌──────────────────────────────────────────┐
│ [icon bg]  Title bold               →   │
│            Descriptive subtitle text    │
└──────────────────────────────────────────┘
```
- Card: `border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px`
- Hover: `border-color: var(--accent-2); background: var(--accent-soft)`
- Icon container: `width: 32px; height: 32px; border-radius: 8px` dengan warna berbeda per prompt
- Title: `font-size: 14px; font-weight: 600; color: var(--ink)`
- Subtitle: `font-size: 13px; color: var(--ink-3); margin-top: 2px`
- Arrow (→): `color: var(--ink-4)`, right-aligned, muncul saat hover
- Grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 10px`

---

## Feature 7 — Privacy disclaimer

### Deskripsi
Teks kecil di bagian bawah sidebar menjelaskan kebijakan privasi AI —
data tidak disimpan oleh model, setiap sesi terisolasi.

### Tampilan
```
ⓘ Your data is not retained by the model.
  Each conversation is sandboxed by session.
```

### Style
- Posisi: sticky bottom sidebar, di bawah list sesi
- Font size: `11px`, color: `var(--ink-5)`
- Icon: ⓘ atau SVG info icon
- Padding: `12px 16px`
- Border top: `1px solid var(--border)`

### Bilingual

| | Bahasa Indonesia | English |
|---|---|---|
| Line 1 | `Data kamu tidak disimpan oleh model.` | `Your data is not retained by the model.` |
| Line 2 | `Setiap percakapan terisolasi per sesi.` | `Each conversation is sandboxed by session.` |

---

## Feature 8 — Keyboard shortcut hints

### Deskripsi
Hint text di dalam input bar menunjukkan shortcut keyboard untuk mengirim
pesan dan membuat baris baru.

### Tampilan
```
[ Ask about your finances...          ] [Send →]
  ⏎ to send · ⇧⏎ new line
```

### Implementasi
```tsx
<div className="input-hints">
  <span>⏎ {t('chat.hint_send')}</span>
  <span>·</span>
  <span>⇧⏎ {t('chat.hint_newline')}</span>
</div>
```

### Behaviour
- `Enter` → submit form
- `Shift + Enter` → newline di textarea
- Textarea auto-resize (expand ke atas saat teks panjang, max 5 baris)

### Bilingual

| Key | Bahasa Indonesia | English |
|---|---|---|
| hint_send | `⏎ untuk kirim` | `⏎ to send` |
| hint_newline | `⇧⏎ baris baru` | `⇧⏎ new line` |

---

## Feature 9 — Input bar enhancements

### 9a. Attachment button (paperclip icon)
Tombol untuk attach file/gambar ke percakapan.

**Scope v1.4:** UI-only — tampilkan icon paperclip tapi disable dengan
tooltip "Coming soon" / "Segera hadir". Tidak perlu implementasi upload
di v1.4. Ini hanya placeholder visual.

### 9b. Quick action button (lightning bolt icon)
Tombol untuk quick prompt shortcuts.

**Scope v1.4:** Saat diklik, tampilkan dropdown dengan 3 quick prompts
(sama dengan suggested prompts). Shortcut untuk user yang sudah tahu
mau tanya apa tanpa perlu scroll ke atas.

```
[ ⚡ ]
  ├─ Biggest spending category
  ├─ Saving suggestions
  └─ Compare months
```

### Style input bar lengkap
```
┌──────────────────────────────────────────────────────┐
│  📎  ⚡  │  Ask about your finances...     │  Send → │
│──────────────────────────────────────────────────────│
│          ⏎ to send · ⇧⏎ new line                    │
└──────────────────────────────────────────────────────┘
```
- Container: `background: var(--surface); border: 1px solid var(--border-strong); border-radius: 14px; padding: 10px 14px`
- Textarea: `border: none; outline: none; resize: none; font-size: 14px`
- Send button: `background: var(--ink); color: #fff; border-radius: 8px; padding: 6px 14px`
  disabled state: `background: var(--bg-muted); color: var(--ink-5)`

---

## Prioritas implementasi

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| 🔴 High | Feature 1 — Conversation history sidebar | Tinggi (butuh DB) | Sangat tinggi |
| 🔴 High | Feature 2 — Session persistence | Tinggi (butuh DB) | Sangat tinggi |
| 🔴 High | Feature 3 — Auto-generated title | Rendah | Tinggi |
| 🟡 Medium | Feature 4 — Personalized greeting | Rendah | Tinggi |
| 🟡 Medium | Feature 5 — Context transparency card | Rendah | Sedang |
| 🟡 Medium | Feature 6 — Enhanced prompts (6 items) | Rendah | Sedang |
| 🟢 Low | Feature 7 — Privacy disclaimer | Sangat rendah | Sedang |
| 🟢 Low | Feature 8 — Keyboard shortcut hints | Sangat rendah | Rendah |
| 🟢 Low | Feature 9 — Input bar enhancements | Rendah | Rendah |

---

## Database migration summary

Dua tabel baru yang perlu dibuat di Supabase:

```sql
-- Run di Supabase SQL Editor

CREATE TABLE chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'New conversation',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Indexes untuk performa
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own sessions"
ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own messages"
ON chat_messages FOR ALL
USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);
```

---

*Dokumen ini adalah addendum dari PRD v1.3 — fitur-fitur di sini
akan diintegrasikan ke PRD v1.5 setelah implementasi selesai.*
