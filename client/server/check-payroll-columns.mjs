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
  const result = await pool.query(`
    SELECT column_name, data_type, is_generated
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payroll'
    ORDER BY ordinal_position
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error.message);
} finally {
  await pool.end();
}
