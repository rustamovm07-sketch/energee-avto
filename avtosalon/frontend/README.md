# Avtosalon Frontend (React + TypeScript + Vite) — V3.4.1

Modern, responsive va o'zgartiriluvchi avtosalon dashboard ilovasi.

## Texnologiyalar

- **React 18** + **TypeScript** - Statically typed UI
- **Vite** - Lightning fast bundler
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling & validation
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library

## O'rnatish

```bash
cd frontend
npm install
cp .env.example .env
```

## Muhit o'zgaruvchilari (.env)

```
VITE_API_URL=http://localhost:8000
```

## Ishga Tushirish

```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

**Frontend:** `http://localhost:5173`  
**API:** `http://localhost:8000`

## Papka Strukturasi

```
src/
├── api/                    - HTTP API calls (organized by resource)
│   ├── auth.ts            - Login, Register, Profile
│   ├── cars.ts            - Car CRUD & listing
│   ├── customers.ts       - Customer management
│   ├── workers.ts         - Worker management
│   ├── applications.ts    - Application CRUD
│   ├── sales.ts           - Sales management
│   ├── payments.ts        - Payment records
│   ├── favorites.ts       - Favorite cars
│   └── dashboard.ts       - Dashboard stats
│
├── assets/                 - Static resources (images, icons)
│
├── components/            - Reusable UI components
│   ├── CarCard.tsx         - Car list item card
│   ├── CarFormModal.tsx    - Car create/edit modal
│   ├── Sidebar.tsx         - Role-based navigation
│   ├── Topbar.tsx          - Header with user menu
│   ├── ProtectedRoute.tsx  - Route guard component
│   ├── GlassComponents.tsx - Liquid Glass UI elements
│   ├── Feedback.tsx        - Toast notifications
│   └── ...
│
├── context/               - Global state management
│   ├── AuthContext.tsx    - User, token, role state
│   └── ThemeContext.tsx   - Dark/Light/System theme
│
├── features/              - Domain-specific modules
│   ├── cars/              - Cars feature components & logic
│   ├── dashboard/         - Dashboard KPI, charts
│   ├── sales/             - Sales management
│   ├── applications/      - Application handling
│   └── ...
│
├── hooks/                 - Custom React hooks
│   ├── useAuth.ts         - Auth hook
│   ├── useForm.ts         - Form utilities
│   └── ...
│
├── layouts/               - Page layouts
│   └── MainLayout.tsx     - Sidebar + Topbar + content
│
├── pages/                 - Route-level components
│   ├── Login.tsx          - Login page
│   ├── Register.tsx       - Registration (Customer only)
│   ├── Dashboard.tsx      - Role-specific dashboard
│   ├── Cars.tsx           - Car listing & search
│   ├── CarDetail.tsx      - Single car details
│   ├── Favorites.tsx      - Favorited cars
│   ├── Applications.tsx   - Applications list
│   ├── Sales.tsx          - Sales management (Director/Worker)
│   ├── Payments.tsx       - Payment records (Director)
│   ├── Workers.tsx        - Workers management (Director)
│   ├── Customers.tsx      - Customers list (Director)
│   ├── Profile.tsx        - User profile & settings
│   ├── Settings.tsx       - App settings
│   └── NotFound.tsx       - 404 page
│
├── routes/                - Routing configuration
│   ├── AppRoutes.tsx      - Main route definitions
│   └── ProtectedRoute.tsx - Role-based route guard
│
├── store/                 - Client-side state
│   └── useStore.ts        - Zustand/Context store
│
├── types/                 - TypeScript interfaces
│   ├── index.ts           - All type definitions
│   ├── user.ts            - User, Auth types
│   ├── car.ts             - Car, CarStatus types
│   ├── application.ts     - Application types
│   ├── sale.ts            - Sale types
│   ├── payment.ts         - Payment types
│   └── dashboard.ts       - Dashboard stats types
│
├── utils/                 - Utility functions
│   ├── format.ts          - Currency, date formatting
│   ├── validators.ts      - Form validators
│   ├── helpers.ts         - General helpers
│   └── constants.ts       - App constants
│
├── validations/           - Zod schemas
│   ├── auth.ts            - Login/Register schemas
│   ├── car.ts             - Car form schemas
│   ├── application.ts     - Application schemas
│   └── ...
│
├── index.css              - Global styles
├── App.tsx                - App root + routes
└── main.tsx               - Entry point
```

## Dizayn Tili (Design System)

### Liquid Glass / Glassmorphism
- Sidebar, Topbar, modals, kartalara qo'llaniladi
- backdrop-filter, blur, transparent backgrounds
- Nozik chegaralar va yumshoq soyalar

### Animatsiyalar (Framer Motion)
- Sahifa o'tishi: fade + slide
- Kartalar: hover scale & shadow
- Modal: scale + fade
- Sevimlilarga qo'shish: heart pop animation
- Dashboard KPI: count-up animation

### Tema Rezhimlari
- ☀️ Light mode
- 🌙 Dark mode
- 🖥️ System (OS preference)
- localStorage'da saqlanadi

### Responsive Breakpoints
- Mobile: 320px - 480px
- Tablet: 768px - 1024px
- Desktop: 1280px+
- Sidebar drawer mobileda

## Rollga Asoslangan Naviga

### DIRECTOR
- `/dashboard` - Full analytics
- `/director/cars` - Car management
- `/director/customers` - Customer list
- `/director/workers` - Worker management
- `/director/applications` - All applications
- `/director/sales` - Sales records
- `/director/payments` - Payment records
- `/director/reports` - Reports & analytics

### WORKER
- `/dashboard` - Personal stats
- `/cars` - Available cars
- `/worker/applications` - Assigned applications
- `/worker/sales` - Personal sales
- `/customers` - Customer list

### CUSTOMER
- `/dashboard` - Marketplace view
- `/cars` - Car catalog
- `/favorites` - Favorited cars
- `/applications` - My applications
- `/profile` - Profile & settings

## API Integration

Barcha HTTP requests `axios` instance orqali unified tarzda:

```typescript
// Request interceptor: JWT token avtomatik biriktiradi
// Response interceptor: 401'da logout, errors toast ko'rsatadi
```

API calls `src/api/*.ts` faillarida organize qilingan, componentlar ichiga sochilmagan.

## State Management

- **Auth State**: AuthContext (user, token, role)
- **Server State**: TanStack Query (cache, invalidation)
- **UI State**: Local component state + Zod validation

## Form Handling

React Hook Form + Zod:
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm<FormValues>({ resolver: zodResolver(schema) });
```

## Accessibility (a11y)

✅ Keyboard navigation (Tab, Enter, ESC)  
✅ Focus states (vizyualni aniq)  
✅ Semantic HTML  
✅ aria-label attributes  
✅ Modal ESC bilan yopiladi  
✅ Color contrast (WCAG)  
✅ Form error messages aniq
