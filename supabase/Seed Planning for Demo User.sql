-- Seed Aug + Sep 2026 transactions and planning data (budgets, goals,
-- recurring rules) for the demo user. Run AFTER planning.sql.
-- Re-runnable: clears this user's planning rows and Aug–Sep 2026 transactions first.
-- Sep budget story: food 90% (warn), transport 70%, entertainment over, shopping ~44%.

DO $$
DECLARE
  demo_user_id uuid;
  goal_laptop uuid;
  goal_emergency uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demouser@gmail.com'; -- the "Try the demo" account (NEXT_PUBLIC_DEMO_EMAIL)
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Update the email or paste a UUID above.';
  END IF;

  DELETE FROM public.budgets WHERE user_id = demo_user_id;
  DELETE FROM public.savings_goals WHERE user_id = demo_user_id; -- cascades contributions
  DELETE FROM public.recurring_rules WHERE user_id = demo_user_id;
  DELETE FROM public.transactions
  WHERE user_id = demo_user_id AND date >= '2026-08-01' AND date < '2026-10-01';

  INSERT INTO public.transactions (user_id, amount, type, description, category_key, date) VALUES
  -- ========== AUGUST 2026 ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',              'income',        '2026-08-25'),
  (demo_user_id,   45000, 'expense', 'Nasi padang siang',         'food',          '2026-08-03'),
  (demo_user_id,   32000, 'expense', 'Kopi susu',                 'food',          '2026-08-05'),
  (demo_user_id,  280000, 'expense', 'Belanja bulanan Indomaret', 'food',          '2026-08-08'),
  (demo_user_id,   65000, 'expense', 'Makan malam bakso',         'food',          '2026-08-12'),
  (demo_user_id,  120000, 'expense', 'Makan bareng teman',        'food',          '2026-08-16'),
  (demo_user_id,   38000, 'expense', 'Sarapan bubur',             'food',          '2026-08-20'),
  (demo_user_id,  250000, 'expense', 'Belanja sayur & lauk',      'food',          '2026-08-24'),
  (demo_user_id,   55000, 'expense', 'Martabak',                  'food',          '2026-08-29'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-08-04'),
  (demo_user_id,   42000, 'expense', 'Grab ke kampus',            'transport',     '2026-08-11'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-08-18'),
  (demo_user_id,   25000, 'expense', 'Parkir mall',               'transport',     '2026-08-23'),
  (demo_user_id,   54990, 'expense', 'Spotify Premium',           'entertainment', '2026-08-05'),
  (demo_user_id,   65000, 'expense', 'Tiket bioskop',             'entertainment', '2026-08-15'),
  (demo_user_id,  120000, 'expense', 'Top up game',               'entertainment', '2026-08-27'),
  (demo_user_id,  189000, 'expense', 'Kaos baru',                 'shopping',      '2026-08-10'),
  (demo_user_id,   95000, 'expense', 'Skincare',                  'shopping',      '2026-08-22'),
  (demo_user_id,  750000, 'expense', 'Bayar kos',                 'bills',         '2026-08-01'),
  (demo_user_id,  350000, 'expense', 'Internet rumah',            'bills',         '2026-08-07'),
  (demo_user_id,  100000, 'expense', 'Pulsa & data',              'bills',         '2026-08-14'),
  (demo_user_id,   85000, 'expense', 'Vitamin',                   'health',        '2026-08-19'),
  (demo_user_id,  500000, 'expense', 'Laptop baru',               'savings',       '2026-08-26'),
  -- ========== SEPTEMBER 2026 (through the 27th) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',              'income',        '2026-09-25'),
  (demo_user_id,  750000, 'income',  'Freelance desain logo',     'income',        '2026-09-12'),
  (demo_user_id,   48000, 'expense', 'Nasi padang siang',         'food',          '2026-09-01'),
  (demo_user_id,   35000, 'expense', 'Kopi susu',                 'food',          '2026-09-03'),
  (demo_user_id,  310000, 'expense', 'Belanja bulanan Indomaret', 'food',          '2026-09-06'),
  (demo_user_id,  150000, 'expense', 'Makan bareng teman',        'food',          '2026-09-09'),
  (demo_user_id,   42000, 'expense', 'Mie ayam',                  'food',          '2026-09-11'),
  (demo_user_id,  275000, 'expense', 'Belanja sayur & lauk',      'food',          '2026-09-14'),
  (demo_user_id,  185000, 'expense', 'Dinner ulang tahun teman',  'food',          '2026-09-18'),
  (demo_user_id,   60000, 'expense', 'Martabak',                  'food',          '2026-09-20'),
  (demo_user_id,   95000, 'expense', 'Sushi',                     'food',          '2026-09-23'),
  (demo_user_id,  150000, 'expense', 'Belanja buah',              'food',          '2026-09-26'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-09-02'),
  (demo_user_id,   48000, 'expense', 'Grab ke kampus',            'transport',     '2026-09-08'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-09-16'),
  (demo_user_id,   72000, 'expense', 'Gojek ke bandara',          'transport',     '2026-09-21'),
  (demo_user_id,   54990, 'expense', 'Spotify Premium',           'entertainment', '2026-09-05'),
  (demo_user_id,   90000, 'expense', 'Tiket bioskop IMAX',        'entertainment', '2026-09-13'),
  (demo_user_id,  200000, 'expense', 'Tiket konser',              'entertainment', '2026-09-19'),
  (demo_user_id,  250000, 'expense', 'Sepatu lari',               'shopping',      '2026-09-10'),
  (demo_user_id,  100000, 'expense', 'Casing HP',                 'shopping',      '2026-09-22'),
  (demo_user_id,  750000, 'expense', 'Bayar kos',                 'bills',         '2026-09-01'),
  (demo_user_id,  350000, 'expense', 'Internet rumah',            'bills',         '2026-09-07'),
  (demo_user_id,  100000, 'expense', 'Pulsa & data',              'bills',         '2026-09-15'),
  (demo_user_id,  120000, 'expense', 'Obat & vitamin',            'health',        '2026-09-17'),
  (demo_user_id,   99000, 'expense', 'Kursus online Udemy',       'education',     '2026-09-24'),
  (demo_user_id,  500000, 'expense', 'Laptop baru',               'savings',       '2026-09-26');

  INSERT INTO public.budgets (user_id, category_key, amount) VALUES
  (demo_user_id, 'food',          1500000),
  (demo_user_id, 'transport',      600000),
  (demo_user_id, 'entertainment',  300000),
  (demo_user_id, 'shopping',       800000);

  INSERT INTO public.savings_goals (user_id, name, target_amount, target_date)
  VALUES (demo_user_id, 'Laptop baru', 12000000, '2026-12-31')
  RETURNING id INTO goal_laptop;

  INSERT INTO public.savings_goals (user_id, name, target_amount, target_date)
  VALUES (demo_user_id, 'Dana darurat', 10000000, NULL)
  RETURNING id INTO goal_emergency;

  INSERT INTO public.goal_contributions (goal_id, user_id, amount, date) VALUES
  (goal_laptop,    demo_user_id, 3000000, '2026-06-26'),
  (goal_laptop,    demo_user_id, 2500000, '2026-07-26'),
  (goal_laptop,    demo_user_id,  500000, '2026-08-26'),
  (goal_laptop,    demo_user_id,  500000, '2026-09-26'),
  (goal_emergency, demo_user_id, 1500000, '2026-07-10'),
  (goal_emergency, demo_user_id,  750000, '2026-09-12');

  -- last_generated_month = '2026-09': September's rows above already exist,
  -- so the runner starts generating from October.
  INSERT INTO public.recurring_rules
    (user_id, description, amount, type, category_key, day_of_month, start_date, last_generated_month)
  VALUES
  (demo_user_id, 'Gaji bulanan',    8500000, 'income',  'income',        25, '2026-08-01', '2026-09'),
  (demo_user_id, 'Spotify Premium',   54990, 'expense', 'entertainment',  5, '2026-08-01', '2026-09'),
  (demo_user_id, 'Bayar kos',        750000, 'expense', 'bills',          1, '2026-08-01', '2026-09');
END $$;
