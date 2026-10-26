import pg from "pg";
import dotenv from "dotenv";
import { readFile, writeFile } from "node:fs/promises";

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "college_erp",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

try {
  let sql = await readFile("./create-payroll.sql", "utf8");

  // Remove a hidden UTF-8 BOM, if present.
  sql = sql.replace(/^\uFEFF/, "");

  // Rewrite the SQL file without a BOM.
  await writeFile("./create-payroll.sql", sql, { encoding: "utf8" });

  await pool.query(sql);

  console.log("Success! Payroll table created.");
} catch (error) {
  console.error("Migration failed:", error.message);
} finally {
  await pool.end();
}
