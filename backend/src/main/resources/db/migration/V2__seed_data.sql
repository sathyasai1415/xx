-- ============================================================================
-- Seed data — V2
-- BCrypt hash below corresponds to the password: "password"
-- (replace these credentials before any real deployment).
-- Admin:  admin@mislice.com / password
-- Owner:  owner@shamzpizza.com / password
-- ============================================================================

-- Fixed UUIDs so seed rows can reference each other deterministically.
-- admin user
INSERT INTO users (id, email, password_hash, full_name, account_status, email_verified, created_by)
VALUES ('00000000-0000-0000-0000-0000000000a1',
        'admin@mislice.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'Platform Admin', 'ACTIVE', TRUE, 'system');
INSERT INTO user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-0000000000a1', 'ADMIN');

-- restaurant owner user
INSERT INTO users (id, email, password_hash, full_name, account_status, email_verified, created_by)
VALUES ('00000000-0000-0000-0000-0000000000b1',
        'owner@shamzpizza.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'Shamz Owner', 'ACTIVE', TRUE, 'system');
INSERT INTO user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-0000000000b1', 'RESTAURANT_OWNER');

-- restaurant
INSERT INTO restaurants (id, owner_id, name, slug, tagline, description, phone, address_line, city, state, postal_code,
                         logo_url, brand_color, rating_avg, rating_count, accepting_orders, is_approved, created_by)
VALUES ('00000000-0000-0000-0000-0000000000c1',
        '00000000-0000-0000-0000-0000000000b1',
        'Shamz Pizza', 'shamz-pizza',
        'Fresh Ingredients. Bold Flavors. Shamz Pizza.',
        'Handcrafted pizzas made fresh every day in the heart of Detroit.',
        '+1 (555) 742-6999', '123 Shamz Lane', 'Detroit', 'MI', '48226',
        '/shamz-pizza-store.png', 'red', 4.7, 128, TRUE, TRUE, 'system');

-- operating hours (Sun=0 .. Sat=6)
INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, closed, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000c1', 0, '12:00', '21:00', FALSE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 1, '11:00', '22:00', FALSE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 2, '11:00', '22:00', FALSE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 3, '11:00', '22:00', FALSE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 4, '11:00', '22:30', FALSE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 5, '11:00', '23:00', FALSE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 6, '10:00', '23:00', FALSE, 'system');

-- categories
INSERT INTO categories (id, restaurant_id, name, sort_order, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', 'Pizza', 1, 'system'),
 ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c1', 'Sides', 2, 'system'),
 ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1', 'Drinks', 3, 'system'),
 ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000c1', 'Desserts', 4, 'system');

-- menu items (subset of the React seed)
INSERT INTO menu_items (restaurant_id, category_id, name, description, base_price, tags, item_type, available, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Shamz Classic Margherita', 'San Marzano tomato, fresh mozzarella, basil, EVOO', 13.99, '{Vegetarian,Bestseller}', 'PIZZA', TRUE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Pepperoni Supreme', 'Double-stacked pepperoni, smoked mozzarella, tomato sauce', 16.99, '{Bestseller,Hot}', 'PIZZA', TRUE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', 'Shamz Meat Feast', 'Pepperoni, Italian sausage, bacon, ham, mozzarella', 18.99, '{Popular}', 'PIZZA', TRUE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d2', 'Garlic Bread', 'Toasted Italian bread with garlic butter & herbs', 5.49, '{Popular}', 'SIDE', TRUE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d3', 'Coca-Cola', '375ml can', 2.99, '{}', 'DRINK', TRUE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d4', 'Tiramisu', 'Classic Italian, house-made daily', 7.49, '{Popular}', 'DESSERT', TRUE, 'system');

-- pizza option catalogs
INSERT INTO pizza_sizes (restaurant_id, name, price_delta, sort_order, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000c1', 'Small', 0, 1, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Medium', 3.00, 2, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Large', 6.00, 3, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Extra Large', 9.00, 4, 'system');

INSERT INTO crust_types (restaurant_id, name, price_delta, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000c1', 'Hand Tossed', 0, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Crunchy Thin Crust', 0, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Parmesan Stuffed Crust', 2.50, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Gluten Free Crust', 3.00, 'system');

INSERT INTO toppings (restaurant_id, name, category, price, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000c1', 'Pepperoni', 'MEAT', 1.99, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Italian Sausage', 'MEAT', 1.99, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Mushrooms', 'VEGGIE', 1.49, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Jalapeños', 'VEGGIE', 1.49, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'Extra Cheese', 'CHEESE', 2.49, 'system');

-- coupons
INSERT INTO coupons (restaurant_id, code, description, discount_type, discount_value, min_order, active, created_by) VALUES
 ('00000000-0000-0000-0000-0000000000c1', 'WELCOME20', '20% off your first order', 'PERCENT', 20, 0, TRUE, 'system'),
 ('00000000-0000-0000-0000-0000000000c1', 'FREEDEL40', 'Free delivery on $40+', 'FREE_DELIVERY', 0, 40, TRUE, 'system'),
 (NULL, 'GRUB7', '$7 off your order', 'FIXED', 7, 15, TRUE, 'system');
