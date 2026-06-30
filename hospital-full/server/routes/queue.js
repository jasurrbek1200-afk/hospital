import { Router } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

router.post('/book', async (req, res) => {
  const { departmentId, patientName } = req.body || {}
  if (!departmentId) return res.status(400).json({ error: 'departmentId kerak' })
  const dept = await pool.query('select id from departments where id = $1', [departmentId])
  if (dept.rowCount === 0) return res.status(404).json({ error: 'Bo\'lim topilmadi' })

  const result = await pool.query(
    `insert into queue_entries (department_id, patient_name)
     values ($1, $2) returning id, department_id, patient_name, status, created_at`,
    [departmentId, patientName || 'Bemor']
  )
  res.status(201).json(result.rows[0])
})

router.post('/:departmentId/advance', async (req, res) => {
  const { departmentId } = req.params
  const next = await pool.query(
    `select id from queue_entries
     where department_id = $1 and status = 'waiting'
     order by created_at asc limit 1`,
    [departmentId]
  )
  if (next.rowCount === 0) return res.status(404).json({ error: 'Navbatda bemor yo\'q' })

  const updated = await pool.query(
    `update queue_entries set status = 'in_progress', called_at = now()
     where id = $1 returning id, department_id, patient_name, status, called_at`,
    [next.rows[0].id]
  )
  res.json(updated.rows[0])
})

router.post('/:entryId/finish', async (req, res) => {
  const updated = await pool.query(
    `update queue_entries set status = 'done', finished_at = now()
     where id = $1 returning id, department_id, patient_name, status, finished_at`,
    [req.params.entryId]
  )
  if (updated.rowCount === 0) return res.status(404).json({ error: 'Yozuv topilmadi' })
  res.json(updated.rows[0])
})

export default router
