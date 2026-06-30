# Shifoxona navbat tizimi — to'liq versiya

PostgreSQL ma'lumotlar bazasi va Claude AI orqali alomat tahlili bilan ishlaydigan to'liq tizim.

## Eng oson yo'l: onlaynga chiqarish (Render.com, bepul, sudo kerak emas)

Bu yo'l sening kompyuteringda hech narsa o'rnatishni talab qilmaydi — hammasi Render serverida ishlaydi, va senga doimiy internet manzili (masalan `hospital-navbat.onrender.com`) beradi.

### 1. GitHub'ga yuklash
Agar GitHub akkauntingiz bo'lmasa, https://github.com da bepul ro'yxatdan o'ting. Keyin yangi repository yarating va shu papkadagi barcha fayllarni shu yerga yuklang (GitHub saytida "uploading an existing file" tugmasi orqali, yoki `git` orqali — agar bilsangiz).

### 2. Render'da akkaunt ochish
https://render.com saytiga kiring, "Get Started" orqali GitHub akkauntingiz bilan ro'yxatdan o'ting.

### 3. Yangi loyiha yaratish
- Render boshqaruv panelida **New** → **Blueprint** ni tanlang.
- GitHub'dagi repository'ingizni tanlang. Render avtomatik ravishda shu papkadagi `render.yaml` faylini topib, kerakli serverni (Node.js) va bazani (PostgreSQL) o'zi yaratadi.
- "Apply" tugmasini bosing.

### 4. AI kalitini qo'shish (ixtiyoriy, lekin haqiqiy AI uchun kerak)
- https://console.anthropic.com saytida ro'yxatdan o'tib, API kalit oling.
- Render boshqaruv panelida loyihangizni oching → **Environment** bo'limi → `ANTHROPIC_API_KEY` qatoriga kalitni joylashtiring.
- Agar bu qadamni o'tkazib yuborsangiz, tizim baribir ishlayveradi — faqat AI o'rniga oddiy kalit so'z bo'yicha yo'naltirish ishlatiladi.

### 5. Tayyor!
Bir necha daqiqadan so'ng Render sizga `https://hospital-navbat-xxxx.onrender.com` kabi manzil beradi — shu manzilni istalgan odamga, istalgan qurilmadan ochish mumkin.

---

## Mahalliy (kompyuteringizda) ishga tushirish — agar Docker mavjud bo'lsa

```bash
docker compose up -d        # PostgreSQL'ni ishga tushiradi
cp .env.example .env        # sozlash faylini yaratadi
npm install
npm run migrate
npm run seed
npm start
```

`.env` faylida `ANTHROPIC_API_KEY` ni to'ldirsangiz, AI yo'naltiruvchi ham real ishlaydi.

Brauzerda: `http://localhost:4000`

## Loyihaning tuzilishi

```
hospital-full/
  server/
    server.js          — asosiy server
    db/                — sxema, migratsiya, boshlang'ich ma'lumot
    routes/
      departments.js    — bo'limlar + AI alomat tahlili
      queue.js           — navbat (yozilish, chaqirish, yakunlash)
  public/               — frontend (HTML, CSS, JS)
  render.yaml            — Render uchun avtomatik sozlash
```

## Keyingi yaxshilashlar
- WebSocket orqali real vaqtli yangilanish (hozircha har 4 soniyada so'rov yuboriladi)
- Bemorlar uchun ro'yxatdan o'tish va kirish tizimi
- SMS/push xabarnoma
