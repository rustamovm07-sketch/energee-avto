# Avtosalon Management System — V1

Avtomobil salon (dealership) uchun to'liq ishlaydigan full-stack boshqaruv
tizimi. Direktor, ishchi va xaridor uchun alohida rol asosidagi
interfeyslar bilan.

## Texnologiyalar

**Backend:** Python, FastAPI, SQLAlchemy, Pydantic, JWT, bcrypt, PostgreSQL
**Frontend:** React, TypeScript, Tailwind CSS, React Router, Axios

## Loyiha strukturasi

```
avtosalon/
├── backend/     - FastAPI REST API (README: backend/README.md)
└── frontend/    - React + TypeScript ilova (README: frontend/README.md)
```

## Tezkor boshlash

### 1. PostgreSQL tayyorlash

```sql
CREATE DATABASE avtosalon_db;
CREATE USER avtosalon_user WITH PASSWORD 'avtosalon_pass';
GRANT ALL PRIVILEGES ON DATABASE avtosalon_db TO avtosalon_user;
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # DATABASE_URL, SECRET_KEY'ni sozlang
uvicorn app.main:app --reload
```

Birinchi ishga tushganda kerakli jadvallar avtomatik yaratiladi va
standart direktor hisobi ochiladi:

```
Email:  director@avtosalon.uz
Parol:  Director123!
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL backend manzilini ko'rsatadi
npm run dev
```

Brauzerda oching: `http://localhost:5173`

## Foydalanuvchi rollari

| Rol | Imkoniyatlar |
|---|---|
| **Director** | Hammasini ko'radi va boshqaradi: avtomobillar, ishchilar, xaridorlar, sotuvlar, to'lovlar, dashboard statistikasi |
| **Worker** | Avtomobil/xaridor ko'radi, arizalarni qabul qiladi, sotuv yaratadi, faqat o'z sotuvlarini ko'radi |
| **Customer** | Ro'yxatdan o'tadi, avtomobillarni ko'radi, sevimlilarga qo'shadi, ariza yuboradi, faqat o'z arizalarini ko'radi |

## Asosiy biznes-qoidalar (V1)

1. Sotilgan (`sold`) avtomobil qayta sotilmaydi.
2. Xaridor faqat o'z arizalarini ko'radi.
3. Ishchi faqat o'ziga tegishli sotuvlarni ko'radi.
4. Bloklangan (`is_active=false`) ishchi tizimga kira olmaydi.
5. Bir xil email/telefon bilan ikkinchi hisob ochilmaydi.
6. Har bir sotuv avtomatik ravishda to'lov yozuvini yaratadi va
   avtomobil statusini `sold`ga o'zgartiradi.

## Kelajakda qo'shilishi mumkin bo'lgan funksiyalar

Arxitektura quyidagilarni keyinroq qo'shishga tayyor:

- Kredit / bo'lib to'lash tizimi
- SMS va Telegram bot integratsiyasi
- Bir nechta filial (multi-branch)
- Murakkab hisobot va analytics
- Onlayn to'lov gateway'lari

Bularni qo'shish uchun asosan yangi model + router + service qo'shish
kifoya — mavjud kodni qayta yozish shart emas.
