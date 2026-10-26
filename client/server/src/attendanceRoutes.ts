
import { Router } from "express";
import db from "./db.js";

const router = Router();
// GET attendance percentages and low-attendance alerts
router.get("/summary", async (req, res) => {
  try {
    const threshold = Number(req.query.threshold ?? 75);
    const subjectId = req.query.subject_id;
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;

    if (
      !Number.isFinite(threshold) ||
      threshold < 0 ||
      threshold > 100
    ) {
      return res.status(400).json({
        message: "Threshold must be between 0 and 100.",
      });
    }

    const values: unknown[] = [];
    const conditions: string[] = [];

    if (subjectId !== undefined) {
      if (!/^[1-9]\d*$/.test(String(subjectId))) {
        return res.status(400).json({
          message: "Invalid subject ID.",
        });
      }

      values.push(Number(subjectId));
      conditions.push(
        `a.subject_id = $${values.length}`
      );
    }

    const isValidDate = (value: unknown) =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`)
        .toISOString()
        .startsWith(value);

    if (dateFrom !== undefined) {
      if (!isValidDate(dateFrom)) {
        return res.status(400).json({
          message: "date_from must be a valid YYYY-MM-DD date.",
        });
      }

      values.push(dateFrom);
      conditions.push(
        `a.attendance_date >= $${values.length}::date`
      );
    }

    if (dateTo !== undefined) {
      if (!isValidDate(dateTo)) {
        return res.status(400).json({
          message: "date_to must be a valid YYYY-MM-DD date.",
        });
      }

      values.push(dateTo);
      conditions.push(
        `a.attendance_date <= $${values.length}::date`
      );
    }

    if (
      dateFrom !== undefined &&
      dateTo !== undefined &&
      String(dateFrom) > String(dateTo)
    ) {
      return res.status(400).json({
        message: "date_from must be on or before date_to.",
      });
    }

    values.push(threshold);
    const thresholdParam = `$${values.length}`;

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await db.query(
      `
      SELECT
        s.id AS student_id,
        s.roll_number,
        s.first_name,
        s.last_name,
        sub.id AS subject_id,
        sub.subject_name,
        COUNT(a.id)::int AS total_classes,
        COUNT(a.id) FILTER (
          WHERE a.status IN ('Present', 'Late')
        )::int AS attended_classes,
        COUNT(a.id) FILTER (
          WHERE a.status = 'Absent'
        )::int AS absent_classes,
        CASE
          WHEN COUNT(a.id) = 0 THEN 0
          ELSE ROUND(
            100.0 *
            COUNT(a.id) FILTER (
              WHERE a.status IN ('Present', 'Late')
            ) / COUNT(a.id),
            2
          )
        END AS attendance_percentage,
        CASE
          WHEN COUNT(a.id) = 0 THEN false
          ELSE
            100.0 *
            COUNT(a.id) FILTER (
              WHERE a.status IN ('Present', 'Late')
            ) / COUNT(a.id) < ${thresholdParam}
        END AS below_threshold
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN subjects sub ON sub.id = a.subject_id
      ${whereClause}
      GROUP BY
        s.id, s.roll_number, s.first_name, s.last_name,
        sub.id, sub.subject_name
      ORDER BY attendance_percentage ASC, s.roll_number
      `,
      values
    );

    res.json({
      threshold,
      count: result.rows.length,
      summaries: result.rows,
    });
  } catch (error) {
    console.error("Attendance summary error:", error);
    res.status(500).json({
      message: "Failed to calculate attendance summary.",
    });
  }
});

// Get attendance records
router.get("/", async (req, res) => {
  try {
    const { date, student_id, subject_id } = req.query;

    let query = `
      SELECT
        a.*,
        s.roll_number,
        s.first_name,
        s.last_name,
        sub.subject_name,
        sub.subject_code
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE 1 = 1
    `;

    const values: unknown[] = [];

    if (date) {
      values.push(date);
      query += ` AND a.attendance_date = $${values.length}`;
    }

    if (student_id) {
      values.push(student_id);
      query += ` AND a.student_id = $${values.length}`;
    }

    if (subject_id) {
      values.push(subject_id);
      query += ` AND a.subject_id = $${values.length}`;
    }

    query += " ORDER BY a.attendance_date DESC, s.roll_number";

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance." });
  }
});

// Mark or update attendance
router.post("/", async (req, res) => {
  try {
    const {
      student_id,
      subject_id,
      attendance_date,
      status,
      remarks,
    } = req.body;

    if (
      !student_id ||
      !subject_id ||
      !attendance_date ||
      !["Present", "Absent", "Late"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Student, subject, date, and a valid attendance status are required.",
      });
    }

    const result = await db.query(
      `INSERT INTO attendance
        (student_id, subject_id, attendance_date, status, remarks)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, subject_id, attendance_date)
       DO UPDATE SET
         status = EXCLUDED.status,
         remarks = EXCLUDED.remarks
       RETURNING *`,
      [student_id, subject_id, attendance_date, status, remarks || null]
    );

    res.status(200).json({
      message: "Attendance saved successfully.",
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error("Save attendance error:", error);
    res.status(500).json({
      message: "Failed to save attendance. Check student, subject, and date.",
    });
  }
});

export default router;
