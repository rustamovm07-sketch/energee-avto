# Avtosalon Management System — V3.4.1 (Master Specification)

Real avtosalon biznesida ishlatilishi mumkin bo'lgan, to'liq ishlaydigan, xavfsiz, responsive va kengaytiriladigan avtosalon boshqaruv platformasini yaratish. Bu — demo yoki o'quv loyihasi emas, balki production-quality SaaS mahsulot standartlarida ishlab chiqilgan tizim.

## Texnologiyalar

**Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.x, Pydantic v2, JWT, bcrypt/passlib, PostgreSQL, Uvicorn
**Frontend:** React + TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query, React Hook Form, Zod, Framer Motion, Lucide React

## Xususiyatlar (Features)

✅ **Autentifikatsiya va Avtorizatsiya**
- JWT-asoslangan xavfsiz autentifikatsiya
- Rolga asoslangan kirish nazorati (RBAC): Director, Worker, Customer
- Password xeshlash: bcrypt/passlib

✅ **Direktor Paneli**
- Keng ko'lamli dashboard KPI kartalar va grafiklar bilan
- To'liq CRUD: avtomobillar, xaridorlar, ishchilar
- Arizalar va sotuvlar boshqaruvi
- Hisobotlar va statistika
- Ishchi faollashtirish/faolsizlantirish

✅ **Ishchi Paneli**
- O'z sotuvlari va arizalari
- Xaridorlar ro'yxati
- Availabel avtomobillar
- Oylik daromad statistikasi

✅ **Xaridor Paneli**
- Mavjud avtomobillar katalogi
- Sevimlilarga qo'shish
- Ariza yuborish
- Ariza holati kuzatish
- Tavsiya etilgan avtomobillar

✅ **Avtomobillar Moduli**
- Qidiruv, filter, saralash
- Brend, model, VIN, status, narx bo'yicha
- Galereya va tafsilot sahifasi
- Status: AVAILABLE, RESERVED, SOLD

✅ **Ariza va Sotuv Boshqaruvi**
- Ariza olish va holatni boshqarish
- Sotuv yaratish va avtomatik status yangilash
- To'lov usuli seçimi: Naqd, Karta, Bank o'tkazmasi
- Transaksiya xavfsizligi

✅ **Dizayn va UX**
- Premium Liquid Glass / Glassmorphism
- Dark/Light/System rejimi
- Framer Motion animatsiyalari
- Responsive: mobile (320px), tablet, desktop (1920px)
- Accessibility va keyboard boshqaruv

✅ **Database**
- PostgreSQL production-grade
- SQLAlchemy ORM, Alembic migratsiyalari
- UNIQUE constraints: email, phone, VIN
- Concurrent transaction handling

✅ **API**
- RESTful /api prefiksi bilan
- Swagger (/docs) va ReDoc (/redoc)
- Validatsiya xatolari aniq formatda
- HTTP status kodlar: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500

✅ **Performance va Testing**
- React lazy loading, code splitting
- TanStack Query keshlash va invalidation
- API keshlash va debounce qilingan qidiruv
- Security testlar: role protection, SQL injection qo'llanmasligi
## Papka Strukturasi

```
avtosalon/
├── frontend/                 - React + TypeScript ilovasi
│   └── src/
│       ├── api/             - HTTP chaqiruvlari (auth.ts, cars.ts, sales.ts, ...)
│       ├── components/      - Qayta ishlatiluvchi UI komponentlar
│       ├── features/        - Domenga oid modullar
│       ├── hooks/           - Custom React hooklar
│       ├── layouts/         - Rol-asoslangan layoutlar
│       ├── pages/           - Route darajasidagi sahifalar
│       ├── routes/          - Route konfiguratsiyasi va guardlar
│       ├── store/           - Auth/global state
│       ├── types/           - TypeScript interfeyslar
│       ├── utils/           - Formatlash va helper funksiyalar
│       ├── validations/     - Zod sxemalari
│       └── App.tsx, main.tsx, index.css
│
├── backend/                  - FastAPI REST API
│   └── app/
│       ├── api/routes/      - FastAPI routerlar
│       ├── api/dependencies.py - Auth/role dependency injection
│       ├── core/config.py   - .env asosidagi sozlamalar
│       ├── core/security.py - JWT, password hashing
│       ├── core/permissions.py - Rolga asoslangan ruxsatlar
│       ├── db/database.py   - SQLAlchemy engine/session
│       ├── db/models/       - ORM modellari
│       ├── schemas/         - Pydantic schemalari
│       ├── services/        - Biznes logika qatlami
│       ├── utils/           - Yordamchi funksiyalar
│       └── main.py          - FastAPI asosiy kirish nuqtasi
│       └── alembic/, tests/, requirements.txt, .env.example
│
├── docker-compose.yml        - Frontend, Backend, PostgreSQL konteynerizatsiyasi
├── .gitignore
└── README.md
```

## Tezkor Ishga Tushirish

### 1. PostgreSQL va Muhit o'zgaruvchilari

```bash
# .env.example asosida .env faylini yarating
cp backend/.env.example backend/.env
```

```.env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/avtosalon
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

### 2. Backend O'rnatish

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Migratsiya
alembic upgrade head

# Ishga tushirish
uvicorn app.main:app --reload
```

**API:** `http://localhost:8000`  
**Swagger Docs:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`

### 3. Frontend O'rnatish

```bash
cd frontend
npm install
npm run dev
```

**Frontend:** `http://localhost:5173`

### 4. Standart Direktor Hisobi (Development uchun)

```
Email:  director@example.com
Parol:  ChangeMe123!
```

⚠️ **Production muhitida bu parolni birinchi login qilgandan keyin albatta o'zgartiring.**

## Foydalanuvchi Rollari va Ruxsatlar

| Modul | DIRECTOR | WORKER | CUSTOMER |
|---|---|---|---|
| Dashboard | To'liq analitika | Faqat o'ziniki | Marketplace ko'rinishi |
| Avtomobillar | To'liq CRUD | Ko'rish + ariza/sotuv | Ko'rish, sevimlilar, ariza |
| Xaridorlar | To'liq boshqarish | Ko'rish (bog'liq) | — |
| Ishchilar | Yaratish/tahrirlash/o'chirish | — | — |
| Arizalar | Barchasini ko'rish | O'ziga tayinlangan | Yaratish, kuzatish |
| Sotuvlar | Barchasini ko'rish | Faqat o'z sotuvlari | — |
| To'lovlar | To'liq statistika | — | — |
| Sozlamalar | To'liq kirish | Yo'q | Yo'q |
| Profil | Bor | Bor | Bor |

## Izolyatsiya Qoidalari (Qat'iy)

- **WORKER** boshqa workerlarning sotuvlarini ko'ra olmaydi
- **WORKER** direktor paneliga kira olmaydi
- **CUSTOMER** boshqa customerning ma'lumotlarini ko'ra olmaydi
- **CUSTOMER** direktor yoki worker paneliga kira olmaydi
- Nofaol (is_active=false) worker tizimga kira olmaydi

## Asosiy Biznes Qoidalari (V3.4.1)

1. **SOLD statusidagi avtomobil qayta sotilmaydi**
2. **RESERVED avtomobil uchun sotuv yaratishda validatsiya qo'llaniladi**
3. **Customer faqat o'z arizalarini ko'radi**
4. **Worker faqat o'z sotuvlarini ko'radi**
5. **Director barcha ma'lumotlarni ko'radi**
6. **Nofaol worker tizimga kira olmaydi**
7. **Email/telefon/VIN dublikat bo'lmaydi**
8. **Sotuv yaratilganda car.status avtomatik SOLD ga o'zgaradi**
9. **Ariza yaratishda avtomobilning mavjudligi tekshiriladi**
10. **Bir xil customer+car uchun sevimli dublikat bo'lmaydi**
11. **Sotuv va status o'zgarishi bitta tranzaksiyada bajariladi**

## Xavfsizlik Talablari

✅ **Autentifikatsiya va Avtorizatsiya**
- Parollar bcrypt/passlib orqali xeshlangan
- JWT access token muddati cheklangan
- Nofaol worker login qila olmaydi
- Backend avtorizatsiyasi frontenddan mustaqil
- SQL Injection dan himoya: SQLAlchemy parametrlashtirilgan so'rovlari
- CORS konfiguratsiyasi .env orqali boshqariladi

✅ **Maxfiy Ma'lumotlar**
- SECRET_KEY, DATABASE_URL .env ichida, Git'ga tushmaydi
- Har bir kirish server tomonida validatsiya qilinadi
- To'g'ri HTTP status kodlari (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)
- Global exception handler kutilmagan xatolarni boshqaradi
- Autentifikatsiya xatolari xavfsiz shaklda qaytariladi

## Docker va DevOps

```bash
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
  backend:
    build: ./backend
    ports:
      - "8000:8000"
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: avtosalon
```

```bash
# Ishga tushirish
docker-compose up -d
```

## API Hujjatlari

**Swagger (Interactive):** `http://localhost:8000/docs`  
**ReDoc (ReadOnly):** `http://localhost:8000/redoc`  

**Endpointlar:**
- `POST /api/auth/register` - Customer ro'yxatdan o'tish
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Joriy foydalanuvchi
- `GET /api/cars` - Avtomobillar ro'yxati
- `POST /api/cars` - Avtomobil yaratish (Director)
- `GET /api/customers` - Xaridorlar (Director)
- `GET /api/workers` - Ishchilar (Director)
- `POST /api/applications` - Ariza yuborish
- `POST /api/sales` - Sotuv yaratish
- `GET /api/dashboard/stats` - Dashboard statistikasi
- Batafsil API: `/docs`

## Kelajakdagi Rivojlanish Yo'nalishi (Roadmap)

Arxitektura quyidagilarni keyinroq qo'shishga tayyor:

- 💳 Kredit / bo'lib to'lash tizimi
- 🌳 Filiallar (multi-branch)
- 📱 SMS va Telegram bot integratsiyasi
- 💰 Onlayn to'lov gateway'lari (Stripe, Click, Payme)
- 📦 Ombor (warehouse) boshqaruvi
- 📊 Kengaytirilgan buxgalteriya
- 🤖 CRM va Lead management
- 🔔 Push-notification tizimi
- ☁️ Cloud rasm saqlash (Cloudinary/S3)
- 📈 Advanced analytics va reporting

Bularni qo'shish uchun asosan yangi model + router + service qo'shish kifoya — mavjud kodni qayta yozish shart emas.
