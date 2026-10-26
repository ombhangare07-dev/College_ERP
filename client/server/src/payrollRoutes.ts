import { Router } from "express";
import pool from "./db.js";

const router = Router();

const validId = (value: unknown) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

const validMonth = (value: unknown) =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

const validMoney = (value: unknown) =>
  value !== "" && value !== null && value !== undefined &&
  Number.isFinite(Number(value)) && Number(value) >= 0;

function validatePayroll(body: any) {
  if (!validId(body.faculty_id)) return "Select a valid faculty member.";
  if (!validMonth(body.payroll_month)) return "Payroll month must use YYYY-MM format.";
  if (!validMoney(body.basic_salary) || !validMoney(body.allowances ?? 0) ||
      !validMoney(body.deductions ?? 0)) {
    return "Salary, allowances, and deductions must be non-negative numbers.";
  }
  if (Number(body.deductions ?? 0) > Number(body.basic_salary) + Number(body.allowances ?? 0)) {
    return "Deductions cannot exceed gross salary.";
  }
  return null;
}

// GET payroll records. Optional filters: ?month=YYYY-MM&status=Pending|Paid
router.get("/", async (req, res) => {
  try {
    const values: unknown[] = [];
    const filters: string[] = [];
    if (req.query.month) {
      if (!validMonth(req.query.month)) return res.status(400).json({ message: "Month must use YYYY-MM format." });
      values.push(`${req.query.month}-01`);
      filters.push(`p.payroll_month = $${values.length}::date`);
    }
    if (req.query.status) {
      if (!["Pending", "Paid"].includes(String(req.query.status))) {
        return res.status(400).json({ message: "Status must be Pending or Paid." });
      }
      values.push(req.query.status);
      filters.push(`p.status = $${values.length}`);
    }
    const result = await pool.query(
      `SELECT p.*, f.employee_id, f.first_name, f.last_name, f.department, f.designation
       FROM payroll p JOIN faculty f ON f.id = p.faculty_id
       ${filters.length ? "WHERE " + filters.join(" AND ") : ""}
       ORDER BY p.payroll_month DESC, f.last_name, f.first_name`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching payroll:", error);
    res.status(500).json({ message: "Failed to fetch payroll records. Ensure the payroll migration has been applied." });
  }
});

// Create one payroll record per faculty member per month.
router.post("/", async (req, res) => {
  const errorMessage = validatePayroll(req.body);
  if (errorMessage) return res.status(400).json({ message: errorMessage });

  const { faculty_id, payroll_month } = req.body;
  const basic = Number(req.body.basic_salary);
  const allowances = Number(req.body.allowances ?? 0);
  const deductions = Number(req.body.deductions ?? 0);
  const monthDate = `${payroll_month}-01`;

  try {
    const faculty = await pool.query("SELECT id FROM faculty WHERE id = $1", [Number(faculty_id)]);
    if (!faculty.rows.length) return res.status(400).json({ message: "Selected faculty member does not exist." });

    const result = await pool.query(
      `INSERT INTO payroll (faculty_id, payroll_month, basic_salary, allowances, deductions, status)
       VALUES ($1, $2::date, $3, $4, $5, 'Pending')
       RETURNING *, (basic_salary + allowances) AS gross_salary,
                     (basic_salary + allowances - deductions) AS net_salary`,
      [Number(faculty_id), monthDate, basic, allowances, deductions]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") return res.status(409).json({ message: "Payroll already exists for this faculty member and month." });
    if (error.code === "23503") return res.status(400).json({ message: "Selected faculty member does not exist." });
    console.error("Error creating payroll:", error);
    res.status(500).json({ message: "Failed to create payroll record. Ensure the payroll migration has been applied." });
  }
});

// Update salary values and/or payment status.
router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid payroll ID." });

  const { basic_salary, allowances = 0, deductions = 0, status } = req.body;
  if (!validMoney(basic_salary) || !validMoney(allowances) || !validMoney(deductions)) {
    return res.status(400).json({ message: "Salary, allowances, and deductions must be non-negative numbers." });
  }
  if (Number(deductions) > Number(basic_salary) + Number(allowances)) {
    return res.status(400).json({ message: "Deductions cannot exceed gross salary." });
  }
  if (status !== undefined && !["Pending", "Paid"].includes(status)) {
    return res.status(400).json({ message: "Status must be Pending or Paid." });
  }

  try {
    const result = await pool.query(
      `UPDATE payroll SET basic_salary = $1, allowances = $2, deductions = $3,
       status = COALESCE($4, status), updated_at = NOW()
       WHERE id = $5
       RETURNING *, (basic_salary + allowances) AS gross_salary,
                     (basic_salary + allowances - deductions) AS net_salary`,
      [Number(basic_salary), Number(allowances), Number(deductions), status ?? null, Number(req.params.id)]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Payroll record not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating payroll:", error);
    res.status(500).json({ message: "Failed to update payroll record. Ensure the payroll migration has been applied." });
  }
});

// Delete a payroll record.
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid payroll ID." });
  try {
    const result = await pool.query("DELETE FROM payroll WHERE id = $1 RETURNING id", [Number(req.params.id)]);
    if (!result.rows.length) return res.status(404).json({ message: "Payroll record not found." });
    res.json({ message: "Payroll record deleted successfully." });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    res.status(500).json({ message: "Failed to delete payroll record. Ensure the payroll migration has been applied." });
  }
});

export default router;
