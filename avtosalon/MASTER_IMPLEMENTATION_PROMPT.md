# Avtosalon Management System V3.4.1
## MASTER IMPLEMENTATION PROMPT

Ushbu hujjat - Avtosalon Management System V3.4.1 ni **production-quality** darajasida **to'liq** implement qilish uchun AI/dasturchi uchun **yakuniy master prompt**.

**Maqsad**: Real avtosalon biznesida ishlatilishi mumkin bo'lgan, xavfsiz, responsive va kengaytiriladigan to'liq ishlaydigan tizim.

---

## PART 1: BACKEND IMPLEMENTATION (FastAPI + PostgreSQL)

### 1.1 Database Models (SQLAlchemy)

Quyidagi 6 ta asosiy model MUST bo'lishi shart:

#### Users Model
```
- id (PK)
- first_name, last_name, phone (UNIQUE), email (UNIQUE)
- password_hash (bcrypt)
- role (director | worker | customer) - Enum
- is_active (Boolean)
- created_at, updated_at
```

#### Cars Model
```
- id (PK)
- brand, model, year, color, price, vin (UNIQUE), mileage
- description, image (URL)
- status (AVAILABLE | RESERVED | SOLD) - Enum
- created_at, updated_at
Constraint: vin UNIQUE, price > 0, year valid range
```

#### Applications Model
```
- id (PK)
- customer_id (FK → users)
- car_id (FK → cars)
- worker_id (FK → users)
- message (TEXT)
- status (NEW | CONTACTED | COMPLETED | CANCELLED) - Enum
- created_at, updated_at
Constraint: (customer_id, car_id) should allow customer to see their apps only
```

#### Sales Model
```
- id (PK)
- car_id (FK → cars)
- customer_id (FK → users)
- worker_id (FK → users)
- price (Decimal)
- payment_type (CASH | CARD | BANK) - Enum
- created_at
Business Rule: When sale created, car.status auto→ SOLD (transaction safe)
```

#### Payments Model
```
- id (PK)
- sale_id (FK → sales)
- amount (Decimal)
- payment_type (CASH | CARD | BANK) - Enum
- created_at
```

#### Favorites Model
```
- id (PK)
- customer_id (FK → users)
- car_id (FK → cars)
- created_at
Constraint: (customer_id, car_id) UNIQUE - no duplicates
```

### 1.2 Security & Authentication

**Requirements (QISM II):**

- JWT access tokens with expiration (60 minutes default)
- Bcrypt password hashing (passlib)
- Role-Based Access Control (RBAC)
- Backend role validation on EVERY endpoint
- NO trust in frontend user_id

**Implement:**

```python
# app/core/security.py
- hash_password(password: str) → str
- verify_password(plain_password: str, hash: str) → bool
- create_access_token(data: dict) → str (JWT)
- decode_access_token(token: str) → dict | None

# app/core/permissions.py
- check_role(user: User, required_roles: List[UserRole]) → bool
- require_roles(*roles) → Dependency for FastAPI
```

### 1.3 API Routes (FastAPI)

**All endpoints MUST:**
- Start with `/api` prefix
- Have correct HTTP methods (GET/POST/PUT/DELETE/PATCH)
- Return proper HTTP status codes (200/201/204/400/401/403/404/409/422/500)
- Validate input with Pydantic v2
- Check role authorization with `require_roles()` dependency

#### Auth Routes (`/api/auth/`)
```
POST /api/auth/register
  Input: first_name, last_name, phone, email, password, password_confirm
  Output: user_id, role, access_token
  Rule: Only CUSTOMER can register via public API
  Validation: Email unique, Phone unique, Password strength

POST /api/auth/login
  Input: email OR phone + password
  Output: access_token, user (id, name, role)
  
GET /api/auth/me
  Auth required
  Output: Current user details

POST /api/auth/change-password
  Auth required
  Input: old_password, new_password, new_password_confirm
```

#### Cars Routes (`/api/cars/`)
```
GET /api/cars
  Query filters: brand, model, min_price, max_price, min_year, max_year, status
  Query pagination: page, limit
  Returns: Paginated car list with images

GET /api/cars/{id}
  Returns: Full car details

POST /api/cars
  Auth + require_roles(DIRECTOR)
  Input: brand, model, year, color, price, vin, mileage, description, image
  Validation: All fields required, vin unique, price > 0, year valid
  Returns: Created car

PUT /api/cars/{id}
  Auth + require_roles(DIRECTOR)
  Update car details

DELETE /api/cars/{id}
  Auth + require_roles(DIRECTOR)
  Soft delete or hard delete (must require confirmation)
```

#### Customers Routes (`/api/customers/`) - Director only
```
GET /api/customers
  Auth + require_roles(DIRECTOR)
  Paginated list

GET /api/customers/{id}
  Auth + require_roles(DIRECTOR)
  Customer profile with applications, sales, payments history

PUT /api/customers/{id}
  Auth + require_roles(DIRECTOR)
  Update customer info
```

#### Workers Routes (`/api/workers/`) - Director only
```
GET /api/workers
  List all workers

GET /api/workers/{id}
  Worker details with stats

POST /api/workers
  Create new worker (email, phone, password auto-generated)
  Only DIRECTOR

PUT /api/workers/{id}
  Update worker (name, email, phone)

DELETE /api/workers/{id}
  Delete worker

PATCH /api/workers/{id}/status
  Activate/Deactivate worker
  Input: is_active (bool)
  Rule: Inactive worker cannot login
```

#### Applications Routes (`/api/applications/`)
```
GET /api/applications
  If DIRECTOR: see all
  If WORKER: see assigned to them
  If CUSTOMER: see their own only
  Filters: status, worker_id (director), customer_id (director)

GET /api/applications/{id}
  Get application details
  Auth required

POST /api/applications
  Auth + require_roles(CUSTOMER, WORKER)
  Input: car_id, message (if customer) OR customer_id (if worker)
  Validation: car exists

PUT /api/applications/{id}
  Auth + require_roles(DIRECTOR, WORKER)
  Update status (NEW → CONTACTED → COMPLETED/CANCELLED)
  If WORKER: only their assigned apps
```

#### Sales Routes (`/api/sales/`)
```
GET /api/sales
  If DIRECTOR: all sales
  If WORKER: only their own
  If CUSTOMER: forbidden
  Filters: date range, worker_id (director), payment_type

GET /api/sales/{id}
  Get sale details

POST /api/sales
  Auth + require_roles(DIRECTOR, WORKER)
  Input: car_id, customer_id, price, payment_type
  Validation:
    - car.status != SOLD (cannot resell)
    - customer exists
    - worker authorized
    - price > 0
  CRITICAL: Use database transaction!
    1. Create sale record
    2. Update car.status = SOLD
    3. Create payment record
    4. Commit or rollback both
  Returns: sale_id + payment_id
```

#### Payments Routes (`/api/payments/`)
```
GET /api/payments
  If DIRECTOR: all payments with statistics
  If WORKER: forbidden
  If CUSTOMER: forbidden
  
GET /api/payments/{id}
  Get payment details

POST /api/payments
  Created automatically when sale is created
  Should NOT be called directly by API
```

#### Favorites Routes (`/api/favorites/`)
```
GET /api/favorites
  Auth + require_roles(CUSTOMER)
  Return customer's favorited cars

POST /api/favorites/{car_id}
  Auth + require_roles(CUSTOMER)
  Add car to favorites
  Validation: car exists, (customer_id, car_id) no duplicate

DELETE /api/favorites/{car_id}
  Auth + require_roles(CUSTOMER)
  Remove from favorites
```

#### Dashboard Routes (`/api/dashboard/`)
```
GET /api/dashboard/stats
  If DIRECTOR:
    - Total cars / Available / Sold
    - Total customers / Workers / Applications
    - Total sales / Total revenue
  
  If WORKER:
    - My sales count
    - My applications count
    - My monthly revenue
  
  If CUSTOMER:
    - Available cars count
    - My favorites count
    - My applications count

GET /api/dashboard/revenue
  Director only
  Return: Monthly revenue data (last 12 months)

GET /api/dashboard/sales
  Director only
  Return: Monthly sales count data
```

### 1.4 Business Logic Services

Create service layer (NOT in routes):

```
backend/app/services/
├── auth_service.py
│   - register_customer(...)
│   - authenticate_user(email/phone, password)
│   - verify_jwt_token(token)
│
├── car_service.py
│   - get_cars_list(filters, pagination)
│   - get_car_by_id(id)
│   - create_car(...)
│   - update_car(id, ...)
│   - delete_car(id)
│   - can_resell_car(car_id) # Rule: SOLD cars cannot be resold
│
├── customer_service.py
│   - get_customers_list(pagination)
│   - get_customer_by_id(id)
│   - get_customer_history(customer_id) # apps, sales, payments
│
├── worker_service.py
│   - create_worker(...)
│   - get_workers_list()
│   - activate_worker(id)
│   - deactivate_worker(id)
│   - get_worker_stats(worker_id)
│
├── application_service.py
│   - create_application(...)
│   - get_applications(...) # with role-based filtering
│   - update_application_status(...)
│
├── sale_service.py (CRITICAL - Transaction-safe)
│   - create_sale_with_transaction(car_id, customer_id, worker_id, price, payment_type)
│     └─ BEGIN TRANSACTION
│     └─ Check car not SOLD
│     └─ Create sale
│     └─ Update car.status = SOLD
│     └─ Create payment
│     └─ COMMIT or ROLLBACK
│   - get_sales(...)
│   - get_sales_statistics(...)
│
├── payment_service.py
│   - get_payments(...)
│   - get_payment_statistics()
│
├── favorite_service.py
│   - add_favorite(customer_id, car_id)
│   - remove_favorite(customer_id, car_id)
│   - get_customer_favorites(customer_id)
│   - check_is_favorite(customer_id, car_id)
│
└── dashboard_service.py
    - get_director_dashboard_stats()
    - get_worker_dashboard_stats(worker_id)
    - get_customer_dashboard_stats(customer_id)
    - get_revenue_data()
    - get_sales_data()
```

### 1.5 Data Isolation Rules (QISM II - CRITICAL)

**MUST enforce at backend:**

- WORKER cannot see other workers' sales
- WORKER cannot see director endpoints
- WORKER cannot create/edit/delete cars or workers
- CUSTOMER cannot see other customers' data
- CUSTOMER cannot access director endpoints
- CUSTOMER cannot create sales
- CUSTOMER cannot create applications with RESERVED/SOLD cars
- INACTIVE worker cannot login

**Implementation:**
```python
# Every endpoint MUST have this pattern:
@router.get("/api/resource")
async def get_resource(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Check role
    if current_user.role != UserRole.director:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 2. Check is_active if worker
    if current_user.role == UserRole.worker and not current_user.is_active:
        raise HTTPException(status_code=401, detail="Worker inactive")
    
    # 3. Execute business logic
    return service.get_resource(...)
```

### 1.6 Error Handling

```python
# app/main.py - Global Exception Handler
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# app/main.py - Auth Exception Handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    if exc.status_code == 401:
        return JSONResponse(
            status_code=401,
            content={"detail": "Email or phone not found"}  # Don't reveal password hint
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

### 1.7 Database Migrations (Alembic)

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

### 1.8 Seed Data (Development only)

```python
# backend/app/utils/seed.py
def seed_database(db: Session):
    # 1 Director
    director = User(
        first_name="Direktor",
        last_name="Admin",
        email="director@example.com",
        phone="+998901234567",
        password_hash=hash_password("ChangeMe123!"),
        role=UserRole.director,
        is_active=True
    )
    db.add(director)
    
    # 3 Workers
    # 10 Customers
    # 20 Cars with mix of statuses
    # 5 Applications
    # 3 Sales
    # 1 Payment per sale
    # 5 Favorites
    
    db.commit()
```

---

## PART 2: FRONTEND IMPLEMENTATION (React + TypeScript + Vite)

### 2.1 Project Structure

```
frontend/src/
├── api/
│   ├── axios.ts - Axios instance with interceptors
│   ├── auth.ts - POST login, register, change-password
│   ├── cars.ts - GET/POST/PUT/DELETE cars
│   ├── customers.ts - GET customers
│   ├── workers.ts - GET/POST/PUT workers
│   ├── applications.ts - GET/POST/PUT applications
│   ├── sales.ts - GET/POST sales
│   ├── payments.ts - GET payments
│   ├── favorites.ts - GET/POST/DELETE favorites
│   └── dashboard.ts - GET dashboard stats
│
├── components/
│   ├── Sidebar.tsx - Navigation by role
│   ├── Topbar.tsx - Header with user menu, theme toggle
│   ├── CarCard.tsx - Car list item with image, brand, model, price, status, favorite btn
│   ├── CarFormModal.tsx - Create/Edit car (director only)
│   ├── AppCard.tsx - Application item with status badge
│   ├── SaleCard.tsx - Sale item with customer, car, amount
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx - Catch unexpected errors
│   ├── ProtectedRoute.tsx - Role-based route guard
│   └── Toast.tsx - Notification system
│
├── context/
│   ├── AuthContext.tsx - user, token, role, login/logout/setUser
│   └── ThemeContext.tsx - isDarkMode, setIsDarkMode
│
├── hooks/
│   ├── useAuth.ts - useContext(AuthContext)
│   ├── useTheme.ts - useContext(ThemeContext)
│   └── useApi.ts - TanStack Query wrapper
│
├── layouts/
│   └── MainLayout.tsx - Sidebar + Topbar + content area
│
├── pages/
│   ├── Login.tsx - Email/phone + password form
│   ├── Register.tsx - First name, last name, email, phone, password (Customer only)
│   ├── Dashboard.tsx - Role-specific dashboard
│   ├── Cars.tsx - Car listing with search, filter, pagination
│   ├── CarDetail.tsx - Full car info, actions by role
│   ├── Customers.tsx - Director: customer list
│   ├── Workers.tsx - Director: workers list with actions
│   ├── Applications.tsx - Applications list with status, role-based visibility
│   ├── Sales.tsx - Sales list (Director/Worker only)
│   ├── Payments.tsx - Payments statistics (Director only)
│   ├── Favorites.tsx - Customer's favorited cars
│   ├── Profile.tsx - User profile, edit, change password
│   ├── Settings.tsx - App settings
│   └── NotFound.tsx - 404 page
│
├── types/
│   ├── index.ts - All TypeScript types
│   ├── user.ts - User, UserRole, AuthResponse
│   ├── car.ts - Car, CarStatus
│   ├── application.ts - Application, ApplicationStatus
│   ├── sale.ts - Sale, PaymentType
│   ├── payment.ts - Payment
│   ├── dashboard.ts - DashboardStats
│
├── utils/
│   ├── format.ts - formatCurrency, formatDate
│   ├── validators.ts - Email, phone, password strength
│   ├── constants.ts - API_URL, HTTP_TIMEOUT, etc.
│
├── validations/
│   ├── auth.ts - Zod schemas for login, register
│   ├── car.ts - Zod schema for car form
│   ├── application.ts - Zod schema for application
│   ├── sale.ts - Zod schema for sale form
│
├── App.tsx - Routes setup, ProtectedRoute wrapper
├── main.tsx - React.StrictMode, ReactDOM.render
└── index.css - Global Tailwind styles
```

### 2.2 State Management

**Auth State (Context API):**
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
```

**Server State (TanStack Query):**
```typescript
// Queries
useQuery(['cars'], () => api.getCars()) // with auto-refetch
useQuery(['dashboard'], () => api.getDashboardStats())

// Mutations
useMutation(api.createSale) // with optimistic update
useMutation(api.addFavorite) // with optimistic update
useMutation(api.updateCar)
```

**Theme State (Context API):**
```typescript
interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}
```

### 2.3 Key Pages

#### Login Page
- Email OR Phone + Password
- Error messages for wrong credentials
- "Show password" toggle
- Remember me checkbox
- Link to Register (Customer only)
- Animated background
- Liquid Glass card

#### Register Page (Customer only)
- First Name, Last Name, Phone, Email, Password, Confirm Password
- Real-time password strength indicator
- Email/phone availability check on blur
- Submit button disabled until valid
- Validation messages

#### Director Dashboard
KPI Cards:
- Total Cars / Available / Sold
- Total Customers / Workers / Applications
- Total Sales / Total Revenue

Charts (recharts):
- Sales over time (last 12 months)
- Revenue over time
- Car status distribution (pie)
- Application status distribution (pie)
- Top car brands (bar)

Quick Actions:
- Add Car button
- View Workers
- View Customers

#### Worker Dashboard
- My Sales (count, today's, this month)
- My Applications
- My Monthly Revenue
- Available Cars (recent 5)
- Recent Sales (last 5)
- Recent Applications (last 5)

#### Customer Dashboard
- Available Cars count
- My Favorites count
- My Applications count
- Recommended Cars (random 5 by similar brand/year)
- Recently Added Cars (last 5)

#### Cars Listing
- Grid/List view toggle
- Search: brand, model, VIN
- Filters:
  - Price range (min-max slider)
  - Year range
  - Brand dropdown
  - Status (Available/Reserved/Sold)
  - Mileage range
- Sort: Price (asc/desc), Newest/Oldest
- Pagination: 10/25/50 per page
- Each Card:
  - Image (with fallback)
  - Brand + Model
  - Year, Color, Mileage
  - Price (formatted as currency)
  - Status badge (colored)
  - Favorite button (heart icon, toggleable)
  - "Details" button

#### Car Detail Page
- Large image gallery
- Full specs: brand, model, year, color, mileage, VIN, price, description
- Status badge
- Buttons by role:
  - Customer: "Add to Favorites" + "Send Application"
  - Worker: "Send Application" + "Create Sale"
  - Director: "Edit" + "Delete" + "Mark as Reserved/Sold"

#### Applications Page
- List of applications with:
  - Car (brand/model)
  - Customer name
  - Status badge (NEW/CONTACTED/COMPLETED/CANCELLED)
  - Worker (assigned to)
  - Date
- Filters by status
- By role:
  - Customer: See own applications
  - Worker: See assigned applications with update status button
  - Director: See all with assign/update options

#### Sales Page (Director/Worker only)
- List: Car, Customer, Worker, Price, Payment Type, Date
- Filters: Date range, Worker, Customer, Payment Type (Director)
- By role:
  - Worker: See own sales
  - Director: See all + statistics

#### Payments Page (Director only)
- Payment records: Sale, Amount, Type, Date
- Total paid (statistics)
- Filter by date, type
- Charts: Payment type distribution, Monthly payments

#### Favorites Page (Customer only)
- Grid of favorite cars
- Remove from favorites button
- "View Details" link
- "Send Application" button

#### Profile Page
- User info: Name, Email, Phone, Role, Account Status
- Edit button (modal with form)
- Change Password button (modal with form)
  - Old password
  - New password
  - Confirm password
  - Password strength indicator

### 2.4 UI/UX Requirements (QISM V)

#### Liquid Glass / Glassmorphism
```css
/* Used for: Sidebar, Topbar, Cards, Modals, Login Form */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark mode variant */
.glass-dark {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

#### Framer Motion Animations
```
- Page transitions: fade + slide (x: 50px)
- Sidebar: slideX from -100%
- Cards: hover → scaleY(1.05) + shadow boost
- Modals: scale from 0.95 + fade
- Toast: slideIn from bottom
- Favorite heart: pop animation on toggle
- Dashboard KPI: count-up animation on load
- Table rows: stagger animation on load
```

#### Dark/Light/System Theme
```typescript
// localStorage key: "avtosalon-theme"
// Values: "light" | "dark" | "system"
// Apply via Tailwind: <html class="dark">
// All colors must work in both modes
```

#### Responsive Breakpoints
```
Mobile: 320px - 480px (sidebar → drawer, tables → cards)
Tablet: 768px - 1024px (sidebar visible, content responsive)
Desktop: 1280px+ (full layout)

NO horizontal overflow
NO broken layouts
NO hidden buttons on any size
```

### 2.5 Form Validation (React Hook Form + Zod)

Example:
```typescript
// Login
const schema = z.object({
  email_or_phone: z.string().min(3),
  password: z.string().min(6),
});

// Register
const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  phone: z.string().regex(/^\+998\d{9}$/), // Uzbekistan format
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/), // strength
  password_confirm: z.string(),
}).refine(d => d.password === d.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});
```

---

## PART 3: DEVOPS & DEPLOYMENT (QISM VIII)

### 3.1 Docker Setup

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]

# frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: avtosalon
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+psycopg://postgres:postgres@postgres:5432/avtosalon
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: http://localhost:5173
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

### 3.2 Environment Variables

**backend/.env.example**
```
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/avtosalon
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ALGORITHM=HS256
```

**frontend/.env.example**
```
VITE_API_URL=http://localhost:8000
```

### 3.3 API Documentation

**Generate Swagger automatically:**
```
GET http://localhost:8000/docs → Swagger UI
GET http://localhost:8000/redoc → ReDoc
```

FastAPI auto-generates from routes + Pydantic schemas.

---

## PART 4: TESTING (QISM VII)

### 4.1 Backend Tests

```python
# backend/tests/test_auth.py
- test_register_customer_success
- test_register_duplicate_email
- test_login_success
- test_login_wrong_password
- test_inactive_worker_cannot_login
- test_jwt_expiration

# backend/tests/test_cars.py
- test_create_car_as_director
- test_create_car_as_worker_denied
- test_car_vin_unique_constraint
- test_get_cars_pagination
- test_car_filters

# backend/tests/test_sales.py
- test_create_sale_success
- test_cannot_resell_sold_car
- test_sale_updates_car_status_to_sold
- test_sale_creates_payment_record

# backend/tests/test_security.py
- test_customer_cannot_see_other_customer_data
- test_worker_cannot_see_other_worker_sales
- test_worker_cannot_access_director_endpoints
- test_inactive_worker_denied
```

### 4.2 Frontend Tests

Use Vitest + React Testing Library:
```typescript
- Test login form submission
- Test role-based routing (customer cannot access worker pages)
- Test favorite toggle
- Test sale creation flow
- Test responsive layout
```

---

## PART 5: FINAL CHECKLIST (Definition of Done)

**Backend:**
- [ ] All 6 models fully implemented with relationships
- [ ] All 8 API route groups implemented
- [ ] All business rules enforced in services
- [ ] Role-based access control on every endpoint
- [ ] Transaction-safe sale creation
- [ ] Error handling with global exception handler
- [ ] Swagger/ReDoc working at /docs and /redoc
- [ ] Database migrations with Alembic
- [ ] Seed data script
- [ ] Docker working locally

**Frontend:**
- [ ] All pages implemented (Login, Register, Dashboard, Cars, etc.)
- [ ] Role-based routing working
- [ ] API integration complete (all endpoints called)
- [ ] Forms with Zod validation
- [ ] TanStack Query for caching
- [ ] Dark/Light/System theme working
- [ ] Liquid Glass design applied
- [ ] Framer Motion animations
- [ ] Responsive on 320px-1920px+
- [ ] Error boundaries working
- [ ] Toast notifications working
- [ ] TypeScript with no `any` types

**DevOps:**
- [ ] Docker Compose file complete
- [ ] .env files secured (.env in .gitignore)
- [ ] All dependencies in package.json/requirements.txt
- [ ] README with full setup instructions
- [ ] Database setup documented

**Security:**
- [ ] No passwords in logs
- [ ] No sensitive data in frontend
- [ ] SQL Injection protection (ORM parametrized)
- [ ] CORS configured
- [ ] JWT expiration working
- [ ] Role-based tests passing
- [ ] Data isolation tests passing

**Code Quality:**
- [ ] No TODO comments
- [ ] No console.log in production code
- [ ] No mock-only features
- [ ] DRY principle followed
- [ ] SOLID principles respected
- [ ] No files > 500 lines (split into smaller components/services)

---

## USAGE INSTRUCTIONS

This prompt describes a **complete production-ready system**. 

1. **Backend Developer**: Use PART 1 + PART 4 + PART 5
2. **Frontend Developer**: Use PART 2 + PART 4 + PART 5
3. **Full-Stack**: Use PARTS 1-5 sequentially
4. **DevOps**: Use PART 3 + PART 5

Each section is **100% complete** and **implementable**. There are NO:
- Placeholders
- TODOs
- "Coming soon" features
- Mock-only functionality
- Unclear requirements

All endpoints, models, pages, and features MUST be implemented exactly as specified.

---

**Version**: V3.4.1  
**Last Updated**: 2026-09-12  
**Status**: Ready for Implementation
