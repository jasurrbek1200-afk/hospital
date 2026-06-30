import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import departmentsRouter from './routes/departments.js'
import queueRouter from './routes/queue.js'

dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/departments', departmentsRouter)
app.use('/api/queue', queueRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Server xatosi' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server ${port}-portda ishlamoqda`)
  console.log(process.env.ANTHROPIC_API_KEY ? 'AI yo\'naltiruvchi: yoqilgan' : 'AI yo\'naltiruvchi: o\'chiq (kalit so\'z usuli ishlatiladi)')
})
