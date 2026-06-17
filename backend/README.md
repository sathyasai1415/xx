# MiSlice Backend — Spring Boot

Production-grade backend for the MiSlice pizza marketplace. Java 21 · Spring Boot 3.3 · PostgreSQL · Flyway · JWT.

> **Status: Phase 1 (Foundation) delivered.** Build config, security/JWT, global error
> handling, OpenAPI, the **complete PostgreSQL schema** (Flyway), seed data, Docker, and the
> **Auth/User vertical slice** are implemented end-to-end as the reference pattern. The
> remaining domains (restaurants, menu, cart, orders, payments, delivery, reviews,
> notifications, admin) have their **tables + design** ready and are implemented in later
> phases following the same slice pattern. See [Roadmap](#roadmap).

---

## Architecture

```
React (Vite, current: Firebase)  ──HTTP/JSON──▶  Spring Boot REST API  ──JPA──▶  PostgreSQL
                                                       │
                                                       ├─ Spring Security + JWT (stateless)
                                                       ├─ Flyway migrations
                                                       ├─ Redis (cache / rate-limit)
                                                       └─ Stripe / PayPal / Mail / FCM (adapters)
```

Layered, domain-oriented package structure:

```
com.mislice
├─ MisliceApplication
├─ config/            SecurityConfig, OpenApiConfig, JpaAuditingConfig, CorsProperties
├─ security/          JwtService, JwtAuthenticationFilter, CustomUserDetails(Service), SecurityUtils
├─ common/
│  ├─ entity/         BaseEntity (audit cols + soft delete + optimistic version)
│  ├─ api/            ErrorResponse
│  └─ exception/      ApiException, ResourceNotFound, BusinessRule, GlobalExceptionHandler
└─ domain/
   ├─ auth/           AuthController, AuthService, RefreshToken, dto/
   ├─ user/           User, Address, Role, AccountStatus, repos, UserMapper, dto/
   ├─ restaurant/     (Phase 2)
   ├─ menu/           (Phase 2)
   ├─ cart/           (Phase 3)
   ├─ order/          (Phase 3)
   ├─ payment/        (Phase 4)
   ├─ delivery/       (Phase 5)
   ├─ review/         (Phase 5)
   ├─ notification/   (Phase 6)
   └─ admin/          (Phase 6)
```

Each domain follows the same slice: **Entity → Repository → Service → Controller → DTO → Mapper (MapStruct) → Validation → Tests**.

---

## Data model (ER overview)

```
users ──< user_roles
users ──< addresses
users ──< refresh_tokens
users ──< email_verification_tokens
users 1──1 drivers

restaurants >── users (owner)
restaurants ──< restaurant_hours
restaurants ──< delivery_zones
restaurants ──< categories ──< menu_items
restaurants ──< pizza_sizes / crust_types / toppings
restaurants ──< deals
restaurants ──< coupons (coupon.restaurant_id NULL = platform-wide)

users 1──1 carts ──< cart_items ──< cart_item_toppings
carts >── coupons

users ──< orders >── restaurants
orders ──< order_items
orders ──< order_status_history
orders 1──1 payments ──< payment_transactions
orders 1──1 deliveries >── drivers
orders ──< reviews

users ──< notifications
audit_logs (standalone)
```

Every table carries the mandated audit columns: `id, created_at, updated_at, created_by, updated_by, is_deleted` (+ `version` for optimistic locking). Soft delete via `is_deleted`; unique indexes are filtered on `is_deleted = FALSE`. Full DDL: [`V1__init_schema.sql`](src/main/resources/db/migration/V1__init_schema.sql). Seed: [`V2__seed_data.sql`](src/main/resources/db/migration/V2__seed_data.sql).

---

## React screen → API contract map

Maps every existing React surface to its REST endpoint(s). ✅ = implemented in Phase 1.

| React surface | Action | Method & path | Phase |
|---|---|---|---|
| `WelcomeScreen` (Customer) | Register / sign in | `POST /api/v1/auth/register` ✅ · `POST /api/v1/auth/login` ✅ | 1 |
| `StoreOwnerModal` | Owner sign in | `POST /api/v1/auth/login` (role RESTAURANT_OWNER) ✅ | 1 |
| Session bootstrap | Refresh / logout | `POST /api/v1/auth/refresh` ✅ · `POST /api/v1/auth/logout` ✅ | 1 |
| `CustomerProfile` | Get / update profile | `GET /api/v1/users/me` · `PATCH /api/v1/users/me` | 2 |
| `CustomerProfile` addresses | CRUD saved addresses | `GET/POST/PUT/DELETE /api/v1/users/me/addresses` | 2 |
| `HomeView` / `StoreGrid` | List stores (Michigan, by city) | `GET /api/v1/restaurants?city=` | 2 |
| `StoreDetailSheet` | Store + menu | `GET /api/v1/restaurants/{id}` · `GET /api/v1/restaurants/{id}/menu` | 2 |
| `PremiumPizzaBuilder` | Option catalogs | `GET /api/v1/restaurants/{id}/pizza-options` | 2 |
| `LocalDeals` | Active deals | `GET /api/v1/deals?city=` | 2 |
| `Cart` | View / add / update / remove | `GET /api/v1/cart` · `POST /api/v1/cart/items` · `PATCH /api/v1/cart/items/{id}` · `DELETE /api/v1/cart/items/{id}` | 3 |
| `Cart` | Apply coupon | `POST /api/v1/cart/coupon` | 3 |
| `Checkout` | Place order | `POST /api/v1/orders` | 3 |
| `OrderTracking` | Live status | `GET /api/v1/orders/{id}` · `GET /api/v1/orders/{id}/status` | 3/5 |
| `OrdersManager` / Order History | List / reorder / cancel | `GET /api/v1/orders` · `POST /api/v1/orders/{id}/reorder` · `POST /api/v1/orders/{id}/cancel` | 3 |
| `ComparisonCards` | Price quote across providers | `POST /api/v1/quotes` | 3 |
| Checkout payment | Pay (Stripe/PayPal/Cash) | `POST /api/v1/payments/intent` · `POST /api/v1/payments/{id}/confirm` · webhook `POST /api/v1/payments/webhook/stripe` | 4 |
| `RewardsView` | Points / redeem | `GET /api/v1/rewards` · `POST /api/v1/rewards/redeem` | 6 |
| `NotificationsView` | Inbox / prefs | `GET /api/v1/notifications` · `PATCH /api/v1/notifications/prefs` | 6 |
| Reviews (StoreDetail) | Submit / list | `POST /api/v1/restaurants/{id}/reviews` · `GET /api/v1/restaurants/{id}/reviews` | 5 |
| `StoreOwnerDashboard` — menu | CRUD menu/prices/deals | `…/api/v1/owner/menu-items`, `…/deals`, `…/prices` | 2/3 |
| `StoreOwnerDashboard` — orders | Live orders / status update | `GET /api/v1/owner/orders` · `PATCH /api/v1/owner/orders/{id}/status` | 3 |
| `StoreOwnerDashboard` — payouts | Earnings/payouts | `GET /api/v1/owner/payouts` | 6 |
| `PlatformAdminDashboard` | Users/stores/orders/analytics | `GET /api/v1/admin/...` (role ADMIN) | 6 |
| Delivery partner app | Assignment / status | `GET /api/v1/driver/deliveries` · `PATCH /api/v1/driver/deliveries/{id}` | 5 |

---

## Running locally

Prerequisites: **JDK 21**, **Maven 3.9+**, **Docker** (for Postgres/Redis).

```bash
# 1. Start infra
cp .env.example .env            # then edit secrets (generate JWT_SECRET: openssl rand -base64 32)
docker compose up -d postgres redis

# 2. Run the app (Flyway applies V1 + V2 on startup)
mvn spring-boot:run

# 3. Explore the API
open http://localhost:8080/swagger-ui.html
```

Or run everything in containers: `docker compose up --build`.

### Smoke test (Phase 1)

```bash
# Register a customer
curl -X POST localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alex@example.com","password":"password123","fullName":"Alex"}'

# Log in as the seeded admin (password: "password")
curl -X POST localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mislice.com","password":"password"}'
```

---

## Security

- **Stateless JWT** access tokens (15 min) + **rotating opaque refresh tokens** (14 d, SHA-256 hashed at rest).
- **RBAC** via `ROLE_CUSTOMER / RESTAURANT_OWNER / ADMIN / DELIVERY_PARTNER`, enforced with `@EnableMethodSecurity` + URL rules in `SecurityConfig`.
- BCrypt password hashing; CORS locked to configured origins; CSRF disabled (token-based, no cookies).
- Bean Validation on all request DTOs; consistent `ErrorResponse` via `GlobalExceptionHandler`.
- Audit columns on every row; `audit_logs` table for security events.
- **Planned:** Bucket4j rate limiting on `/auth/**`, request-id logging, Stripe webhook signature verification.

---

## Roadmap

| Phase | Scope |
|---|---|
| **1 — Foundation** ✅ | Build, config, security/JWT, error handling, OpenAPI, **full schema + seed**, Auth/User slice |
| **2 — Catalog** | Restaurant, hours, zones, menu, pizza options, deals; public browse endpoints; owner menu CRUD; profile + addresses |
| **3 — Ordering** | Cart, coupons, pricing/tax engine, multi-provider quotes, order lifecycle + status history, reorder/cancel |
| **4 — Payments** | Stripe + PayPal adapters, PaymentIntent flow, webhooks, refunds, transaction ledger |
| **5 — Fulfilment** | Delivery assignment/tracking, ETA, driver app endpoints, reviews + moderation |
| **6 — Platform** | Notifications (email/SMS/push), rewards, admin analytics/reports, fraud logs, rate limiting, CI/CD |
| **7 — FE integration** | Repoint the React app from Firebase to these REST APIs, screen by screen |

---

## Notes & decisions

- This module lives beside the existing React app, which **currently uses Firebase**. The
  frontend is repointed to these APIs in **Phase 7** — until then both can coexist.
- The schema is the source of truth; Hibernate runs in `ddl-auto: validate` so entities must
  match the Flyway DDL exactly.
- Replace all seed credentials and the dev `JWT_SECRET` before any real deployment.
```
