import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "college_erp",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

try {
  await pool.query("ALTER TABLE payroll ALTER COLUMN month DROP NOT NULL");
  console.log("Payroll database compatibility fix completed!");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
