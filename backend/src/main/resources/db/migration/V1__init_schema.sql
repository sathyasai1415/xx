-- ============================================================================
-- MiSlice production schema — V1
-- Conventions: every table has id (uuid), created_at, updated_at, created_by,
-- updated_by, is_deleted, version. Soft delete via is_deleted.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ── Users & auth ────────────────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    phone           VARCHAR(30),
    account_status  VARCHAR(32)  NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_vegetarian   BOOLEAN      NOT NULL DEFAULT FALSE,
    preferred_crust VARCHAR(60),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    version         BIGINT       NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_users_email ON users (LOWER(email)) WHERE is_deleted = FALSE;

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE addresses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label        VARCHAR(60) NOT NULL,
    line1        VARCHAR(255) NOT NULL,
    line2        VARCHAR(255),
    city         VARCHAR(120) NOT NULL,
    state        VARCHAR(2)   NOT NULL DEFAULT 'MI',
    postal_code  VARCHAR(12)  NOT NULL,
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    version      BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_addresses_user ON addresses (user_id) WHERE is_deleted = FALSE;

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    version     BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    purpose     VARCHAR(32) NOT NULL,   -- EMAIL_VERIFICATION | PASSWORD_RESET
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    version     BIGINT  NOT NULL DEFAULT 0
);

-- ── Restaurants ─────────────────────────────────────────────────────────────

CREATE TABLE restaurants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      UUID REFERENCES users(id),
    name          VARCHAR(160) NOT NULL,
    slug          VARCHAR(180) NOT NULL,
    tagline       VARCHAR(255),
    description   TEXT,
    phone         VARCHAR(30),
    address_line  VARCHAR(255),
    city          VARCHAR(120) NOT NULL DEFAULT 'Detroit',
    state         VARCHAR(2)   NOT NULL DEFAULT 'MI',
    postal_code   VARCHAR(12),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    logo_url      VARCHAR(512),
    brand_color   VARCHAR(32),
    rating_avg    NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    rating_count  INTEGER      NOT NULL DEFAULT 0,
    accepting_orders BOOLEAN   NOT NULL DEFAULT TRUE,
    is_approved   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_restaurants_slug ON restaurants (slug) WHERE is_deleted = FALSE;
CREATE INDEX ix_restaurants_owner ON restaurants (owner_id);
CREATE INDEX ix_restaurants_city ON restaurants (city) WHERE is_deleted = FALSE;

CREATE TABLE restaurant_hours (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week    SMALLINT NOT NULL,  -- 0=Sun .. 6=Sat
    open_time      TIME,
    close_time     TIME,
    closed         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     VARCHAR(255),
    updated_by     VARCHAR(255),
    is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    version        BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT uq_restaurant_day UNIQUE (restaurant_id, day_of_week)
);

CREATE TABLE delivery_zones (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name           VARCHAR(120) NOT NULL,
    postal_code    VARCHAR(12),
    radius_miles   NUMERIC(5,2),
    delivery_fee   NUMERIC(8,2) NOT NULL DEFAULT 0,
    min_order      NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     VARCHAR(255),
    updated_by     VARCHAR(255),
    is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    version        BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_delivery_zones_restaurant ON delivery_zones (restaurant_id);

-- ── Menu ────────────────────────────────────────────────────────────────────

CREATE TABLE categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(80) NOT NULL,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_categories_restaurant ON categories (restaurant_id);

CREATE TABLE menu_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    name          VARCHAR(160) NOT NULL,
    description   TEXT,
    base_price    NUMERIC(8,2) NOT NULL,
    photo_url     VARCHAR(512),
    tags          TEXT[],            -- e.g. {Vegetarian,Bestseller}
    item_type     VARCHAR(32) NOT NULL DEFAULT 'PIZZA', -- PIZZA|SIDE|DRINK|DESSERT|TOPPING|COMBO
    available     BOOLEAN NOT NULL DEFAULT TRUE,
    stock_qty     INTEGER,           -- null = not inventory-tracked
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_menu_items_restaurant ON menu_items (restaurant_id) WHERE is_deleted = FALSE;
CREATE INDEX ix_menu_items_category ON menu_items (category_id);

-- Pizza configuration option catalogs (sizes, crusts, toppings, extras)
CREATE TABLE pizza_sizes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(40) NOT NULL,   -- Small, Medium, Large, Extra Large
    price_delta   NUMERIC(8,2) NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);

CREATE TABLE crust_types (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(60) NOT NULL,
    price_delta   NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);

CREATE TABLE toppings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          VARCHAR(80) NOT NULL,
    category      VARCHAR(40) NOT NULL DEFAULT 'VEGGIE', -- MEAT|VEGGIE|CHEESE|SAUCE
    price         NUMERIC(8,2) NOT NULL DEFAULT 0,
    available     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_toppings_restaurant ON toppings (restaurant_id);

-- ── Coupons & deals ─────────────────────────────────────────────────────────

CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE, -- null = platform-wide
    code            VARCHAR(40) NOT NULL,
    description     VARCHAR(255),
    discount_type   VARCHAR(20) NOT NULL,  -- PERCENT|FIXED|FREE_DELIVERY|BOGO
    discount_value  NUMERIC(8,2) NOT NULL DEFAULT 0,
    min_order       NUMERIC(8,2) NOT NULL DEFAULT 0,
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    usage_limit     INTEGER,
    used_count      INTEGER NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    version         BIGINT  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_coupons_code ON coupons (UPPER(code)) WHERE is_deleted = FALSE;

CREATE TABLE deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title           VARCHAR(160) NOT NULL,
    description     TEXT,
    original_price  NUMERIC(8,2),
    discounted_price NUMERIC(8,2),
    image_url       VARCHAR(512),
    delivery_type   VARCHAR(32),
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    version         BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_deals_restaurant ON deals (restaurant_id);
CREATE INDEX ix_deals_active ON deals (active) WHERE is_deleted = FALSE;

-- ── Cart ────────────────────────────────────────────────────────────────────

CREATE TABLE carts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    coupon_id     UUID REFERENCES coupons(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_carts_user_active ON carts (user_id) WHERE is_deleted = FALSE;

CREATE TABLE cart_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id       UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id  UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name     VARCHAR(160) NOT NULL,
    size          VARCHAR(40),
    crust         VARCHAR(60),
    sauce         VARCHAR(80),
    quantity      INTEGER NOT NULL DEFAULT 1,
    unit_price    NUMERIC(8,2) NOT NULL,
    notes         VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT ck_cart_items_qty CHECK (quantity > 0)
);
CREATE INDEX ix_cart_items_cart ON cart_items (cart_id);

CREATE TABLE cart_item_toppings (
    cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
    topping_id   UUID REFERENCES toppings(id) ON DELETE SET NULL,
    topping_name VARCHAR(80) NOT NULL,
    price        NUMERIC(8,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (cart_item_id, topping_name)
);

-- ── Orders ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(20) NOT NULL UNIQUE,
    user_id             UUID NOT NULL REFERENCES users(id),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
    status              VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    delivery_type       VARCHAR(32) NOT NULL DEFAULT 'STORE_DELIVERY',
    delivery_provider   VARCHAR(40),
    delivery_address    VARCHAR(500),
    delivery_notes      VARCHAR(500),
    subtotal            NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
    service_fee         NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax                 NUMERIC(10,2) NOT NULL DEFAULT 0,
    tip                 NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
    total               NUMERIC(10,2) NOT NULL DEFAULT 0,
    coupon_code         VARCHAR(40),
    estimated_eta_min   INTEGER,
    estimated_eta_max   INTEGER,
    placed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    version             BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_orders_user ON orders (user_id, placed_at DESC);
CREATE INDEX ix_orders_restaurant ON orders (restaurant_id, placed_at DESC);
CREATE INDEX ix_orders_status ON orders (status);

CREATE TABLE order_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id  UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name     VARCHAR(160) NOT NULL,
    size          VARCHAR(40),
    crust         VARCHAR(60),
    sauce         VARCHAR(80),
    toppings      TEXT[],
    quantity      INTEGER NOT NULL DEFAULT 1,
    unit_price    NUMERIC(8,2) NOT NULL,
    line_total    NUMERIC(10,2) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_order_items_order ON order_items (order_id);

CREATE TABLE order_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(32),
    to_status   VARCHAR(32) NOT NULL,
    changed_by  VARCHAR(255),
    note        VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_order_status_history_order ON order_status_history (order_id, created_at);

-- ── Payments ────────────────────────────────────────────────────────────────

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider        VARCHAR(20) NOT NULL,   -- STRIPE|PAYPAL|CASH
    method          VARCHAR(20) NOT NULL,   -- CARD|CASH|WALLET
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING|AUTHORIZED|CAPTURED|FAILED|REFUNDED
    amount          NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    provider_ref    VARCHAR(255),           -- Stripe PaymentIntent / PayPal order id
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    version         BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_payments_order ON payments (order_id);

CREATE TABLE payment_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id  UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,   -- AUTHORIZE|CAPTURE|REFUND|VOID
    amount      NUMERIC(10,2) NOT NULL,
    status      VARCHAR(20) NOT NULL,
    provider_ref VARCHAR(255),
    raw_payload JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_payment_tx_payment ON payment_transactions (payment_id);

-- ── Delivery ────────────────────────────────────────────────────────────────

CREATE TABLE drivers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle       VARCHAR(120),
    available     BOOLEAN NOT NULL DEFAULT FALSE,
    current_lat   DOUBLE PRECISION,
    current_lng   DOUBLE PRECISION,
    rating_avg    NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);

CREATE TABLE deliveries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    driver_id     UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status        VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING|ASSIGNED|PICKED_UP|EN_ROUTE|DELIVERED|FAILED
    assigned_at   TIMESTAMPTZ,
    picked_up_at  TIMESTAMPTZ,
    delivered_at  TIMESTAMPTZ,
    eta_minutes   INTEGER,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_deliveries_driver ON deliveries (driver_id);

-- ── Reviews ─────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating        SMALLINT NOT NULL,
    comment       TEXT,
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING|APPROVED|REJECTED
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX ix_reviews_restaurant ON reviews (restaurant_id) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX ux_reviews_user_order ON reviews (user_id, order_id) WHERE order_id IS NOT NULL;

-- ── Notifications & audit ───────────────────────────────────────────────────

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(40) NOT NULL,   -- ORDER_CONFIRMED|STATUS_CHANGE|DEAL|REWARD|...
    channel     VARCHAR(20) NOT NULL DEFAULT 'PUSH', -- EMAIL|SMS|PUSH
    title       VARCHAR(160) NOT NULL,
    body        TEXT,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    version     BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_notifications_user ON notifications (user_id, read);

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor       VARCHAR(255),
    action      VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80),
    entity_id   VARCHAR(80),
    detail      JSONB,
    ip_address  VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX ix_audit_logs_actor ON audit_logs (actor, created_at);
