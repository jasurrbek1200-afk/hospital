import { pool } from './pool.js'

const departments = [
  { id: 'terapevt', name: 'Terapevt', room: '101', floor: 1, doctor_name: 'Dr. Karimova Nilufar', rating: 4.6, reviews: 212, per_patient_minutes: 6, keywords: ['isitma', 'holsizlik', 'sovuq', 'gripp', 'umumiy', 'shamollash', 'charchoq'] },
  { id: 'nevrolog', name: 'Nevrolog', room: '205', floor: 2, doctor_name: 'Dr. Yusupov Bobur', rating: 4.8, reviews: 156, per_patient_minutes: 10, keywords: ['bosh', 'migren', 'uyqu', 'bosh aylanishi', 'asab', 'uxlay olmayman'] },
  { id: 'lor', name: 'LOR', room: '108', floor: 1, doctor_name: 'Dr. Rashidova Madina', rating: 4.4, reviews: 98, per_patient_minutes: 8, keywords: ['tomoq', 'quloq', 'burun', 'yotal', 'gaymorit', 'nafas'] },
  { id: 'stomatolog', name: 'Stomatolog', room: '301', floor: 3, doctor_name: 'Dr. Tolipov Sardor', rating: 4.9, reviews: 340, per_patient_minutes: 15, keywords: ['tish', "og'iz", 'milk'] },
  { id: 'kardiolog', name: 'Kardiolog', room: '210', floor: 2, doctor_name: 'Dr. Azimova Dilnoza', rating: 4.7, reviews: 188, per_patient_minutes: 12, keywords: ['yurak', "ko'krak", 'bosim', 'qon bosimi', 'puls'] },
  { id: 'oftalmolog', name: 'Oftalmolog', room: '115', floor: 1, doctor_name: 'Dr. Nazarov Jasur', rating: 4.5, reviews: 74, per_patient_minutes: 9, keywords: ["ko'z", "ko'rish"] },
]

const sampleQueueCounts = { terapevt: 7, nevrolog: 3, lor: 5, stomatolog: 2, kardiolog: 6, oftalmolog: 1 }

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('delete from queue_entries')
    await client.query('delete from departments')
    for (const d of departments) {
      await client.query(
        `insert into departments (id, name, room, floor, doctor_name, rating, reviews, per_patient_minutes, keywords)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [d.id, d.name, d.room, d.floor, d.doctor_name, d.rating, d.reviews, d.per_patient_minutes, d.keywords]
      )
      const count = sampleQueueCounts[d.id] || 0
      for (let i = 0; i < count; i++) {
        await client.query(
          `insert into queue_entries (department_id, patient_name) values ($1, $2)`,
          [d.id, `Bemor ${i + 1}`]
        )
      }
    }
    await client.query('commit')
    console.log('Boshlang\'ich ma\'lumotlar yuklandi.')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('Seed xatosi:', err)
  process.exit(1)
})
