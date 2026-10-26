
import { Router } from "express";
import pool from "./db.js";

const router = Router();

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const validId = (value: unknown) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

const validTime = (value: unknown) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

function validateEntry(body: any) {
  const {
    class_name,
    subject_name,
    faculty_id,
    room_name,
    day_of_week,
    start_time,
    end_time,
  } = body;

  if (
    typeof class_name !== "string" || !class_name.trim() ||
    typeof subject_name !== "string" || !subject_name.trim() ||
    typeof room_name !== "string" || !room_name.trim() ||
    !validId(faculty_id) ||
    !DAYS.includes(day_of_week) ||
    !validTime(start_time) ||
    !validTime(end_time)
  ) {
    return "Provide a class, subject, valid faculty ID, room, day, and valid start/end times.";
  }

  if (start_time >= end_time) {
    return "End time must be later than start time.";
  }

  return null;
}

async function findConflict(
  entry: any,
  excludeId?: number
) {
  const result = await pool.query(
    `SELECT t.id, t.class_name, t.room_name,
            t.day_of_week, t.start_time, t.end_time,
            t.faculty_id,
            f.first_name, f.last_name
     FROM timetable t
     JOIN faculty f ON f.id = t.faculty_id
     WHERE t.day_of_week = $1
       AND t.start_time < $3::time
       AND t.end_time > $2::time
       AND ($5::integer IS NULL OR t.id <> $5)
       AND (
         t.faculty_id = $4
         OR LOWER(t.room_name) = LOWER($6)
       )
     LIMIT 1`,
    [
      entry.day_of_week,
      entry.start_time,
      entry.end_time,
      Number(entry.faculty_id),
      excludeId ?? null,
      entry.room_name.trim(),
    ]
  );

  if (!result.rows.length) return null;

  const conflict = result.rows[0];

  if (Number(conflict.faculty_id) === Number(entry.faculty_id)) {
    return `This faculty member already has a session during this time (${conflict.class_name}).`;
  }

  return `Room ${entry.room_name} is already booked during this time.`;
}

// GET all timetable entries
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, f.first_name, f.last_name,
              f.employee_id
       FROM timetable t
       JOIN faculty f ON f.id = t.faculty_id
       ORDER BY
         CASE t.day_of_week
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
         END,
         t.start_time`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({
      message: "Failed to fetch timetable",
    });
  }
});

// GET timetable entry by ID
router.get("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid timetable ID" });
  }

  try {
    const result = await pool.query(
      `SELECT t.*, f.first_name, f.last_name, f.employee_id
       FROM timetable t
       JOIN faculty f ON f.id = t.faculty_id
       WHERE t.id = $1`,
      [Number(req.params.id)]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching timetable entry:", error);
    res.status(500).json({ message: "Failed to fetch timetable entry" });
  }
});

// POST create timetable entry
router.post("/", async (req, res) => {
  const validationError = validateEntry(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const faculty = await pool.query(
      "SELECT id FROM faculty WHERE id = $1",
      [Number(req.body.faculty_id)]
    );

    if (!faculty.rows.length) {
      return res.status(400).json({
        message: "Selected faculty member does not exist",
      });
    }

    const conflict = await findConflict(req.body);

    if (conflict) {
      return res.status(409).json({ message: conflict });
    }

    const result = await pool.query(
      `INSERT INTO timetable
       (class_name, subject_name, faculty_id, room_name,
        day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.body.class_name.trim(),
        req.body.subject_name.trim(),
        Number(req.body.faculty_id),
        req.body.room_name.trim(),
        req.body.day_of_week,
        req.body.start_time,
        req.body.end_time,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating timetable entry:", error);
    res.status(500).json({ message: "Failed to create timetable entry" });
  }
});

// PUT update timetable entry
router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid timetable ID" });
  }

  const validationError = validateEntry(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM timetable WHERE id = $1",
      [Number(req.params.id)]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    const faculty = await pool.query(
      "SELECT id FROM faculty WHERE id = $1",
      [Number(req.body.faculty_id)]
    );

    if (!faculty.rows.length) {
      return res.status(400).json({
        message: "Selected faculty member does not exist",
      });
    }

    const conflict = await findConflict(
      req.body,
      Number(req.params.id)
    );

    if (conflict) {
      return res.status(409).json({ message: conflict });
    }

    const result = await pool.query(
      `UPDATE timetable SET
       class_name = $1,
       subject_name = $2,
       faculty_id = $3,
       room_name = $4,
       day_of_week = $5,
       start_time = $6,
       end_time = $7
       WHERE id = $8
       RETURNING *`,
      [
        req.body.class_name.trim(),
        req.body.subject_name.trim(),
        Number(req.body.faculty_id),
        req.body.room_name.trim(),
        req.body.day_of_week,
        req.body.start_time,
        req.body.end_time,
        Number(req.params.id),
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating timetable entry:", error);
    res.status(500).json({ message: "Failed to update timetable entry" });
  }
});

// DELETE timetable entry
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid timetable ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM timetable WHERE id = $1 RETURNING id",
      [Number(req.params.id)]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    res.json({ message: "Timetable entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting timetable entry:", error);
    res.status(500).json({ message: "Failed to delete timetable entry" });
  }
});

export default router;
