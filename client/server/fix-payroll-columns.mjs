import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "college_erp",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

try {
  await pool.query(`
    ALTER TABLE payroll
    ADD COLUMN IF NOT EXISTS payroll_month DATE;

    ALTER TABLE payroll
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

    UPDATE payroll
    SET payroll_month = (month || '-01')::date
    WHERE payroll_month IS NULL;

    ALTER TABLE payroll
    ALTER COLUMN payroll_month SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS payroll_faculty_month_unique
    ON payroll (faculty_id, payroll_month);
  `);

  console.log("Payroll table updated successfully.");
} catch (error) {
  console.error("Migration failed:", error.message);
} finally {
  await pool.end();
}
