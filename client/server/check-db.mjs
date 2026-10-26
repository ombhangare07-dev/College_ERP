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
  const result = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name",
    ["public"]
  );

  console.log("Database tables:");
  console.log(result.rows.map(row => row.table_name).join("\n") || "No tables found");
} catch (error) {
  console.error("Database check failed:", error.message);
} finally {
  await pool.end();
}
