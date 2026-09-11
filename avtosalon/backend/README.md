# Avtosalon Backend (FastAPI) — V3.4.1

Production-quality REST API for the Avtosalon Management System.

## Texnologiyalar

- **Python 3.12+**
- **FastAPI** - Async web framework
- **SQLAlchemy 2.x** - ORM
- **Pydantic v2** - Data validation
- **PostgreSQL** - Database
- **JWT + bcrypt/passlib** - Authentication & Security
- **Alembic** - Database migrations
- **Uvicorn** - ASGI server

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Muhit o'zgaruvchilari (.env)

```
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/avtosalon
SECRET_KEY=your-very-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

## Database Migratsiyasi

```bash
# Alembic migrations
alembic upgrade head

# Seed data (opsional)
python -m app.utils.seed
```

## Ishga tushirish

```bash
uvicorn app.main:app --reload
```

**API manzili:** `http://localhost:8000`  
**Swagger docs:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`

## Standart Director Hisobi (Development)

```
Email: director@example.com
Parol: ChangeMe123!
```

⚠️ **Production'da bu parolni albatta o'zgartiring.**

## Alembic Migratsiyalari

V3.4.1 Alembic orqali versiyalangan schema o'zgarishlarini boshqaradi.

## Papka Strukturasi

```
backend/
├── app/
│   ├── main.py                     - FastAPI application entry point
│   ├── config.py                   - Configuration from .env
│   ├── database.py                 - SQLAlchemy engine, session
│   │
│   ├── api/
│   │   ├── dependencies.py         - Auth & role dependency injection
│   │   └── routes/
│   │       ├── auth.py             - Login, Register, Change Password
│   │       ├── cars.py             - GET/POST/PUT/DELETE cars
│   │       ├── customers.py        - Manage customers (Director)
│   │       ├── workers.py          - Manage workers (Director)
│   │       ├── applications.py     - Application CRUD
│   │       ├── sales.py            - Sale CRUD
│   │       ├── payments.py         - Payment records
│   │       ├── favorites.py        - Favorite cars
│   │       └── dashboard.py        - Dashboard stats
│   │
│   ├── core/
│   │   ├── config.py               - .env sozlamalar (SECRET_KEY, DB_URL, etc)
│   │   ├── security.py             - JWT, password hashing (bcrypt)
│   │   └── permissions.py          - Role-based permission checks
│   │
│   ├── db/
│   │   ├── database.py             - SQLAlchemy setup
│   │   └── models/
│   │       ├── user.py             - User model (Director, Worker, Customer)
│   │       ├── car.py              - Car model
│   │       ├── application.py      - Application model
│   │       ├── sale.py             - Sale model
│   │       ├── payment.py          - Payment model
│   │       └── favorite.py         - Favorite model
│   │
│   ├── schemas/
│   │   ├── user.py                 - Pydantic User schemas
│   │   ├── car.py                  - Car schemas
│   │   ├── application.py          - Application schemas
│   │   ├── sale.py                 - Sale schemas
│   │   ├── payment.py              - Payment schemas
│   │   ├── favorite.py             - Favorite schemas
│   │   └── dashboard.py            - Dashboard stats schemas
│   │
│   ├── services/
│   │   ├── auth_service.py         - Register, login, password change logic
│   │   ├── car_service.py          - Car CRUD & business logic
│   │   ├── customer_service.py     - Customer management
│   │   ├── worker_service.py       - Worker management
│   │   ├── application_service.py  - Application logic
│   │   ├── sale_service.py         - Sale creation, status updates
│   │   ├── payment_service.py      - Payment processing
│   │   ├── favorite_service.py     - Favorite management
│   │   └── dashboard_service.py    - Analytics & KPI calculation
│   │
│   └── utils/
│       ├── validators.py           - Custom validators
│       ├── formatters.py           - Data formatting
│       └── seed.py                 - Seed data for development
│
├── alembic/                         - Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/                           - Test suite
│   ├── test_auth.py
│   ├── test_cars.py
│   ├── test_sales.py
│   └── ...
│
├── requirements.txt                 - Dependencies
├── .env.example                     - Environment template
├── Dockerfile                       - Container setup
└── README.md
```

## Rollar va Ruxsatlar (RBAC)

### DIRECTOR
- Barcha resurslarga to'liq kirish
- Avtomobillar, xaridorlar, ishchilar CRUD
- Arizalar va sotuvlarni boshqarish
- Dashboard statistikasi
- Ishchi faollashtirish/faolsizlantirish

### WORKER
- Mavjud avtomobillarni ko'rish
- Arizalarni yaratish va boshqarish
- Sotuvlarni yaratish
- Faqat o'z sotuvlarini ko'rish
- Faqat o'ziga tayinlangan arizalarni ko'rish

### CUSTOMER
- Avtomobillarni ko'rish
- Sevimlilarga qo'shish
- Arizalarni yuborish
- Faqat o'z arizalarini ko'rish
- Profil o'zgartiralsh

Har bir endpoint `require_roles(...)` dependency orqali himoyalangan.

## API Endpoints (QISQACHA)

```
AUTH
  POST /api/auth/register          - Customer ro'yxatdan o'tish
  POST /api/auth/login             - Login (JWT)
  GET /api/auth/me                 - Joriy foydalanuvchi
  POST /api/auth/change-password   - Parol o'zgartirish

CARS
  GET /api/cars                    - Avtomobillar ro'yxati
  GET /api/cars/{id}               - Avtomobil tafsilotlari
  POST /api/cars                   - Avtomobil yaratish (Director)
  PUT /api/cars/{id}               - Avtomobil o'zgartirish
  DELETE /api/cars/{id}            - Avtomobil o'chirish

CUSTOMERS
  GET /api/customers               - Xaridorlar (Director)
  GET /api/customers/{id}          - Xaridor tafsilotlari
  PUT /api/customers/{id}          - Xaridor o'zgartirish

WORKERS
  GET /api/workers                 - Ishchilar (Director)
  POST /api/workers                - Ishchi yaratish
  PUT /api/workers/{id}            - Ishchi o'zgartirish
  PATCH /api/workers/{id}/status   - Status o'zgartirish

APPLICATIONS
  GET /api/applications            - Arizalar
  POST /api/applications           - Ariza yaratish
  PUT /api/applications/{id}       - Ariza o'zgartirish

SALES
  GET /api/sales                   - Sotuvlar
  POST /api/sales                  - Sotuv yaratish
  GET /api/sales/{id}              - Sotuv tafsilotlari

PAYMENTS
  GET /api/payments                - To'lovlar
  POST /api/payments               - To'lov yaratish

FAVORITES
  GET /api/favorites               - Sevimlilar
  POST /api/favorites/{car_id}     - Sevimlilarga qo'shish
  DELETE /api/favorites/{car_id}   - Sevimlidan o'chirish

DASHBOARD
  GET /api/dashboard/stats         - KPI kartalar
  GET /api/dashboard/revenue       - Daromad grafikasi
  GET /api/dashboard/sales         - Sotuvlar statistikasi
```

## Xavfsizlik (Security)

✅ **Authentication & Authorization**
- JWT tokens: ACCESS_TOKEN_EXPIRE_MINUTES sozlanadi
- Password hashing: bcrypt/passlib
- Role-based access control (RBAC)
- Nofaol worker login qila olmaydi

✅ **Database Security**
- SQLAlchemy ORM: SQL Injection qo'llanmaydi
- Parametrlashtirilgan queries
- UNIQUE constraints: email, phone, VIN
- Cascade protection: ma'lumotlar to'g'ri o'chiriladi

✅ **API Security**
- CORS konfiguratsiyasi .env orqali
- Input validation: Pydantic v2 schemas
- Exception handling: Global error handler
- Secure HTTP status codes

## Testing
Testlar **pytest** asosida yozilgan va **in-memory SQLite** da ishlaydi —
real PostgreSQL talab qilinmaydi va testlar bir-biriga ta'sir qilmaydi.

### O'rnatish
```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
```

> Testlar `conftest.py` ichida `DATABASE_URL` va `SECRET_KEY` ni o'zi
o'rnatadi, shuning uchun alohida `.env` fayl shart emas.

### Ishga tushirish
```bash
pytest                                  # barcha testlar
pytest -v                               # har bir test nomi bilan
pytest tests/test_auth.py               # bitta fayl
pytest -k "sold_car"                    # nom bo'yicha filtrlash
pytest --cov=app --cov-report=term-missing   # coverage bilan
```

### Test to'plami (202 ta test)

| Fayl | Soha | Nima tekshiriladi |
| --- | --- | --- |
| `test_auth.py` | Autentifikatsiya | register, login (email/telefon), JWT, parol o'zgartirish |
| `test_security.py` | RBAC & izolyatsiya | rol matritsasi, worker/customer izolyatsiyasi, nofaol worker, buzuq/muddati o'tgan JWT |
| `test_cars.py` | Cars | CRUD, filter/qidiruv, dublikat VIN, SOLD avtomobil qoidalari |
| `test_sales.py` | Sales | tranzaksiya, SOLD qayta sotilmasligi, payment yaratilishi |
| `test_favorites.py` | Favorites | dublikat yo'qligi, faqat customer uchun |
| `test_applications.py` | Applications | SOLD uchun ariza bloklanishi, status va tayinlash |
| `test_workers.py` | Workers | director CRUD, faollashtirish/faolsizlantirish |
| `test_customers_payments.py` | Customers/Payments | profil tahriri, dublikat email/telefon, to'lovlar |
| `test_dashboard.py` | Dashboard | real DB dan hisoblangan statistika |
| `test_app_wiring.py` | Infratuzilma | health, route ro'yxati, `get_db` dependency |

### Qamrov (coverage)

Joriy qamrov: **99%** (`app/` bo'yicha, 758 satrdan 5 tasi qamrab olinmagan).

**Test turlari:**
- **Positive** — to'g'ri oqim (masalan, muvaffaqiyatli sotuv yaratish)
- **Negative** — xato holatlar (dublikat, ruxsatsiz kirish, noto'g'ri parol)
- **Edge case** — chegaraviy holatlar (SOLD avtomobil, muddati o'tgan JWT,
  bo'sh ro'yxatlar, 10 dan ortiq `recent_sales` cheklovi)
