import { Router, Request, Response } from "express";
import pool from "./db.js";

const router = Router();

// Get all courses
router.get("/courses", async (_req: Request, res: Response) => {
try {
const result = await pool.query(
"SELECT * FROM courses ORDER BY id DESC"
);
res.json(result.rows);
} catch (error) {
console.error("Error fetching courses:", error);
res.status(500).json({ message: "Failed to fetch courses" });
}
});

// Get one course
router.get("/courses/:id", async (req: Request, res: Response) => {
try {
const result = await pool.query(
"SELECT * FROM courses WHERE id = $1",
[req.params.id]
);

if (result.rows.length === 0) {
  return res.status(404).json({ message: "Course not found" });
}

res.json(result.rows[0]);

} catch (error) {
console.error("Error fetching course:", error);
res.status(500).json({ message: "Failed to fetch course" });
}
});

// Add a course
router.post("/courses", async (req: Request, res: Response) => {
const {
course_code,
course_name,
department,
duration_years,
total_semesters,
description,
} = req.body;

if (
!course_code?.trim() ||
!course_name?.trim() ||
!department?.trim() ||
!Number.isInteger(Number(duration_years)) ||
!Number.isInteger(Number(total_semesters))
) {
return res.status(400).json({
message: "Enter all required course details correctly",
});
}

const duration = Number(duration_years);
const semesters = Number(total_semesters);

if (duration < 1 || duration > 6 || semesters < 1 || semesters > 12) {
return res.status(400).json({
message: "Duration must be 1–6 years and semesters must be 1–12",
});
}

try {
const result = await pool.query(
`INSERT INTO courses
       (course_code, course_name, department, duration_years, total_semesters, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
[
course_code.trim(),
course_name.trim(),
department.trim(),
duration,
semesters,
description?.trim() || null,
]
);

res.status(201).json(result.rows[0]);

} catch (error: any) {
if (error.code === "23505") {
return res.status(409).json({
message: "A course with this code already exists",
});
}

console.error("Error creating course:", error);
res.status(500).json({ message: "Failed to create course" });

}
});

// Update a course
router.put("/courses/:id", async (req: Request, res: Response) => {
const {
course_code,
course_name,
department,
duration_years,
total_semesters,
description,
} = req.body;

if (
!course_code?.trim() ||
!course_name?.trim() ||
!department?.trim() ||
!Number.isInteger(Number(duration_years)) ||
!Number.isInteger(Number(total_semesters))
) {
return res.status(400).json({
message: "Enter all required course details correctly",
});
}

const duration = Number(duration_years);
const semesters = Number(total_semesters);

if (duration < 1 || duration > 6 || semesters < 1 || semesters > 12) {
return res.status(400).json({
message: "Duration must be 1–6 years and semesters must be 1–12",
});
}

try {
const result = await pool.query(
`UPDATE courses
       SET course_code = $1,
           course_name = $2,
           department = $3,
           duration_years = $4,
           total_semesters = $5,
           description = $6
       WHERE id = $7
       RETURNING *`,
[
course_code.trim(),
course_name.trim(),
department.trim(),
duration,
semesters,
description?.trim() || null,
req.params.id,
]
);

if (result.rows.length === 0) {
  return res.status(404).json({ message: "Course not found" });
}

res.json(result.rows[0]);

} catch (error: any) {
if (error.code === "23505") {
return res.status(409).json({
message: "A course with this code already exists",
});
}

console.error("Error updating course:", error);
res.status(500).json({ message: "Failed to update course" });

}
});

// Delete a course and its associated subjects
router.delete("/courses/:id", async (req: Request, res: Response) => {
try {
const result = await pool.query(
"DELETE FROM courses WHERE id = $1 RETURNING id",
[req.params.id]
);

if (result.rows.length === 0) {
  return res.status(404).json({ message: "Course not found" });
}

res.json({
  message: "Course and its associated subjects deleted successfully",
});

} catch (error) {
console.error("Error deleting course:", error);
res.status(500).json({ message: "Failed to delete course" });
}
});

// Get all subjects, including their course names
router.get("/subjects", async (_req: Request, res: Response) => {
try {
const result = await pool.query(
`SELECT subjects.*, courses.course_name, courses.course_code
       FROM subjects
       JOIN courses ON subjects.course_id = courses.id
       ORDER BY subjects.course_id, subjects.semester, subjects.subject_name`
);

res.json(result.rows);

} catch (error) {
console.error("Error fetching subjects:", error);
res.status(500).json({ message: "Failed to fetch subjects" });
}
});

// Add a subject
router.post("/subjects", async (req: Request, res: Response) => {
const {
subject_code,
subject_name,
course_id,
semester,
credits,
description,
} = req.body;

const courseId = Number(course_id);
const semesterNumber = Number(semester);
const creditNumber = credits === undefined ? 4 : Number(credits);

if (
!subject_code?.trim() ||
!subject_name?.trim() ||
!Number.isInteger(courseId) ||
courseId < 1 ||
!Number.isInteger(semesterNumber) ||
!Number.isInteger(creditNumber)
) {
return res.status(400).json({
message: "Enter all required subject details correctly",
});
}

if (semesterNumber < 1 || semesterNumber > 12 || creditNumber < 1 || creditNumber > 10) {
return res.status(400).json({
message: "Semester must be 1–12 and credits must be 1–10",
});
}

try {
const result = await pool.query(
`INSERT INTO subjects
       (subject_code, subject_name, course_id, semester, credits, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
[
subject_code.trim(),
subject_name.trim(),
courseId,
semesterNumber,
creditNumber,
description?.trim() || null,
]
);

res.status(201).json(result.rows[0]);

} catch (error: any) {
if (error.code === "23505") {
return res.status(409).json({
message: "Subject code already exists, or this subject is already listed for that course and semester",
});
}

if (error.code === "23503") {
  return res.status(400).json({ message: "Selected course does not exist" });
}

console.error("Error creating subject:", error);
res.status(500).json({ message: "Failed to create subject" });

}
});

// Update a subject
router.put("/subjects/:id", async (req: Request, res: Response) => {
const {
subject_code,
subject_name,
course_id,
semester,
credits,
description,
} = req.body;

const courseId = Number(course_id);
const semesterNumber = Number(semester);
const creditNumber = Number(credits);

if (
!subject_code?.trim() ||
!subject_name?.trim() ||
!Number.isInteger(courseId) ||
courseId < 1 ||
!Number.isInteger(semesterNumber) ||
!Number.isInteger(creditNumber)
) {
return res.status(400).json({
message: "Enter all required subject details correctly",
});
}

if (semesterNumber < 1 || semesterNumber > 12 || creditNumber < 1 || creditNumber > 10) {
return res.status(400).json({
message: "Semester must be 1–12 and credits must be 1–10",
});
}

try {
const result = await pool.query(
`UPDATE subjects
       SET subject_code = $1,
           subject_name = $2,
           course_id = $3,
           semester = $4,
           credits = $5,
           description = $6
       WHERE id = $7
       RETURNING *`,
[
subject_code.trim(),
subject_name.trim(),
courseId,
semesterNumber,
creditNumber,
description?.trim() || null,
req.params.id,
]
);

if (result.rows.length === 0) {
  return res.status(404).json({ message: "Subject not found" });
}

res.json(result.rows[0]);

} catch (error: any) {
if (error.code === "23505") {
return res.status(409).json({
message: "Subject code already exists, or this subject is already listed for that course and semester",
});
}

if (error.code === "23503") {
  return res.status(400).json({ message: "Selected course does not exist" });
}

console.error("Error updating subject:", error);
res.status(500).json({ message: "Failed to update subject" });
}
});

// Delete a subject
// Delete a subject
router.delete("/subjects/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM subjects WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    return res.json({
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return res.status(500).json({ message: "Failed to delete subject" });
  }
});

export default router;
