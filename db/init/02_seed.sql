-- ============================================================
-- EBP AI Assistant - Seed Data (UK Regions)
-- ============================================================

-- -------------------------
-- LOCATIONS (10 stores)
-- -------------------------
INSERT INTO location (name, city, region) VALUES
  ('Store London Oxford St',   'London',     'England'),
  ('Store London Canary Wharf','London',     'England'),
  ('Store Manchester Arndale', 'Manchester', 'England'),
  ('Store Birmingham Bullring','Birmingham', 'England'),
  ('Store Leeds Trinity',      'Leeds',      'England'),
  ('Store Bristol Cabot',      'Bristol',    'England'),
  ('Store Edinburgh Princes',  'Edinburgh',  'Scotland'),
  ('Store Glasgow Buchanan',   'Glasgow',    'Scotland'),
  ('Store Cardiff St David',   'Cardiff',    'Wales'),
  ('Store Belfast Victoria',   'Belfast',    'Northern Ireland');

-- -------------------------
-- EMPLOYEES (500)
-- -------------------------
DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    'Oliver','George','Harry','Jack','Noah','Charlie','Jacob','Alfie','Freddie','Oscar',
    'Leo','Henry','Archie','Ethan','Joshua','James','William','Thomas','Lucas','Mason',
    'Olivia','Amelia','Isla','Ava','Emily','Isabella','Mia','Poppy','Ella','Lily',
    'Sophie','Grace','Freya','Charlotte','Alice','Evie','Florence','Daisy','Ruby','Chloe',
    'Liam','Rory','Callum','Hamish','Angus','Finlay','Duncan','Ewan','Craig','Ross',
    'Rhys','Dylan','Gethin','Owain','Sion','Cerys','Bethan','Ffion','Nia','Seren'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Jones','Williams','Taylor','Brown','Davies','Evans','Wilson','Thomas','Roberts',
    'Johnson','Walker','Wright','Robinson','Thompson','White','Hughes','Edwards','Green','Hall',
    'Lewis','Harris','Clarke','Patel','Jackson','Wood','Turner','Martin','Cooper','Hill',
    'Ward','Morris','Moore','Clark','Lee','King','Baker','Harrison','Morgan','Allen',
    'Scott','Young','Mitchell','Anderson','Campbell','Stewart','Murray','Reid','Ross','MacDonald'
  ];
  roles TEXT[] := ARRAY[
    'Store Manager','Assistant Manager','Sales Associate','Cashier',
    'Inventory Specialist','Customer Service Rep','Team Lead','Security Officer'
  ];
  i INT;
  emp_name TEXT;
  emp_email TEXT;
  emp_role TEXT;
  emp_loc INT;
  emp_hire DATE;
BEGIN
  FOR i IN 1..500 LOOP
    emp_name  := first_names[1 + ((i * 7) % array_length(first_names, 1))]
                 || ' ' ||
                 last_names[1 + ((i * 13) % array_length(last_names, 1))];
    emp_email := lower(replace(emp_name, ' ', '.')) || i || '@ebp.co.uk';
    emp_role  := roles[1 + ((i * 3) % array_length(roles, 1))];
    emp_loc   := 1 + ((i - 1) % 10);
    emp_hire  := DATE '2018-01-01' + ((i * 17) % 2000) * INTERVAL '1 day';

    INSERT INTO employee (name, email, role, location_id, hire_date, is_active)
    VALUES (emp_name, emp_email, emp_role, emp_loc, emp_hire, TRUE);
  END LOOP;
END $$;

-- -------------------------
-- FULL-DAY LEAVES (varied realistic patterns, spread up to today)
-- -------------------------
DO $$
DECLARE
  i            INT;
  j            INT;
  num_leaves   INT;
  leave_types  TEXT[] := ARRAY['SICK','CASUAL','EARNED','UNPAID'];
  dominant     TEXT;
  pref_month   INT;
  yr           INT;
  mo           INT;
  dy           INT;
  leave_date   DATE;
  leave_type   TEXT;
  leave_status TEXT;
  today        DATE := CURRENT_DATE;
  -- Year weights: spread across 2023, 2024, 2025
  year_pick    INT;
BEGIN
  FOR i IN 1..500 LOOP
    num_leaves := 3 + ((i * 3 + 7) % 6);  -- 3 to 8 leaves per employee
    dominant   := leave_types[1 + ((i * 7) % 4)];
    pref_month := 1 + ((i * 11) % 12);

    FOR j IN 1..num_leaves LOOP
      -- Distribute across years: earlier employees lean 2023, middle 2024, later 2025
      year_pick := (i + j * 3) % 10;
      IF year_pick < 3 THEN
        yr := 2023;
      ELSIF year_pick < 7 THEN
        yr := 2024;
      ELSE
        yr := 2025;
      END IF;

      -- Month: preferred month ± small variation
      mo := 1 + ((pref_month + j - 1) % 12);

      -- Day: varied per employee+leave combo
      dy := LEAST(1 + ((i * j * 13 + j * 17) % 25), 28);

      leave_date := make_date(yr, mo, dy);

      -- Skip future dates beyond today
      IF leave_date > today THEN
        leave_date := today - ((i * j) % 30) * INTERVAL '1 day';
      END IF;

      -- Leave type: 70% dominant, 30% random
      IF (i * j) % 10 < 7 THEN
        leave_type := dominant;
      ELSE
        leave_type := leave_types[1 + ((i + j * 5) % 4)];
      END IF;

      -- Status: 5% pending for recent leaves, rest approved
      IF leave_date >= today - INTERVAL '30 days' AND (i * j) % 8 = 0 THEN
        leave_status := 'PENDING';
      ELSE
        leave_status := 'APPROVED';
      END IF;

      INSERT INTO employee_leave (employee_id, leave_date, leave_type, status)
      VALUES (i, leave_date, leave_type, leave_status)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- -------------------------
-- HALF-DAY LEAVES (varied, 0-3 per employee, up to today)
-- -------------------------
DO $$
DECLARE
  i          INT;
  j          INT;
  num_half   INT;
  leave_types TEXT[] := ARRAY['SICK','CASUAL','EARNED'];
  halves      TEXT[] := ARRAY['MORNING','AFTERNOON'];
  pref_month  INT;
  yr          INT;
  mo          INT;
  dy          INT;
  leave_date  DATE;
  today       DATE := CURRENT_DATE;
BEGIN
  FOR i IN 1..500 LOOP
    num_half   := (i * 5) % 4;  -- 0 to 3
    pref_month := 1 + ((i * 7) % 12);

    FOR j IN 1..num_half LOOP
      yr := 2023 + ((i + j * 3) % 3);
      mo := 1 + ((pref_month + j) % 12);
      dy := LEAST(1 + ((i * j * 11) % 25), 28);

      leave_date := make_date(yr, mo, dy);

      IF leave_date > today THEN
        leave_date := today - ((i + j) % 20) * INTERVAL '1 day';
      END IF;

      INSERT INTO employee_half_day_leave (employee_id, leave_date, half, leave_type, status)
      VALUES (
        i,
        leave_date,
        halves[1 + ((i + j) % 2)],
        leave_types[1 + ((i * j + 3) % 3)],
        'APPROVED'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- -------------------------
-- LOCATION HOLIDAYS (UK public holidays, 2023-2025)
-- -------------------------

-- England & Wales bank holidays (locations 1-6, 9)
DO $$
DECLARE
  loc INT;
  eng_holidays DATE[] := ARRAY[
    -- 2023
    DATE '2023-01-02', DATE '2023-04-07', DATE '2023-04-10',
    DATE '2023-05-01', DATE '2023-05-08', DATE '2023-08-28',
    DATE '2023-12-25', DATE '2023-12-26',
    -- 2024
    DATE '2024-01-01', DATE '2024-03-29', DATE '2024-04-01',
    DATE '2024-05-06', DATE '2024-05-27', DATE '2024-08-26',
    DATE '2024-12-25', DATE '2024-12-26',
    -- 2025
    DATE '2025-01-01', DATE '2025-04-18', DATE '2025-04-21',
    DATE '2025-05-05', DATE '2025-05-26', DATE '2025-08-25',
    DATE '2025-12-25', DATE '2025-12-26'
  ];
  eng_names TEXT[] := ARRAY[
    -- 2023
    'New Year''s Day (substitute)','Good Friday','Easter Monday',
    'Early May Bank Holiday','Coronation Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day',
    -- 2024
    'New Year''s Day','Good Friday','Easter Monday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day',
    -- 2025
    'New Year''s Day','Good Friday','Easter Monday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day'
  ];
  h INT;
BEGIN
  FOREACH loc IN ARRAY ARRAY[1,2,3,4,5,6,9] LOOP
    FOR h IN 1..array_length(eng_holidays, 1) LOOP
      INSERT INTO location_holiday (location_id, holiday_date, holiday_name)
      VALUES (loc, eng_holidays[h], eng_names[h]);
    END LOOP;
  END LOOP;
END $$;

-- Scotland bank holidays (locations 7, 8)
DO $$
DECLARE
  loc INT;
  scot_holidays DATE[] := ARRAY[
    -- 2023
    DATE '2023-01-02', DATE '2023-01-03', DATE '2023-04-07',
    DATE '2023-05-01', DATE '2023-05-08', DATE '2023-08-07',
    DATE '2023-11-30', DATE '2023-12-25', DATE '2023-12-26',
    -- 2024
    DATE '2024-01-01', DATE '2024-01-02', DATE '2024-03-29',
    DATE '2024-05-06', DATE '2024-05-27', DATE '2024-08-05',
    DATE '2024-12-02', DATE '2024-12-25', DATE '2024-12-26',
    -- 2025
    DATE '2025-01-01', DATE '2025-01-02', DATE '2025-04-18',
    DATE '2025-05-05', DATE '2025-05-26', DATE '2025-08-04',
    DATE '2025-12-01', DATE '2025-12-25', DATE '2025-12-26'
  ];
  scot_names TEXT[] := ARRAY[
    -- 2023
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Coronation Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day',
    -- 2024
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day',
    -- 2025
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day'
  ];
  h INT;
BEGIN
  FOREACH loc IN ARRAY ARRAY[7,8] LOOP
    FOR h IN 1..array_length(scot_holidays, 1) LOOP
      INSERT INTO location_holiday (location_id, holiday_date, holiday_name)
      VALUES (loc, scot_holidays[h], scot_names[h]);
    END LOOP;
  END LOOP;
END $$;

-- Northern Ireland bank holidays (location 10)
DO $$
DECLARE
  ni_holidays DATE[] := ARRAY[
    -- 2023
    DATE '2023-01-02', DATE '2023-03-17', DATE '2023-04-07',
    DATE '2023-04-10', DATE '2023-05-01', DATE '2023-05-08',
    DATE '2023-07-12', DATE '2023-08-28', DATE '2023-12-25', DATE '2023-12-26',
    -- 2024
    DATE '2024-01-01', DATE '2024-03-18', DATE '2024-03-29',
    DATE '2024-04-01', DATE '2024-05-06', DATE '2024-05-27',
    DATE '2024-07-12', DATE '2024-08-26', DATE '2024-12-25', DATE '2024-12-26',
    -- 2025
    DATE '2025-01-01', DATE '2025-03-17', DATE '2025-04-18',
    DATE '2025-04-21', DATE '2025-05-05', DATE '2025-05-26',
    DATE '2025-07-14', DATE '2025-08-25', DATE '2025-12-25', DATE '2025-12-26'
  ];
  ni_names TEXT[] := ARRAY[
    -- 2023
    'New Year''s Day (substitute)','St Patrick''s Day (substitute)','Good Friday',
    'Easter Monday','Early May Bank Holiday','Coronation Bank Holiday',
    'Battle of the Boyne','Summer Bank Holiday','Christmas Day','Boxing Day',
    -- 2024
    'New Year''s Day','St Patrick''s Day (substitute)','Good Friday',
    'Easter Monday','Early May Bank Holiday','Spring Bank Holiday',
    'Battle of the Boyne','Summer Bank Holiday','Christmas Day','Boxing Day',
    -- 2025
    'New Year''s Day','St Patrick''s Day','Good Friday',
    'Easter Monday','Early May Bank Holiday','Spring Bank Holiday',
    'Battle of the Boyne','Summer Bank Holiday','Christmas Day','Boxing Day'
  ];
  h INT;
BEGIN
  FOR h IN 1..array_length(ni_holidays, 1) LOOP
    INSERT INTO location_holiday (location_id, holiday_date, holiday_name)
    VALUES (10, ni_holidays[h], ni_names[h]);
  END LOOP;
END $$;

-- -------------------------
-- STORE SECONDARY SCHEDULES
-- -------------------------

-- Recurring: all stores open Sundays with reduced hours
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, NULL, 0, '11:00', '17:00', 'Sunday trading hours'
FROM location;

-- Christmas Eve extended hours (all stores)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2024-12-24', NULL, '08:00', '22:00', 'Christmas Eve extended'
FROM location;

-- Boxing Day sale extended hours (England & Wales stores only)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes) VALUES
  (1, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale'),
  (2, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale'),
  (3, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale'),
  (4, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale'),
  (5, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale'),
  (6, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale'),
  (9, '2024-12-26', NULL, '09:00', '21:00', 'Boxing Day sale');

-- Black Friday extended hours (all stores)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2024-11-29', NULL, '07:00', '23:00', 'Black Friday extended'
FROM location;
