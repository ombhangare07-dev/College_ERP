
import { Router } from "express";
import pool from "./db.js";

const router = Router();

// GET all faculty
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM faculty ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ message: "Failed to fetch faculty" });
  }
});

// GET faculty by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM faculty WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ message: "Failed to fetch faculty" });
  }
});

// POST add faculty
router.post("/", async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      designation,
      joining_date,
      employment_status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO faculty
      (employee_id, first_name, last_name, email, phone,
       department, designation, joining_date, employment_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        employee_id,
        first_name,
        last_name,
        email || null,
        phone || null,
        department,
        designation,
        joining_date || null,
        employment_status || "Active"
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding faculty:", error);
    res.status(500).json({ message: "Failed to add faculty" });
  }
});

// PUT update faculty
router.put("/:id", async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      designation,
      joining_date,
      employment_status
    } = req.body;

    const result = await pool.query(
      `UPDATE faculty SET
      employee_id=$1,
      first_name=$2,
      last_name=$3,
      email=$4,
      phone=$5,
      department=$6,
      designation=$7,
      joining_date=$8,
      employment_status=$9
      WHERE id=$10
      RETURNING *`,
      [
        employee_id,
        first_name,
        last_name,
        email || null,
        phone || null,
        department,
        designation,
        joining_date || null,
        employment_status || "Active",
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating faculty:", error);
    res.status(500).json({ message: "Failed to update faculty" });
  }
});

// DELETE faculty
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM faculty WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("Error deleting faculty:", error);
    res.status(500).json({ message: "Failed to delete faculty" });
  }
});

export default router;
