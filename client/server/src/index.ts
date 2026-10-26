
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import studentRoutes from "./studentRoutes.js";
import academicsRoutes from "./academicRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import facultyRoutes from "./facultyRoutes.js";
import timetableRoutes from "./timetableRoutes.js";
import researchRoutes from "./researchRoutes.js";
import payrollRoutes from "./payrollRoutes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/students", studentRoutes);
app.use("/api/academics", academicsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/payroll", payrollRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "College ERP Backend is running!",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() AS server_time");

    res.json({
      status: "success",
      message: "Backend connected to PostgreSQL!",
      database: process.env.DB_NAME || "college_erp",
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error(
      "Database health check failed:",
      error instanceof Error ? error.message : error
    );

    res.status(500).json({
      status: "error",
      message: "Database connection failed. Check server configuration.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`College ERP backend running at http://localhost:${PORT}`);
});
