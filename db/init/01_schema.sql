-- ============================================================
-- EBP AI Assistant - Database Schema
-- ============================================================

-- Locations / Stores
CREATE TABLE location (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    region      VARCHAR(100) NOT NULL
);

-- Employees
CREATE TABLE employee (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(150) NOT NULL,
    email                   VARCHAR(150) UNIQUE NOT NULL,
    role                    VARCHAR(100) NOT NULL,
    location_id             INT NOT NULL REFERENCES location(id),
    secondary_location_id   INT REFERENCES location(id),
    hire_date               DATE NOT NULL,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE
);

-- Full-day leaves
CREATE TABLE employee_leave (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employee(id),
    leave_date      DATE NOT NULL,
    leave_type      VARCHAR(50) NOT NULL,   -- SICK, CASUAL, EARNED, UNPAID
    status          VARCHAR(20) NOT NULL DEFAULT 'APPROVED',  -- APPROVED, PENDING, REJECTED
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Half-day leaves
CREATE TABLE employee_half_day_leave (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES employee(id),
    leave_date      DATE NOT NULL,
    half             VARCHAR(10) NOT NULL,   -- MORNING, AFTERNOON
    leave_type      VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Location-wise public/regional holidays
CREATE TABLE location_holiday (
    id              SERIAL PRIMARY KEY,
    location_id     INT NOT NULL REFERENCES location(id),
    holiday_date    DATE NOT NULL,
    holiday_name    VARCHAR(150) NOT NULL
);

-- Store secondary working schedule (specific dates/days a store operates on secondary hours)
CREATE TABLE store_secondary_schedule (
    id              SERIAL PRIMARY KEY,
    location_id     INT NOT NULL REFERENCES location(id),
    schedule_date   DATE,                   -- NULL means recurring by day_of_week
    day_of_week     INT,                    -- 0=Sun..6=Sat, NULL if specific date
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    notes           VARCHAR(255)
);

-- Indexes for query performance
CREATE INDEX idx_emp_leave_emp_date     ON employee_leave(employee_id, leave_date);
CREATE INDEX idx_emp_leave_date         ON employee_leave(leave_date);
CREATE INDEX idx_half_leave_emp_date    ON employee_half_day_leave(employee_id, leave_date);
CREATE INDEX idx_holiday_loc_date       ON location_holiday(location_id, holiday_date);
CREATE INDEX idx_emp_location           ON employee(location_id);
CREATE INDEX idx_schedule_location      ON store_secondary_schedule(location_id);
