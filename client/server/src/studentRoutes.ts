import { Router, Request, Response } from "express";
import db from "./db.js";

const router = Router();

// GET: Retrieve all students
router.get("/", async (_req: Request, res: Response) => {
try {
const result = await db.query(
"SELECT * FROM public.students ORDER BY id DESC"
);

res.json(result.rows);

} catch (error) {
console.error("Error fetching students:", error);

res.status(500).json({
  message: "Failed to retrieve students. Check the backend terminal.",
});

}
});

// GET: Retrieve one student by ID
router.get("/:id", async (req: Request, res: Response) => {
const id = Number(req.params.id);

if (!Number.isInteger(id) || id <= 0) {
res.status(400).json({ message: "Invalid student ID." });
return;
}

try {
const result = await db.query(
"SELECT * FROM public.students WHERE id = $1",
[id]
);

if (result.rows.length === 0) {
  res.status(404).json({ message: "Student not found." });
  return;
}

res.json(result.rows[0]);

} catch (error) {
console.error("Error fetching student:", error);
res.status(500).json({ message: "Failed to retrieve student." });
}
});

// POST: Add a student
router.post("/", async (req: Request, res: Response) => {
const {
roll_number,
first_name,
last_name,
email,
phone,
department,
academic_year,
semester,
} = req.body;

if (
typeof roll_number !== "string" ||
!roll_number.trim() ||
typeof first_name !== "string" ||
!first_name.trim() ||
typeof last_name !== "string" ||
!last_name.trim() ||
typeof department !== "string" ||
!department.trim() ||
typeof academic_year !== "string" ||
!academic_year.trim() ||
!Number.isInteger(semester) ||
semester < 1 ||
semester > 8
) {
res.status(400).json({
message: "Provide all required fields and a semester between 1 and 8.",
});
return;
}

try {
const result = await db.query(
`INSERT INTO public.students
       (roll_number, first_name, last_name, email, phone, department, academic_year, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
[
roll_number.trim(),
first_name.trim(),
last_name.trim(),
typeof email === "string" ? email.trim() || null : null,
typeof phone === "string" ? phone.trim() || null : null,
department.trim(),
academic_year.trim(),
semester,
]
);

res.status(201).json(result.rows[0]);

} catch (error) {
if ((error as { code?: string }).code === "23505") {
res.status(409).json({
message: "That roll number or email is already registered.",
});
return;
}

console.error("Error adding student:", error);
res.status(500).json({ message: "Failed to add student." });

}
});

// PUT: Update a student
router.put("/:id", async (req: Request, res: Response) => {
const id = Number(req.params.id);

if (!Number.isInteger(id) || id <= 0) {
res.status(400).json({ message: "Invalid student ID." });
return;
}

const {
roll_number,
first_name,
last_name,
email,
phone,
department,
academic_year,
semester,
} = req.body;

if (
typeof roll_number !== "string" ||
!roll_number.trim() ||
typeof first_name !== "string" ||
!first_name.trim() ||
typeof last_name !== "string" ||
!last_name.trim() ||
typeof department !== "string" ||
!department.trim() ||
typeof academic_year !== "string" ||
!academic_year.trim() ||
!Number.isInteger(semester) ||
semester < 1 ||
semester > 8
) {
res.status(400).json({
message: "Provide all required fields and a semester between 1 and 8.",
});
return;
}

try {
const result = await db.query(
`UPDATE public.students SET
       roll_number = $1,
       first_name = $2,
       last_name = $3,
       email = $4,
       phone = $5,
       department = $6,
       academic_year = $7,
       semester = $8
       WHERE id = $9
       RETURNING *`,
[
roll_number.trim(),
first_name.trim(),
last_name.trim(),
typeof email === "string" ? email.trim() || null : null,
typeof phone === "string" ? phone.trim() || null : null,
department.trim(),
academic_year.trim(),
semester,
id,
]
);

if (result.rows.length === 0) {
  res.status(404).json({ message: "Student not found." });
  return;
}

res.json(result.rows[0]);

} catch (error) {
if ((error as { code?: string }).code === "23505") {
res.status(409).json({
message: "That roll number or email is already registered.",
});
return;
}

console.error("Error updating student:", error);
res.status(500).json({ message: "Failed to update student." });

}
});

// DELETE: Delete a student
router.delete("/:id", async (req: Request, res: Response) => {
const id = Number(req.params.id);

if (!Number.isInteger(id) || id <= 0) {
res.status(400).json({ message: "Invalid student ID." });
return;
}

try {
const result = await db.query(
"DELETE FROM public.students WHERE id = $1 RETURNING id",
[id]
);

if (result.rows.length === 0) {
  res.status(404).json({ message: "Student not found." });
  return;
}

res.json({ message: "Student deleted successfully." });

} catch (error) {
console.error("Error deleting student:", error);
res.status(500).json({ message: "Failed to delete student." });
}
});

export default router;
