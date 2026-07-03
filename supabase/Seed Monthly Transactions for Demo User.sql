
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'ferdiputra1404@gmail.com';
  -- demo_user_id := '00000000-0000-0000-0000-000000000000'; -- or paste a UUID directly

  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Update the email or paste a UUID above.';
  END IF;

  INSERT INTO public.transactions (user_id, amount, type, description, category_key, date) VALUES
  -- ========== MARCH 2026 (baseline, total expense ~Rp 1,980,000) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',           'income',        '2026-03-25'),

  -- Food (Rp 720,000)
  (demo_user_id,   45000, 'expense', 'Nasi padang siang',      'food',          '2026-03-02'),
  (demo_user_id,   32000, 'expense', 'Kopi Tuku',              'food',          '2026-03-05'),
  (demo_user_id,   75000, 'expense', 'Dinner Padang',          'food',          '2026-03-08'),
  (demo_user_id,   28000, 'expense', 'Indomie + telur',        'food',          '2026-03-12'),
  (demo_user_id,  120000, 'expense', 'Belanja sayur mingguan', 'food',          '2026-03-15'),
  (demo_user_id,   55000, 'expense', 'Sushi lunch',            'food',          '2026-03-18'),
  (demo_user_id,   95000, 'expense', 'Grocery Alfamart',       'food',          '2026-03-22'),
  (demo_user_id,   65000, 'expense', 'Bakso Malang',           'food',          '2026-03-25'),
  (demo_user_id,  205000, 'expense', 'Belanja bulanan',        'food',          '2026-03-28'),

  -- Transport (Rp 280,000)
  (demo_user_id,   35000, 'expense', 'Gojek ke kantor',        'transport',     '2026-03-04'),
  (demo_user_id,   45000, 'expense', 'Grab car',               'transport',     '2026-03-11'),
  (demo_user_id,   25000, 'expense', 'Ojek pulang',            'transport',     '2026-03-17'),
  (demo_user_id,   75000, 'expense', 'Pertamax',               'transport',     '2026-03-23'),
  (demo_user_id,  100000, 'expense', 'Isi bensin',             'transport',     '2026-03-27'),

  -- Entertainment (Rp 250,000)
  (demo_user_id,   50000, 'expense', 'Netflix',                'entertainment', '2026-03-07'),
  (demo_user_id,   60000, 'expense', 'Spotify family',         'entertainment', '2026-03-14'),
  (demo_user_id,  140000, 'expense', 'Cinema XXI weekend',     'entertainment', '2026-03-21'),

  -- Shopping (Rp 180,000)
  (demo_user_id,  180000, 'expense', 'T-shirt Uniqlo',         'shopping',      '2026-03-09'),

  -- Bills (Rp 450,000)
  (demo_user_id,  200000, 'expense', 'Listrik PLN',            'bills',         '2026-03-05'),
  (demo_user_id,  150000, 'expense', 'IndiHome internet',      'bills',         '2026-03-10'),
  (demo_user_id,  100000, 'expense', 'Pulsa Telkomsel',        'bills',         '2026-03-15'),

  -- Health (Rp 100,000)
  (demo_user_id,  100000, 'expense', 'Apotek vitamin',         'health',        '2026-03-19'),

  -- ========== APRIL 2026 (+18% vs March, total ~Rp 2,340,000) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',           'income',        '2026-04-25'),

  -- Food (Rp 780,000)
  (demo_user_id,   40000, 'expense', 'Nasi goreng',            'food',          '2026-04-03'),
  (demo_user_id,   55000, 'expense', 'Starbucks',              'food',          '2026-04-06'),
  (demo_user_id,  150000, 'expense', 'Dinner sushi date',      'food',          '2026-04-09'),
  (demo_user_id,   85000, 'expense', 'GoFood McDonalds',       'food',          '2026-04-13'),
  (demo_user_id,  130000, 'expense', 'Groceries mingguan',     'food',          '2026-04-16'),
  (demo_user_id,   75000, 'expense', 'Ramen Bjak',             'food',          '2026-04-19'),
  (demo_user_id,   45000, 'expense', 'Kopi + croissant',       'food',          '2026-04-23'),
  (demo_user_id,  200000, 'expense', 'Belanja bulanan',        'food',          '2026-04-28'),

  -- Transport (Rp 290,000)
  (demo_user_id,   40000, 'expense', 'Gojek',                  'transport',     '2026-04-02'),
  (demo_user_id,   55000, 'expense', 'Grab ke meeting',        'transport',     '2026-04-08'),
  (demo_user_id,   95000, 'expense', 'Pertamax',               'transport',     '2026-04-14'),
  (demo_user_id,  100000, 'expense', 'Isi bensin',             'transport',     '2026-04-26'),

  -- Entertainment (Rp 355,000) — the +42% spike
  (demo_user_id,   50000, 'expense', 'Netflix',                'entertainment', '2026-04-07'),
  (demo_user_id,   60000, 'expense', 'Spotify family',         'entertainment', '2026-04-14'),
  (demo_user_id,   75000, 'expense', 'Disney+ baru',           'entertainment', '2026-04-15'),
  (demo_user_id,   55000, 'expense', 'Apple Music',            'entertainment', '2026-04-18'),
  (demo_user_id,  115000, 'expense', 'Concert tiket',          'entertainment', '2026-04-22'),

  -- Shopping (Rp 270,000)
  (demo_user_id,  150000, 'expense', 'Sepatu Adidas',          'shopping',      '2026-04-05'),
  (demo_user_id,  120000, 'expense', 'Kemeja Uniqlo',          'shopping',      '2026-04-20'),

  -- Bills (Rp 445,000)
  (demo_user_id,  195000, 'expense', 'Listrik PLN',            'bills',         '2026-04-05'),
  (demo_user_id,  150000, 'expense', 'IndiHome internet',      'bills',         '2026-04-10'),
  (demo_user_id,  100000, 'expense', 'Pulsa Telkomsel',        'bills',         '2026-04-15'),

  -- Health (Rp 80,000)
  (demo_user_id,   80000, 'expense', 'Apotek',                 'health',        '2026-04-17'),

  -- Education (Rp 120,000)
  (demo_user_id,  120000, 'expense', 'Udemy course',           'education',     '2026-04-24'),

  -- ========== MAY 2026 (current month, ~28 days in) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',           'income',        '2026-05-25'),

  -- Food (Rp 650,000)
  (demo_user_id,   50000, 'expense', 'Nasi padang',            'food',          '2026-05-02'),
  (demo_user_id,   35000, 'expense', 'Kopi Tuku',              'food',          '2026-05-05'),
  (demo_user_id,   90000, 'expense', 'Dinner ramen',           'food',          '2026-05-09'),
  (demo_user_id,  140000, 'expense', 'Groceries mingguan',     'food',          '2026-05-13'),
  (demo_user_id,   60000, 'expense', 'Bakmi GM',               'food',          '2026-05-17'),
  (demo_user_id,   75000, 'expense', 'Sushi Tei',              'food',          '2026-05-21'),
  (demo_user_id,  200000, 'expense', 'Belanja bulanan',        'food',          '2026-05-26'),

  -- Transport (Rp 250,000)
  (demo_user_id,   40000, 'expense', 'Gojek',                  'transport',     '2026-05-04'),
  (demo_user_id,   50000, 'expense', 'Grab',                   'transport',     '2026-05-11'),
  (demo_user_id,   60000, 'expense', 'Pertamax',               'transport',     '2026-05-18'),
  (demo_user_id,  100000, 'expense', 'Isi bensin',             'transport',     '2026-05-24'),

  -- Entertainment (Rp 175,000) — back to normal
  (demo_user_id,   50000, 'expense', 'Netflix',                'entertainment', '2026-05-07'),
  (demo_user_id,   60000, 'expense', 'Spotify family',         'entertainment', '2026-05-14'),
  (demo_user_id,   65000, 'expense', 'Cinema XXI',             'entertainment', '2026-05-21'),

  -- Shopping (Rp 150,000)
  (demo_user_id,  150000, 'expense', 'Buku Gramedia',          'shopping',      '2026-05-10'),

  -- Bills (Rp 450,000)
  (demo_user_id,  200000, 'expense', 'Listrik PLN',            'bills',         '2026-05-05'),
  (demo_user_id,  150000, 'expense', 'IndiHome internet',      'bills',         '2026-05-10'),
  (demo_user_id,  100000, 'expense', 'Pulsa Telkomsel',        'bills',         '2026-05-15'),

  -- Savings (Rp 500,000)
  (demo_user_id,  500000, 'expense', 'Transfer ke tabungan',   'savings',       '2026-05-26');

END $$;