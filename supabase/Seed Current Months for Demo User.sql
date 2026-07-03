-- Seed May / June / July 2026 for the demo user.
-- "Current" month assumed to be July 2026 (dashboard defaults to the current
-- month, so July must have data for the dashboard to look alive by default).
-- Re-runnable: the DELETE guard clears this user's Mar–Jul 2026 rows first
-- (this also removes the older March/April seed), so running it twice will
-- NOT create duplicates and leaves only May / June / July.

DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'ferdiputra1404@gmail.com';
  -- demo_user_id := '00000000-0000-0000-0000-000000000000'; -- or paste a UUID directly

  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Update the email or paste a UUID above.';
  END IF;

  -- Idempotency + cleanup: clears Mar–Jul 2026 for this user (removes the old
  -- March/April seed too); only May/Jun/Jul get re-inserted below.
  DELETE FROM public.transactions
  WHERE user_id = demo_user_id
    AND date >= '2026-03-01' AND date < '2026-08-01';

  INSERT INTO public.transactions (user_id, amount, type, description, category_key, date) VALUES
  -- ========== MAY 2026 (baseline, total expense ~Rp 1,980,000) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',           'income',        '2026-05-25'),

  -- Food (Rp 720,000)
  (demo_user_id,   45000, 'expense', 'Nasi padang siang',      'food',          '2026-05-02'),
  (demo_user_id,   32000, 'expense', 'Kopi Tuku',              'food',          '2026-05-05'),
  (demo_user_id,   75000, 'expense', 'Dinner Padang',          'food',          '2026-05-08'),
  (demo_user_id,   28000, 'expense', 'Indomie + telur',        'food',          '2026-05-12'),
  (demo_user_id,  120000, 'expense', 'Belanja sayur mingguan', 'food',          '2026-05-15'),
  (demo_user_id,   55000, 'expense', 'Sushi lunch',            'food',          '2026-05-18'),
  (demo_user_id,   95000, 'expense', 'Grocery Alfamart',       'food',          '2026-05-22'),
  (demo_user_id,   65000, 'expense', 'Bakso Malang',           'food',          '2026-05-25'),
  (demo_user_id,  205000, 'expense', 'Belanja bulanan',        'food',          '2026-05-28'),

  -- Transport (Rp 280,000)
  (demo_user_id,   35000, 'expense', 'Gojek ke kantor',        'transport',     '2026-05-04'),
  (demo_user_id,   45000, 'expense', 'Grab car',               'transport',     '2026-05-11'),
  (demo_user_id,   25000, 'expense', 'Ojek pulang',            'transport',     '2026-05-17'),
  (demo_user_id,   75000, 'expense', 'Pertamax',               'transport',     '2026-05-23'),
  (demo_user_id,  100000, 'expense', 'Isi bensin',             'transport',     '2026-05-27'),

  -- Entertainment (Rp 250,000)
  (demo_user_id,   50000, 'expense', 'Netflix',                'entertainment', '2026-05-07'),
  (demo_user_id,   60000, 'expense', 'Spotify family',         'entertainment', '2026-05-14'),
  (demo_user_id,  140000, 'expense', 'Cinema XXI weekend',     'entertainment', '2026-05-21'),

  -- Shopping (Rp 180,000)
  (demo_user_id,  180000, 'expense', 'T-shirt Uniqlo',         'shopping',      '2026-05-09'),

  -- Bills (Rp 450,000)
  (demo_user_id,  200000, 'expense', 'Listrik PLN',            'bills',         '2026-05-05'),
  (demo_user_id,  150000, 'expense', 'IndiHome internet',      'bills',         '2026-05-10'),
  (demo_user_id,  100000, 'expense', 'Pulsa Telkomsel',        'bills',         '2026-05-15'),

  -- Health (Rp 100,000)
  (demo_user_id,  100000, 'expense', 'Apotek vitamin',         'health',        '2026-05-19'),

  -- ========== JUNE 2026 (+18% vs May, total ~Rp 2,340,000) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',           'income',        '2026-06-25'),

  -- Food (Rp 780,000)
  (demo_user_id,   40000, 'expense', 'Nasi goreng',            'food',          '2026-06-03'),
  (demo_user_id,   55000, 'expense', 'Starbucks',              'food',          '2026-06-06'),
  (demo_user_id,  150000, 'expense', 'Dinner sushi date',      'food',          '2026-06-09'),
  (demo_user_id,   85000, 'expense', 'GoFood McDonalds',       'food',          '2026-06-13'),
  (demo_user_id,  130000, 'expense', 'Groceries mingguan',     'food',          '2026-06-16'),
  (demo_user_id,   75000, 'expense', 'Ramen Bjak',             'food',          '2026-06-19'),
  (demo_user_id,   45000, 'expense', 'Kopi + croissant',       'food',          '2026-06-23'),
  (demo_user_id,  200000, 'expense', 'Belanja bulanan',        'food',          '2026-06-28'),

  -- Transport (Rp 290,000)
  (demo_user_id,   40000, 'expense', 'Gojek',                  'transport',     '2026-06-02'),
  (demo_user_id,   55000, 'expense', 'Grab ke meeting',        'transport',     '2026-06-08'),
  (demo_user_id,   95000, 'expense', 'Pertamax',               'transport',     '2026-06-14'),
  (demo_user_id,  100000, 'expense', 'Isi bensin',             'transport',     '2026-06-26'),

  -- Entertainment (Rp 355,000) — the +42% spike
  (demo_user_id,   50000, 'expense', 'Netflix',                'entertainment', '2026-06-07'),
  (demo_user_id,   60000, 'expense', 'Spotify family',         'entertainment', '2026-06-14'),
  (demo_user_id,   75000, 'expense', 'Disney+ baru',           'entertainment', '2026-06-15'),
  (demo_user_id,   55000, 'expense', 'Apple Music',            'entertainment', '2026-06-18'),
  (demo_user_id,  115000, 'expense', 'Concert tiket',          'entertainment', '2026-06-22'),

  -- Shopping (Rp 270,000)
  (demo_user_id,  150000, 'expense', 'Sepatu Adidas',          'shopping',      '2026-06-05'),
  (demo_user_id,  120000, 'expense', 'Kemeja Uniqlo',          'shopping',      '2026-06-20'),

  -- Bills (Rp 445,000)
  (demo_user_id,  195000, 'expense', 'Listrik PLN',            'bills',         '2026-06-05'),
  (demo_user_id,  150000, 'expense', 'IndiHome internet',      'bills',         '2026-06-10'),
  (demo_user_id,  100000, 'expense', 'Pulsa Telkomsel',        'bills',         '2026-06-15'),

  -- Health (Rp 80,000)
  (demo_user_id,   80000, 'expense', 'Apotek',                 'health',        '2026-06-17'),

  -- Education (Rp 120,000)
  (demo_user_id,  120000, 'expense', 'Udemy course',           'education',     '2026-06-24'),

  -- ========== JULY 2026 (current month, first 3 days) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',           'income',        '2026-07-01'),

  -- Bills settle at the start of the month
  (demo_user_id,  200000, 'expense', 'Listrik PLN',            'bills',         '2026-07-01'),
  (demo_user_id,  150000, 'expense', 'IndiHome internet',      'bills',         '2026-07-02'),

  -- Subscriptions renew early
  (demo_user_id,   50000, 'expense', 'Netflix',                'entertainment', '2026-07-01'),
  (demo_user_id,   60000, 'expense', 'Spotify family',         'entertainment', '2026-07-02'),

  -- Daily spending so far
  (demo_user_id,   45000, 'expense', 'Nasi padang',            'food',          '2026-07-01'),
  (demo_user_id,   32000, 'expense', 'Kopi Tuku',              'food',          '2026-07-02'),
  (demo_user_id,  130000, 'expense', 'Groceries mingguan',     'food',          '2026-07-03'),
  (demo_user_id,   40000, 'expense', 'Gojek',                  'transport',     '2026-07-02'),
  (demo_user_id,   75000, 'expense', 'Pertamax',               'transport',     '2026-07-03'),
  (demo_user_id,  150000, 'expense', 'Sepatu lari',            'shopping',      '2026-07-03');

END $$;

-- Verification: shows what landed per month (returns rows, so you get feedback).
SELECT to_char(date, 'YYYY-MM') AS month,
       count(*)                 AS txns,
       sum(amount) FILTER (WHERE type = 'expense') AS expense_total
FROM public.transactions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ferdiputra1404@gmail.com')
GROUP BY 1
ORDER BY 1;
