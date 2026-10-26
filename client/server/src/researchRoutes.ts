import { Router, type Request, type Response } from "express";
import pool from "./db.js";
const router = Router();
let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  if (!schemaReady) schemaReady = pool.query(`
    CREATE TABLE IF NOT EXISTS research_publications (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      authors VARCHAR(500) NOT NULL,
      department VARCHAR(180) NOT NULL,
      publication_type VARCHAR(80) NOT NULL DEFAULT 'Journal Article',
      journal VARCHAR(300), doi VARCHAR(200), publication_date DATE,
      status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Under Review','Published','Rejected')),
      abstract TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch((err) => { schemaReady = null; throw err; });
  return schemaReady;
}
const statuses = ['Draft','Submitted','Under Review','Published','Rejected'];
function validate(body: any) {
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 300) return 'Title is required (maximum 300 characters).';
  if (typeof body.authors !== 'string' || !body.authors.trim() || body.authors.trim().length > 500) return 'Authors are required (maximum 500 characters).';
  if (typeof body.department !== 'string' || !body.department.trim() || body.department.trim().length > 180) return 'Department is required (maximum 180 characters).';
  if (typeof body.publication_type !== 'string' || !body.publication_type.trim() || body.publication_type.length > 80) return 'Provide a valid publication type.';
  if (body.status !== undefined && !statuses.includes(body.status)) return 'Invalid publication status.';
  if (body.publication_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.publication_date)) return 'Publication date must use YYYY-MM-DD format.';
  return null;
}
router.use(async (_req, res, next) => { try { await ensureSchema(); next(); } catch (e) { console.error('Research schema initialization failed:', e); res.status(500).json({message:'Could not initialize research workspace database table.'}); } });
router.get('/', async (_req: Request, res: Response) => {
  try { const result = await pool.query('SELECT * FROM research_publications ORDER BY updated_at DESC, id DESC'); res.json(result.rows); }
  catch (e) { console.error('Research list failed:', e); res.status(500).json({message:'Failed to load research records.'}); }
});
router.post('/', async (req: Request, res: Response) => {
  const error = validate(req.body ?? {}); if (error) return res.status(400).json({message:error});
  const b = req.body;
  try { const result = await pool.query(`INSERT INTO research_publications (title,authors,department,publication_type,journal,doi,publication_date,status,abstract) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [b.title.trim(),b.authors.trim(),b.department.trim(),b.publication_type.trim(),b.journal?.trim() || null,b.doi?.trim() || null,b.publication_date || null,b.status || 'Draft',b.abstract?.trim() || null]); res.status(201).json(result.rows[0]); }
  catch (e) { console.error('Research create failed:', e); res.status(500).json({message:'Failed to create research record.'}); }
});
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) return res.status(400).json({message:'Invalid research record ID.'});
  const error = validate(req.body ?? {}); if (error) return res.status(400).json({message:error}); const b = req.body;
  try { const result = await pool.query(`UPDATE research_publications SET title=$1,authors=$2,department=$3,publication_type=$4,journal=$5,doi=$6,publication_date=$7,status=$8,abstract=$9,updated_at=NOW() WHERE id=$10 RETURNING *`, [b.title.trim(),b.authors.trim(),b.department.trim(),b.publication_type.trim(),b.journal?.trim() || null,b.doi?.trim() || null,b.publication_date || null,b.status || 'Draft',b.abstract?.trim() || null,id]); if (!result.rows.length) return res.status(404).json({message:'Research record not found.'}); res.json(result.rows[0]); }
  catch (e) { console.error('Research update failed:', e); res.status(500).json({message:'Failed to update research record.'}); }
});
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) return res.status(400).json({message:'Invalid research record ID.'});
  try { const result = await pool.query('DELETE FROM research_publications WHERE id=$1 RETURNING id',[id]); if (!result.rows.length) return res.status(404).json({message:'Research record not found.'}); res.json({message:'Research record deleted.'}); }
  catch (e) { console.error('Research delete failed:', e); res.status(500).json({message:'Failed to delete research record.'}); }
});
export default router;
