# Avtosalon Frontend (React + TypeScript)

## O'rnatish

```bash
cd frontend
npm install
cp .env.example .env
# .env ichida VITE_API_URL backend manzilini ko'rsating (default: http://localhost:8000)
```

## Ishga tushirish

```bash
npm run dev
```

Ilova manzili: `http://localhost:5173`

## Papka strukturasi

```
src/
├── components/   - Qayta ishlatiladigan UI qismlar (Sidebar, CarCard, modallar...)
├── pages/        - Har bir route uchun sahifa
├── layouts/       - MainLayout (Sidebar + Topbar + content)
├── services/      - Backend API bilan ishlash (axios)
├── context/       - AuthContext - foydalanuvchi holati
├── types/         - TypeScript interfacelari
└── App.tsx        - Barcha route'lar va role-based himoya
```

## Rollar

Login qilingandan keyin foydalanuvchi roliga (`director`, `worker`,
`customer`) qarab sidebar va sahifalar avtomatik moslashadi.
`ProtectedRoute` komponenti frontend darajasida himoya qiladi, lekin
haqiqiy xavfsizlik backend RBAC orqali ta'minlanadi.
