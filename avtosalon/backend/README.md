# Avtosalon Backend (FastAPI)

REST API for the Avtosalon Management System V1.

## O'rnatish

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .env faylini o'zingizning PostgreSQL ma'lumotlaringiz bilan tahrirlang
```

## Ishga tushirish

```bash
uvicorn app.main:app --reload
```

API manzili: `http://localhost:8000`
Interaktiv Swagger docs: `http://localhost:8000/docs`

Server birinchi marta ishga tushganda kerakli jadvallarni avtomatik
yaratadi va agar hech qanday director bo'lmasa, standart director
akkauntini yaratadi:

```
Email: director@avtosalon.uz
Parol: Director123!
```

**Production'da bu parolni birinchi login qilgandan keyin albatta
o'zgartiring.**

## Migratsiyalar haqida

V1 sodda bo'lishi uchun jadvallar `Base.metadata.create_all()` orqali
avtomatik yaratiladi. Loyiha kattalashganda (masalan kredit, filiallar
kabi funksiyalar qo'shilganda) Alembic migratsiyalariga o'tish tavsiya
etiladi - `alembic` allaqachon `requirements.txt`da mavjud.

## Papka strukturasi

```
app/
├── main.py          - FastAPI ilova va router'larni ulash
├── config.py        - .env orqali sozlamalar
├── database.py      - SQLAlchemy engine/session
├── models/          - SQLAlchemy jadval modellari
├── schemas/         - Pydantic request/response sxemalari
├── routers/         - Har bir resurs uchun API endpointlar
├── services/         - Bir nechta jadvalga tegishli business logika
└── auth/            - JWT va parol xeshlash, RBAC dependencylari
```

## Rollar va ruxsatlar

- **director** - hammasini ko'radi va boshqaradi
- **worker** - avtomobil/xaridor/ariza ko'radi, o'z sotuvlarini yaratadi
- **customer** - avtomobil ko'radi, ariza yuboradi, sevimlilarga qo'shadi

Har bir endpoint `require_roles(...)` dependency orqali himoyalangan.
