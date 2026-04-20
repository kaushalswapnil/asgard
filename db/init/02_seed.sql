-- ============================================================
-- EBP AI Assistant - Seed Data (Production-Grade Mock)
-- ============================================================

-- -------------------------
-- LOCATIONS (10 stores)
-- -------------------------
INSERT INTO location (name, city, region) VALUES
  ('Store London Oxford St',    'London',     'England'),
  ('Store London Canary Wharf', 'London',     'England'),
  ('Store Manchester Arndale',  'Manchester', 'England'),
  ('Store Birmingham Bullring', 'Birmingham', 'England'),
  ('Store Leeds Trinity',       'Leeds',      'England'),
  ('Store Bristol Cabot',       'Bristol',    'England'),
  ('Store Edinburgh Princes',   'Edinburgh',  'Scotland'),
  ('Store Glasgow Buchanan',    'Glasgow',    'Scotland'),
  ('Store Cardiff St David',    'Cardiff',    'Wales'),
  ('Store Belfast Victoria',    'Belfast',    'Northern Ireland');

-- -------------------------
-- EMPLOYEES (500)
-- Realistic UK names, varied roles, ~6% inactive, hire dates 2015-2024
-- -------------------------
DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    -- English male
    'Oliver','George','Harry','Jack','Noah','Charlie','Jacob','Alfie','Freddie','Oscar',
    'Leo','Henry','Archie','Ethan','Joshua','James','William','Thomas','Lucas','Mason',
    'Sebastian','Theodore','Elliot','Felix','Hugo','Jasper','Rupert','Edmund','Cecil','Barnaby',
    -- English female
    'Olivia','Amelia','Isla','Ava','Emily','Isabella','Mia','Poppy','Ella','Lily',
    'Sophie','Grace','Freya','Charlotte','Alice','Evie','Florence','Daisy','Ruby','Chloe',
    'Harriet','Beatrice','Matilda','Penelope','Arabella','Imogen','Cordelia','Verity','Phoebe','Tabitha',
    -- Scottish
    'Callum','Hamish','Angus','Finlay','Duncan','Ewan','Craig','Ross','Rory','Lachlan',
    'Catriona','Fiona','Morag','Eilidh','Kirsty','Ailsa','Mhairi','Shona','Rhona','Skye',
    -- Welsh
    'Rhys','Dylan','Gethin','Owain','Sion','Cerys','Bethan','Ffion','Nia','Seren',
    'Carwyn','Emrys','Iestyn','Macsen','Caradoc','Anwen','Elowen','Morfudd','Nerys','Tegwen',
    -- South Asian
    'Amir','Tariq','Imran','Zain','Bilal','Priya','Ananya','Deepa','Kavya','Nisha',
    'Arjun','Rohan','Vikram','Kiran','Suresh','Meera','Pooja','Divya','Sunita','Rekha',
    'Rahul','Nikhil','Sanjay','Devesh','Pranav','Shreya','Anjali','Pallavi','Swati','Ritu',
    -- East Asian
    'Wei','Jun','Mei','Ling','Fang','Yuki','Hana','Kenji','Takeshi','Yuna',
    'Jian','Xiao','Hui','Bao','Cheng','Sakura','Haruto','Ren','Aoi','Sora',
    -- African/Caribbean
    'Kwame','Kofi','Ade','Tunde','Emeka','Amara','Fatima','Zara','Aisha','Blessing',
    'Chidi','Obinna','Seun','Femi','Dele','Ngozi','Adaeze','Chisom','Nneka','Yetunde'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Jones','Williams','Taylor','Brown','Davies','Evans','Wilson','Thomas','Roberts',
    'Johnson','Walker','Wright','Robinson','Thompson','White','Hughes','Edwards','Green','Hall',
    'Lewis','Harris','Clarke','Patel','Jackson','Wood','Turner','Martin','Cooper','Hill',
    'Ward','Morris','Moore','Clark','Lee','King','Baker','Harrison','Morgan','Allen',
    'Scott','Young','Mitchell','Anderson','Campbell','Stewart','Murray','Reid','Ross','MacDonald',
    'Khan','Ahmed','Ali','Hussain','Malik','Singh','Sharma','Gupta','Rao','Nair',
    'Chen','Wang','Li','Zhang','Liu','Okafor','Mensah','Adeyemi','Osei','Diallo'
  ];
  roles TEXT[] := ARRAY[
    'Store Manager','Assistant Manager','Sales Associate','Cashier',
    'Inventory Specialist','Customer Service Rep','Team Lead','Security Officer'
  ];
  -- Role weights: heavier on front-line roles
  role_weights INT[] := ARRAY[1,2,8,7,4,6,3,2];  -- cumulative picks via modulo
  weighted_roles TEXT[] := ARRAY[
    'Store Manager',
    'Assistant Manager','Assistant Manager',
    'Sales Associate','Sales Associate','Sales Associate','Sales Associate','Sales Associate','Sales Associate','Sales Associate','Sales Associate',
    'Cashier','Cashier','Cashier','Cashier','Cashier','Cashier','Cashier',
    'Inventory Specialist','Inventory Specialist','Inventory Specialist','Inventory Specialist',
    'Customer Service Rep','Customer Service Rep','Customer Service Rep','Customer Service Rep','Customer Service Rep','Customer Service Rep',
    'Team Lead','Team Lead','Team Lead',
    'Security Officer','Security Officer'
  ];
  i          INT;
  emp_name   TEXT;
  emp_email  TEXT;
  emp_role   TEXT;
  emp_loc    INT;
  emp_hire   DATE;
  emp_active   BOOLEAN;
  emp_sec_loc  INT;
  fn_idx       INT;
  ln_idx       INT;
  base_email   TEXT;
BEGIN
  FOR i IN 1..500 LOOP
    fn_idx   := 1 + ((i * 31 + 17) % array_length(first_names, 1));
    ln_idx   := 1 + ((i * 37 + 23) % array_length(last_names,  1));
    emp_name := first_names[fn_idx] || ' ' || last_names[ln_idx];

    base_email := lower(
      regexp_replace(first_names[fn_idx], '[^a-zA-Z]', '', 'g') || '.' ||
      regexp_replace(last_names[ln_idx],  '[^a-zA-Z]', '', 'g')
    );
    emp_email := base_email || i || '@ebp.co.uk';

    emp_role   := weighted_roles[1 + ((i * 11) % array_length(weighted_roles, 1))];
    emp_loc    := 1 + ((i - 1) % 10);

    -- Hire dates spread 2015-01-01 to 2024-06-30 (3469 days)
    emp_hire   := DATE '2015-01-01' + ((i * 23 + 41) % 3469) * INTERVAL '1 day';

    -- ~6% inactive (employees whose id mod 17 = 0)
    emp_active := (i % 17 <> 0);

    -- ~70% of employees have a secondary store (must differ from primary)
    IF (i % 10) < 7 THEN
      emp_sec_loc := 1 + ((emp_loc + (i % 9)) % 10);
      IF emp_sec_loc = emp_loc THEN
        emp_sec_loc := 1 + (emp_loc % 10);
      END IF;
    ELSE
      emp_sec_loc := NULL;
    END IF;

    INSERT INTO employee (name, email, role, location_id, secondary_location_id, hire_date, is_active)
    VALUES (emp_name, emp_email, emp_role, emp_loc, emp_sec_loc, emp_hire, emp_active);
  END LOOP;
END $$;

-- -------------------------
-- FULL-DAY LEAVES
-- Realistic distribution:
--   • 2–12 leaves per employee (skewed: most 4-8)
--   • SICK spikes in Jan/Feb/Nov/Dec; EARNED peaks Jun/Jul/Aug & Dec
--   • CASUAL spread evenly; UNPAID rare (~8%)
--   • Status: ~88% APPROVED, ~7% PENDING (recent), ~5% REJECTED
--   • ~3% of employees have zero leaves (no loop iterations)
-- -------------------------
DO $$
DECLARE
  i            INT;
  j            INT;
  num_leaves   INT;
  leave_types  TEXT[] := ARRAY['SICK','CASUAL','EARNED','UNPAID'];
  dominant     TEXT;
  yr           INT;
  mo           INT;
  dy           INT;
  leave_date   DATE;
  leave_type   TEXT;
  leave_status TEXT;
  today        DATE := CURRENT_DATE;
  rand_seed    INT;
  month_bias   INT;
BEGIN
  FOR i IN 1..500 LOOP
    -- Skip ~3% of employees (no leaves)
    CONTINUE WHEN (i % 33 = 0);

    rand_seed  := i * 31 + 7;
    -- Skewed leave count: 2-12, most employees 4-8
    num_leaves := CASE
      WHEN (rand_seed % 20) < 2  THEN 2
      WHEN (rand_seed % 20) < 5  THEN 3
      WHEN (rand_seed % 20) < 10 THEN 5
      WHEN (rand_seed % 20) < 15 THEN 7
      WHEN (rand_seed % 20) < 18 THEN 9
      ELSE 12
    END;

    dominant := leave_types[1 + ((i * 7) % 4)];

    FOR j IN 1..num_leaves LOOP
      -- Year distribution: 2023 25%, 2024 35%, 2025 30%, 2026 10%
      CASE ((i + j * 5) % 20)
        WHEN 0,1,2,3,4       THEN yr := 2023;
        WHEN 5,6,7,8,9,10,11 THEN yr := 2024;
        WHEN 12,13,14,15,16  THEN yr := 2025;
        ELSE                      yr := 2026;
      END CASE;

      -- Month bias: SICK → Jan/Feb/Nov/Dec; EARNED → Jun-Aug/Dec; CASUAL → any
      IF dominant = 'SICK' THEN
        month_bias := (ARRAY[1,1,2,2,3,4,5,6,7,8,9,10,11,11,12,12])[(1 + ((i*j*3)%16))];
      ELSIF dominant = 'EARNED' THEN
        month_bias := (ARRAY[1,3,4,5,6,6,7,7,8,8,9,10,11,12,12,12])[(1 + ((i*j*3)%16))];
      ELSE
        month_bias := 1 + ((i * j * 7 + j) % 12);
      END IF;
      mo := month_bias;

      dy := LEAST(1 + ((i * j * 13 + j * 19 + i) % 27), 28);

      leave_date := make_date(yr, mo, dy);

      -- Cap future dates
      IF leave_date > today THEN
        leave_date := today - ((i * j + 3) % 45 + 1) * INTERVAL '1 day';
      END IF;

      -- Leave type: 65% dominant, 35% varied
      IF (i * j + j) % 10 < 7 THEN
        leave_type := dominant;
      ELSIF (i + j) % 4 = 0 THEN
        leave_type := 'UNPAID';   -- rare
      ELSE
        leave_type := leave_types[1 + ((i + j * 3) % 4)];
      END IF;

      -- Status logic
      IF leave_date > today - INTERVAL '14 days' AND (i * j) % 7 < 2 THEN
        leave_status := 'PENDING';
      ELSIF (i * j) % 19 = 0 THEN
        leave_status := 'REJECTED';
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
-- HALF-DAY LEAVES
-- 0-4 per employee; MORNING slightly more common than AFTERNOON
-- -------------------------
DO $$
DECLARE
  i           INT;
  j           INT;
  num_half    INT;
  leave_types TEXT[] := ARRAY['SICK','CASUAL','EARNED'];
  halves      TEXT[] := ARRAY['MORNING','MORNING','AFTERNOON'];  -- 2:1 morning bias
  yr          INT;
  mo          INT;
  dy          INT;
  leave_date  DATE;
  lv_status   TEXT;
  today       DATE := CURRENT_DATE;
BEGIN
  FOR i IN 1..500 LOOP
    -- 0-4 half-days; ~30% of employees have 0
    num_half := CASE
      WHEN (i * 7) % 10 < 3 THEN 0
      WHEN (i * 7) % 10 < 6 THEN 1
      WHEN (i * 7) % 10 < 8 THEN 2
      WHEN (i * 7) % 10 < 9 THEN 3
      ELSE 4
    END;

    FOR j IN 1..num_half LOOP
      yr := 2023 + ((i + j * 3) % 4);
      mo := 1 + ((i * 5 + j * 7) % 12);
      dy := LEAST(1 + ((i * j * 11 + i) % 26), 28);

      leave_date := make_date(yr, mo, dy);
      IF leave_date > today THEN
        leave_date := today - ((i + j * 2) % 30 + 1) * INTERVAL '1 day';
      END IF;

      -- ~5% pending for very recent half-days
      IF leave_date > today - INTERVAL '7 days' AND (i + j) % 5 = 0 THEN
        lv_status := 'PENDING';
      ELSE
        lv_status := 'APPROVED';
      END IF;

      INSERT INTO employee_half_day_leave (employee_id, leave_date, half, leave_type, status)
      VALUES (
        i,
        leave_date,
        halves[1 + ((i + j) % 3)],
        leave_types[1 + ((i * j + 2) % 3)],
        lv_status
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- -------------------------
-- LOCATION HOLIDAYS (UK public holidays 2023-2026)
-- -------------------------

-- England & Wales (locations 1-6, 9)
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
    DATE '2025-12-25', DATE '2025-12-26',
    -- 2026
    DATE '2026-01-01', DATE '2026-04-03', DATE '2026-04-06',
    DATE '2026-05-04', DATE '2026-05-25', DATE '2026-08-31',
    DATE '2026-12-25', DATE '2026-12-28'
  ];
  eng_names TEXT[] := ARRAY[
    'New Year''s Day (substitute)','Good Friday','Easter Monday',
    'Early May Bank Holiday','Coronation Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day',
    'New Year''s Day','Good Friday','Easter Monday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day',
    'New Year''s Day','Good Friday','Easter Monday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day',
    'New Year''s Day','Good Friday','Easter Monday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'Christmas Day','Boxing Day (substitute)'
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

-- Scotland (locations 7, 8)
DO $$
DECLARE
  loc INT;
  scot_holidays DATE[] := ARRAY[
    DATE '2023-01-02', DATE '2023-01-03', DATE '2023-04-07',
    DATE '2023-05-01', DATE '2023-05-08', DATE '2023-08-07',
    DATE '2023-11-30', DATE '2023-12-25', DATE '2023-12-26',
    DATE '2024-01-01', DATE '2024-01-02', DATE '2024-03-29',
    DATE '2024-05-06', DATE '2024-05-27', DATE '2024-08-05',
    DATE '2024-12-02', DATE '2024-12-25', DATE '2024-12-26',
    DATE '2025-01-01', DATE '2025-01-02', DATE '2025-04-18',
    DATE '2025-05-05', DATE '2025-05-26', DATE '2025-08-04',
    DATE '2025-12-01', DATE '2025-12-25', DATE '2025-12-26',
    DATE '2026-01-01', DATE '2026-01-02', DATE '2026-04-03',
    DATE '2026-05-04', DATE '2026-05-25', DATE '2026-08-03',
    DATE '2026-11-30', DATE '2026-12-25', DATE '2026-12-28'
  ];
  scot_names TEXT[] := ARRAY[
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Coronation Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day',
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day',
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day',
    'New Year''s Day','2nd January','Good Friday',
    'Early May Bank Holiday','Spring Bank Holiday','Summer Bank Holiday',
    'St Andrew''s Day','Christmas Day','Boxing Day (substitute)'
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

-- Northern Ireland (location 10)
DO $$
DECLARE
  ni_holidays DATE[] := ARRAY[
    DATE '2023-01-02', DATE '2023-03-17', DATE '2023-04-07',
    DATE '2023-04-10', DATE '2023-05-01', DATE '2023-05-08',
    DATE '2023-07-12', DATE '2023-08-28', DATE '2023-12-25', DATE '2023-12-26',
    DATE '2024-01-01', DATE '2024-03-18', DATE '2024-03-29',
    DATE '2024-04-01', DATE '2024-05-06', DATE '2024-05-27',
    DATE '2024-07-12', DATE '2024-08-26', DATE '2024-12-25', DATE '2024-12-26',
    DATE '2025-01-01', DATE '2025-03-17', DATE '2025-04-18',
    DATE '2025-04-21', DATE '2025-05-05', DATE '2025-05-26',
    DATE '2025-07-14', DATE '2025-08-25', DATE '2025-12-25', DATE '2025-12-26',
    DATE '2026-01-01', DATE '2026-03-17', DATE '2026-04-03',
    DATE '2026-04-06', DATE '2026-05-04', DATE '2026-05-25',
    DATE '2026-07-13', DATE '2026-08-31', DATE '2026-12-25', DATE '2026-12-28'
  ];
  ni_names TEXT[] := ARRAY[
    'New Year''s Day (substitute)','St Patrick''s Day (substitute)','Good Friday',
    'Easter Monday','Early May Bank Holiday','Coronation Bank Holiday',
    'Battle of the Boyne','Summer Bank Holiday','Christmas Day','Boxing Day',
    'New Year''s Day','St Patrick''s Day (substitute)','Good Friday',
    'Easter Monday','Early May Bank Holiday','Spring Bank Holiday',
    'Battle of the Boyne','Summer Bank Holiday','Christmas Day','Boxing Day',
    'New Year''s Day','St Patrick''s Day','Good Friday',
    'Easter Monday','Early May Bank Holiday','Spring Bank Holiday',
    'Battle of the Boyne','Summer Bank Holiday','Christmas Day','Boxing Day',
    'New Year''s Day','St Patrick''s Day','Good Friday',
    'Easter Monday','Early May Bank Holiday','Spring Bank Holiday',
    'Battle of the Boyne (substitute)','Summer Bank Holiday','Christmas Day','Boxing Day (substitute)'
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

-- Sunday reduced hours (all stores)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, NULL, 0, '11:00', '17:00', 'Sunday trading hours' FROM location;

-- Saturday late opening (high-footfall stores: London, Manchester, Birmingham)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes) VALUES
  (1, NULL, 6, '08:00', '22:00', 'Saturday extended hours'),
  (2, NULL, 6, '08:00', '22:00', 'Saturday extended hours'),
  (3, NULL, 6, '08:30', '21:30', 'Saturday extended hours'),
  (4, NULL, 6, '08:30', '21:30', 'Saturday extended hours');

-- Black Friday 2023
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2023-11-24', NULL, '07:00', '23:00', 'Black Friday extended' FROM location;

-- Christmas Eve 2023
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2023-12-24', NULL, '08:00', '22:00', 'Christmas Eve extended' FROM location;

-- Boxing Day sale 2023 (England & Wales)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes) VALUES
  (1,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (2,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (3,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (4,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (5,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (6,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (9,'2023-12-26',NULL,'09:00','21:00','Boxing Day sale');

-- Black Friday 2024
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2024-11-29', NULL, '07:00', '23:00', 'Black Friday extended' FROM location;

-- Christmas Eve 2024
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2024-12-24', NULL, '08:00', '22:00', 'Christmas Eve extended' FROM location;

-- Boxing Day sale 2024 (England & Wales)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes) VALUES
  (1,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (2,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (3,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (4,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (5,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (6,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (9,'2024-12-26',NULL,'09:00','21:00','Boxing Day sale');

-- New Year's Eve 2024 (reduced hours — all stores close early)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2024-12-31', NULL, '09:00', '18:00', 'New Year''s Eve early close' FROM location;

-- Black Friday 2025
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2025-11-28', NULL, '07:00', '23:00', 'Black Friday extended' FROM location;

-- Christmas Eve 2025
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2025-12-24', NULL, '08:00', '22:00', 'Christmas Eve extended' FROM location;

-- Boxing Day sale 2025 (England & Wales)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes) VALUES
  (1,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (2,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (3,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (4,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (5,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (6,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale'),
  (9,'2025-12-26',NULL,'09:00','21:00','Boxing Day sale');

-- New Year's Eve 2025 (all stores)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2025-12-31', NULL, '09:00', '18:00', 'New Year''s Eve early close' FROM location;

-- Easter Sunday 2024 & 2025 (reduced hours — all stores)
INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2024-03-31', NULL, '11:00', '17:00', 'Easter Sunday reduced hours' FROM location;

INSERT INTO store_secondary_schedule (location_id, schedule_date, day_of_week, start_time, end_time, notes)
SELECT id, '2025-04-20', NULL, '11:00', '17:00', 'Easter Sunday reduced hours' FROM location;
