let departments = []
let activeId = null

const floorGrid = document.getElementById('floor-grid')
const detailCard = document.getElementById('detail-card')
const doctorGrid = document.getElementById('doctor-grid')
const suggestionText = document.getElementById('suggestion-text')
const patientView = document.getElementById('patient-view')
const doctorView = document.getElementById('doctor-view')
const symptomBtn = document.getElementById('symptom-btn')

function waitLabel(d) {
  const h = Math.floor(d.waitMinutes / 60)
  const m = d.waitMinutes % 60
  return h > 0 ? `${h} soat ${m} daq` : `${m} daqiqa`
}

async function loadDepartments() {
  const res = await fetch('/api/departments')
  departments = await res.json()
  renderFloorGrid()
  renderDetail()
  renderDoctorGrid()
}

function renderFloorGrid() {
  floorGrid.innerHTML = ''
  departments.forEach((d, i) => {
    const btn = document.createElement('button')
    btn.className = 'room-tile' + (activeId === d.id ? ' room-tile-active' : '')
    btn.style.gridArea = `${i % 2 === 0 ? 1 : 2} / ${Math.floor(i / 2) + 1} / span 1 / span 1`
    btn.innerHTML = `
      <span class="room-number">${d.room}</span>
      <span class="room-name">${d.name}</span>
      <span class="room-queue">${d.queue} kishi navbatda</span>
    `
    btn.addEventListener('click', () => {
      activeId = d.id
      renderFloorGrid()
      renderDetail()
    })
    floorGrid.appendChild(btn)
  })
}

function renderDetail() {
  const d = departments.find((x) => x.id === activeId)
  if (!d) {
    detailCard.className = 'detail-card detail-empty'
    detailCard.innerHTML = `<p>Xaritadan bo'lim tanlang yoki yuqorida alomatingizni yozing.</p>`
    return
  }
  detailCard.className = 'detail-card fade-in'
  detailCard.innerHTML = `
    <div class="detail-head">
      <div>
        <p class="eyebrow">${d.room}-xona &middot; ${d.floor}-qavat</p>
        <h2>${d.name}</h2>
        <p class="doctor-name">${d.doctorName}</p>
      </div>
      <span class="pill pill-amber">★ ${d.rating}</span>
    </div>
    <div class="detail-stats">
      <div><p class="stat-label">Navbatda</p><p class="stat-value">${d.queue} kishi</p></div>
      <div><p class="stat-label">Taxminiy kutish</p><p class="stat-value">${waitLabel(d)}</p></div>
      <div><p class="stat-label">Sharhlar</p><p class="stat-value">${d.reviews}</p></div>
    </div>
    <button class="primary-btn" id="book-btn">Navbatga yozilish</button>
  `
  document.getElementById('book-btn').addEventListener('click', () => bookRoom(d.id))
}

async function bookRoom(id) {
  await fetch('/api/queue/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentId: id }),
  })
  await loadDepartments()
}

async function advanceRoom(id) {
  const res = await fetch(`/api/queue/${id}/advance`, { method: 'POST' })
  if (res.ok) await loadDepartments()
}

function renderDoctorGrid() {
  doctorGrid.innerHTML = ''
  departments.forEach((d) => {
    const card = document.createElement('div')
    card.className = 'doctor-card fade-in'
    card.innerHTML = `
      <div class="doctor-card-head">
        <div>
          <p class="eyebrow">${d.room}-xona</p>
          <h3>${d.name}</h3>
          <p class="doctor-name">${d.doctorName}</p>
        </div>
        <span class="pill ${d.queue > 5 ? 'pill-coral' : 'pill-teal'}">${d.queue} navbatda</span>
      </div>
      <p class="stat-label" style="margin-top:12px;">Keyingi bemor taxminan</p>
      <p class="stat-value">${d.perPatientMinutes} daqiqada chaqiriladi</p>
      <button class="ghost-btn" ${d.queue === 0 ? 'disabled' : ''}>Keyingi bemorni chaqirish</button>
    `
    card.querySelector('button').addEventListener('click', () => advanceRoom(d.id))
    doctorGrid.appendChild(card)
  })
}

symptomBtn.addEventListener('click', async () => {
  const text = document.getElementById('symptom-input').value
  if (!text.trim()) { suggestionText.style.display = 'none'; return }

  suggestionText.style.display = 'block'
  suggestionText.innerHTML = `<span class="spinner"></span>Tahlil qilinmoqda...`
  symptomBtn.disabled = true

  try {
    const res = await fetch('/api/departments/match-symptom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    const match = data.match || departments[0]
    activeId = match.id
    renderFloorGrid()
    renderDetail()

    const badge = data.source === 'ai'
      ? '<span class="ai-source-badge ai-source-ai">AI tahlili</span>'
      : '<span class="ai-source-badge ai-source-keywords">kalit so\'z</span>'

    suggestionText.innerHTML = `
      Tavsiya: <strong>${match.name}</strong> (${match.room}-xona) ${badge}
      <p class="ai-reason">${data.reason || ''}</p>
    `
  } finally {
    symptomBtn.disabled = false
  }
})

document.getElementById('btn-patient').addEventListener('click', () => {
  patientView.style.display = ''
  doctorView.style.display = 'none'
  document.getElementById('btn-patient').className = 'switch-active'
  document.getElementById('btn-doctor').className = ''
})

document.getElementById('btn-doctor').addEventListener('click', () => {
  patientView.style.display = 'none'
  doctorView.style.display = ''
  document.getElementById('btn-doctor').className = 'switch-active'
  document.getElementById('btn-patient').className = ''
  renderDoctorGrid()
})

loadDepartments()
setInterval(loadDepartments, 4000)
