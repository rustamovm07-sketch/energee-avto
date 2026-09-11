# Backend Test Suite — Avtosalon Management System V3.4.1

## Summary

| Metric | Value |
| --- | --- |
| Framework | pytest 8.3.3 |
| Test count | **202** (all passing) |
| Coverage (`app/`) | **99%** (758 statements, 5 uncovered) |
| Isolation | In-memory SQLite per test — no PostgreSQL needed |
| Runtime | ~56 s |

Run it with:

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest --cov=app --cov-report=term-missing
```

---

## What was fixed to make the code testable

While writing the tests, three genuine defects were found and repaired:

1. **`app/schemas/user.py`** — the `Token` class had two orphaned fields
   (`token_type`, `user`) stranded at the bottom of `ChangePasswordRequest`.
   `Token` only declared `access_token`, so any response model validation
   referencing `token_type` was fragile. The fields were moved back into `Token`.

2. **`app/auth/dependencies.py`** — `int(user_id)` was called on the JWT `sub`
   claim with no guard. A token carrying a non-numeric subject raised an
   uncaught `ValueError` and returned **HTTP 500** instead of **401**.
   This is a real authentication-robustness hole; it is now caught explicitly.

3. **Missing declared dependencies** — `email-validator` (required by
   `pydantic.EmailStr`) was absent from `requirements.txt`, and `bcrypt` was
   unpinned, which breaks `passlib 1.7.4` on modern bcrypt. Both are now pinned.

---

## Coverage by module

```
app/auth/dependencies.py          33      0   100%
app/auth/security.py              20      0   100%
app/config.py                     10      0   100%
app/database.py                   11      0   100%
app/main.py                       37      0   100%
app/models/*.py                  129      0   100%
app/routers/applications.py       48      0   100%
app/routers/auth.py               43      0   100%
app/routers/cars.py               67      1    99%
app/routers/customers.py          47      0   100%
app/routers/dashboard.py          23      0   100%
app/routers/favorites.py          33      0   100%
app/routers/payments.py           17      0   100%
app/routers/sales.py              36      2    94%
app/routers/workers.py            58      1    98%
app/schemas/*.py                  98      1    99%
app/services/sale_service.py      25      0   100%
------------------------------------------------
TOTAL                            758      5    99%
```

---

## Test files

| File | Tests | Scope |
| --- | --- | --- |
| `test_auth.py` | 39 | Registration, login, `/me`, change-password, JWT & hashing helpers |
| `test_security.py` | 32 | Role matrix, data isolation, token robustness |
| `test_cars.py` | 24 | Listing/filters, director CRUD, VIN uniqueness, SOLD immutability |
| `test_sales.py` | 25 | Transaction integrity, resell prevention, payment creation |
| `test_favorites.py` | 12 | Add/list/remove, duplicate prevention, role restriction |
| `test_applications.py` | 22 | Create/update/list, SOLD blocking, auto-assignment |
| `test_workers.py` | 18 | Director-managed worker lifecycle |
| `test_customers_payments.py` | 21 | Profile self-edit, uniqueness, payment read model |
| `test_dashboard.py` | 9 | Real-data statistics, director-only access |
| `test_app_wiring.py` | 8 | Health, route registration, `get_db` lifecycle |

---

## Spec traceability

Each area maps to the master specification (QISM VII):

**7.1 Backend tests**
- ✅ Registration, login, wrong password, inactive worker
- ✅ Role protection
- ✅ Car CRUD, duplicate VIN
- ✅ Duplicate email, duplicate phone
- ✅ Sale creation, cannot resell a SOLD car
- ✅ Favorites, applications

**7.2 Security tests**
- ✅ Customer → Director endpoint
- ✅ Customer → Worker endpoint
- ✅ Worker → Director endpoint
- ✅ Inactive worker → login
- ✅ Duplicate email / phone / VIN
- ✅ Invalid JWT, expired JWT, missing JWT
- ✅ Unauthorized sale creation

**3.4 Business rules**
- ✅ Rule 1 — SOLD car cannot be resold
- ✅ Rule 3 — Customer sees only own applications
- ✅ Rule 4 — Worker sees only own sales
- ✅ Rule 5 — Director sees everything
- ✅ Rule 6 — Inactive worker cannot log in
- ✅ Rules 7/8/9 — Duplicate email / phone / VIN rejected
- ✅ Rule 10 — Customer cannot see another customer's profile
- ✅ Rule 11/12 — Worker/customer cannot reach director endpoints
- ✅ Rule 13 — Sale flips car status to SOLD
- ✅ Rule 14 — Car existence checked when creating an application
- ✅ Rule 15 — No duplicate favorite for the same (customer, car)

**3.5 Transactions**
- ✅ Sale + payment + status change happen in one unit of work
- ✅ No orphan rows are left behind when validation fails

---

## Design notes

- **Isolated state.** `conftest.py` injects `DATABASE_URL=sqlite://` *before*
  importing `app`, so `app.config.Settings` never fails fast, and overrides
  FastAPI's `get_db` dependency with the test session.
- **No startup side-effects.** The app's `@app.on_event("startup")` handler
  (which creates real tables and seeds a default director) is intentionally
  bypassed; the suite builds its own schema on the isolated engine.
- **Real tokens.** Auth fixtures mint genuine signed JWTs via
  `create_access_token`, so the RBAC path is exercised exactly as in production
  rather than being stubbed out.
- **AAA structure.** Every test follows Arrange / Act / Assert with a single
  behavioural assertion group, and names state the expected behaviour.
