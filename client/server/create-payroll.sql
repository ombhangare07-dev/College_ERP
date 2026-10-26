CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    month VARCHAR(7) NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL CHECK (basic_salary >= 0),
    allowances NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (allowances >= 0),
    deductions NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
    gross_salary NUMERIC(12, 2) GENERATED ALWAYS AS (basic_salary + allowances) STORED,
    net_salary NUMERIC(12, 2) GENERATED ALWAYS AS (basic_salary + allowances - deductions) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Paid')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (faculty_id, month),
    CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

