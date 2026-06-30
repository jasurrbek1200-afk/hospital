import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/pool.js'

const router = Router()

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const departmentWithQueueSql = `
  select
    d.id, d.name, d.room, d.floor, d.doctor_name, d.rating, d.reviews,
    d.per_patient_minutes, d.keywords,
    count(q.id) filter (where q.status = 'waiting') as queue_count
  from departments d
  left join queue_entries q on q.department_id = d.id
  group by d.id
  order by d.room
`

router.get('/', async (req, res) => {
  const result = await pool.query(departmentWithQueueSql)
  res.json(result.rows.map(formatDepartment))
})

router.post('/match-symptom', async (req, res) => {
  const { text } = req.body || {}
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text maydoni kerak' })
  }
  const result = await pool.query(departmentWithQueueSql)
  const departments = result.rows.map(formatDepartment)

  if (anthropic) {
    try {
      const match = await matchWithAI(text, departments)
      return res.json(match)
    } catch (err) {
      console.error('AI xatosi, kalit so\'z usuliga o\'tildi:', err.message)
    }
  }

  res.json(matchWithKeywords(text, result.rows))
})

async function matchWithAI(text, departments) {
  const deptList = departments.map((d) => `${d.id}: ${d.name}`).join(', ')
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: `Sen shifoxonada bemorni to'g'ri bo'limga yo'naltiruvchi yordamchisan. Bo'limlar: ${deptList}. Bemor alomatini o'qib, eng mos bo'lim id sini va qisqa (1 jumla, o'zbek tilida) tushuntirishni faqat shu JSON formatida qaytar, boshqa hech narsa yozma: {"departmentId": "...", "reason": "..."}`,
    messages: [{ role: 'user', content: text }],
  })
  const textBlock = message.content.find((b) => b.type === 'text')
  const parsed = JSON.parse(textBlock.text.trim())
  const match = departments.find((d) => d.id === parsed.departmentId) || departments[0]
  return { match, reason: parsed.reason, source: 'ai' }
}

function matchWithKeywords(text, rows) {
  const val = text.toLowerCase()
  let best = null
  let bestScore = 0
  for (const dept of rows) {
    const score = dept.keywords.filter((k) => val.includes(k)).length
    if (score > bestScore) {
      bestScore = score
      best = dept
    }
  }
  return {
    match: best ? formatDepartment(best) : formatDepartment(rows[0]),
    reason: best ? "Alomatga mos kalit so'zlar topildi." : 'Aniq mos bo\'lim topilmadi, terapevtdan boshlash tavsiya etiladi.',
    source: 'keywords',
  }
}

function formatDepartment(row) {
  const queue = Number(row.queue_count)
  const waitMinutes = queue * row.per_patient_minutes
  return {
    id: row.id,
    name: row.name,
    room: row.room,
    floor: row.floor,
    doctorName: row.doctor_name,
    rating: Number(row.rating),
    reviews: row.reviews,
    perPatientMinutes: row.per_patient_minutes,
    queue,
    waitMinutes,
  }
}

export default router
