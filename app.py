from flask import Flask, render_template, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from decimal import Decimal
import mariadb
import os


app = Flask(__name__)

# CHANGE THIS to a long random secret before final submission
app.secret_key = "change_this_to_a_long_random_secret_key_64008"


# ---------------------------------------------------------
# DATABASE CONFIG
# ---------------------------------------------------------
# IMPORTANT:
# Replace these values with your own DTU database credentials.
DB_CONFIG = {
    "user": "YOUR_DB_USERNAME",
    "password": "YOUR_DB_PASSWORD",
    "host": "127.0.0.1",
    "port": 3306,
    "database": "YOUR_DB_NAME"
}


def get_db_connection():
    return mariadb.connect(**DB_CONFIG)


def query_one(sql, params=()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    row = cursor.fetchone()
    conn.close()
    return row


def query_all(sql, params=()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return rows


def execute(sql, params=()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def money(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def current_user_id():
    return session.get("user_id")


# ---------------------------------------------------------
# DATABASE SETUP
# ---------------------------------------------------------
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ns_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ns_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            full_name VARCHAR(255),
            phone VARCHAR(50),
            FOREIGN KEY (user_id) REFERENCES ns_users(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ns_products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            price DECIMAL(10, 2) NOT NULL,
            description TEXT,
            side_image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ns_cart_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES ns_users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES ns_products(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ns_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Submitted',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES ns_users(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ns_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES ns_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES ns_products(id) ON DELETE CASCADE
        )
    """)

    products = [
        (
            "milano-navy-suit",
            "Milano Navy Suit",
            "Suit",
            3499.00,
            "Slim fit, wool blend, ideal for business and formal occasions.",
            "/static/images/suit.navy.front.jpeg"
        ),
        (
            "torino-charcoal-suit",
            "Torino Charcoal Suit",
            "Suit",
            3799.00,
            "Classic tailored silhouette with a soft structured shoulder.",
            "/static/images/suit.sort.front.jpeg"
        ),
        (
            "como-sand-suit",
            "Como Sand Suit",
            "Suit",
            3299.00,
            "Lightweight suit in breathable fabric for spring and summer events.",
            "/static/images/suit.sand.front.jpeg"
        )
    ]

    for product in products:
        cursor.execute("""
            INSERT INTO ns_products
                (slug, name, category, price, description, side_image_url)
            SELECT ?, ?, ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM ns_products WHERE slug = ?
            )
        """, (*product, product[0]))

    conn.commit()
    conn.close()


# ---------------------------------------------------------
# PAGE ROUTES
# ---------------------------------------------------------
@app.route("/")
@app.route("/index.html")
def index_page():
    return render_template("index.html")


@app.route("/product.html")
def product_page():
    return render_template("product.html")


@app.route("/cart.html")
def cart_page():
    return render_template("cart.html")


@app.route("/account.html")
def account_page():
    return render_template("account.html")


@app.route("/fit-assistant.html")
def fit_assistant_page():
    return render_template("fit-assistant.html")


# ---------------------------------------------------------
# AUTH API
# ---------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    existing_user = query_one(
        "SELECT id FROM ns_users WHERE email = ?",
        (email,)
    )

    if existing_user:
        return jsonify({"error": "An account with this email already exists."}), 409

    password_hash = generate_password_hash(password)

    try:
        user_id = execute(
            "INSERT INTO ns_users (email, password_hash) VALUES (?, ?)",
            (email, password_hash)
        )

        execute(
            "INSERT INTO ns_profiles (user_id, full_name, phone) VALUES (?, '', '')",
            (user_id,)
        )

        return jsonify({"message": "Account created successfully."}), 201

    except mariadb.Error as error:
        return jsonify({"error": f"Database error: {error}"}), 500


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = query_one(
        "SELECT id, email, password_hash FROM ns_users WHERE email = ?",
        (email,)
    )

    if not user:
        return jsonify({"error": "User not found."}), 404

    user_id, user_email, password_hash = user

    if not check_password_hash(password_hash, password):
        return jsonify({"error": "Wrong password."}), 401

    session["user_id"] = user_id
    session["email"] = user_email

    return jsonify({
        "message": "Login successful.",
        "user": {
            "id": user_id,
            "email": user_email
        }
    })


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"message": "Logged out."})


@app.route("/api/me", methods=["GET"])
def api_me():
    if not current_user_id():
        return jsonify({"user": None})

    return jsonify({
        "user": {
            "id": session.get("user_id"),
            "email": session.get("email")
        }
    })


# ---------------------------------------------------------
# PRODUCT API
# ---------------------------------------------------------
@app.route("/api/products", methods=["GET"])
def api_products():
    rows = query_all("""
        SELECT id, slug, name, category, price, description, side_image_url
        FROM ns_products
        ORDER BY id ASC
    """)

    products = []

    for row in rows:
        products.append({
            "id": row[0],
            "slug": row[1],
            "name": row[2],
            "category": row[3],
            "price": money(row[4]),
            "description": row[5],
            "side_image_url": row[6]
        })

    return jsonify(products)


@app.route("/api/product/<slug>", methods=["GET"])
def api_product(slug):
    row = query_one("""
        SELECT id, slug, name, category, price, description, side_image_url
        FROM ns_products
        WHERE slug = ?
    """, (slug,))

    if not row:
        return jsonify({"error": "Product not found."}), 404

    product = {
        "id": row[0],
        "slug": row[1],
        "name": row[2],
        "category": row[3],
        "price": money(row[4]),
        "description": row[5],
        "side_image_url": row[6]
    }

    return jsonify(product)


# ---------------------------------------------------------
# CART API
# ---------------------------------------------------------
@app.route("/api/cart", methods=["GET"])
def api_get_cart():
    user_id = current_user_id()

    if not user_id:
        return jsonify({"error": "You must log in to view your cart."}), 401

    rows = query_all("""
        SELECT
            ci.id,
            ci.quantity,
            p.id,
            p.slug,
            p.name,
            p.price,
            p.side_image_url
        FROM ns_cart_items ci
        INNER JOIN ns_products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
    """, (user_id,))

    items = []

    for row in rows:
        items.append({
            "id": row[0],
            "quantity": row[1],
            "product": {
                "id": row[2],
                "slug": row[3],
                "name": row[4],
                "price": money(row[5]),
                "side_image_url": row[6]
            }
        })

    return jsonify(items)


@app.route("/api/cart", methods=["POST"])
def api_add_to_cart():
    user_id = current_user_id()

    if not user_id:
        return jsonify({"error": "You must log in before adding items to cart."}), 401

    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"error": "Product ID is required."}), 400

    product = query_one(
        "SELECT id FROM ns_products WHERE id = ?",
        (product_id,)
    )

    if not product:
        return jsonify({"error": "Product not found."}), 404

    existing_item = query_one("""
        SELECT id, quantity
        FROM ns_cart_items
        WHERE user_id = ? AND product_id = ?
    """, (user_id, product_id))

    if existing_item:
        cart_item_id = existing_item[0]
        quantity = existing_item[1] + 1

        execute(
            "UPDATE ns_cart_items SET quantity = ? WHERE id = ?",
            (quantity, cart_item_id)
        )
    else:
        execute("""
            INSERT INTO ns_cart_items (user_id, product_id, quantity)
            VALUES (?, ?, 1)
        """, (user_id, product_id))

    return jsonify({"message": "Product added to cart."})


@app.route("/api/cart/<int:item_id>", methods=["DELETE"])
def api_remove_cart_item(item_id):
    user_id = current_user_id()

    if not user_id:
        return jsonify({"error": "You must log in."}), 401

    item = query_one(
        "SELECT id FROM ns_cart_items WHERE id = ? AND user_id = ?",
        (item_id, user_id)
    )

    if not item:
        return jsonify({"error": "Cart item not found."}), 404

    execute(
        "DELETE FROM ns_cart_items WHERE id = ? AND user_id = ?",
        (item_id, user_id)
    )

    return jsonify({"message": "Item removed."})


# ---------------------------------------------------------
# PROFILE + ORDERS API
# ---------------------------------------------------------
@app.route("/api/profile", methods=["GET"])
def api_get_profile():
    user_id = current_user_id()

    if not user_id:
        return jsonify({"error": "You must log in to view your profile."}), 401

    profile_row = query_one("""
        SELECT full_name, phone
        FROM ns_profiles
        WHERE user_id = ?
    """, (user_id,))

    if not profile_row:
        execute(
            "INSERT INTO ns_profiles (user_id, full_name, phone) VALUES (?, '', '')",
            (user_id,)
        )
        profile_row = ("", "")

    order_rows = query_all("""
        SELECT id, total_amount, status, created_at
        FROM ns_orders
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))

    orders = []

    for row in order_rows:
        orders.append({
            "id": row[0],
            "total_amount": money(row[1]),
            "status": row[2],
            "created_at": str(row[3])
        })

    return jsonify({
        "profile": {
            "full_name": profile_row[0],
            "phone": profile_row[1]
        },
        "orders": orders
    })


@app.route("/api/profile", methods=["POST"])
def api_update_profile():
    user_id = current_user_id()

    if not user_id:
        return jsonify({"error": "You must log in to update your profile."}), 401

    data = request.get_json(silent=True) or {}

    full_name = data.get("full_name", "").strip()
    phone = data.get("phone", "").strip()

    existing_profile = query_one(
        "SELECT id FROM ns_profiles WHERE user_id = ?",
        (user_id,)
    )

    if existing_profile:
        execute("""
            UPDATE ns_profiles
            SET full_name = ?, phone = ?
            WHERE user_id = ?
        """, (full_name, phone, user_id))
    else:
        execute("""
            INSERT INTO ns_profiles (user_id, full_name, phone)
            VALUES (?, ?, ?)
        """, (user_id, full_name, phone))

    return jsonify({"message": "Profile updated."})


@app.route("/api/checkout", methods=["POST"])
def api_checkout():
    user_id = current_user_id()

    if not user_id:
        return jsonify({"error": "You must log in before checkout."}), 401

    rows = query_all("""
        SELECT
            ci.product_id,
            ci.quantity,
            p.price
        FROM ns_cart_items ci
        INNER JOIN ns_products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    """, (user_id,))

    if not rows:
        return jsonify({"error": "Your cart is empty."}), 400

    total = Decimal("0.00")

    for row in rows:
        quantity = row[1]
        price = row[2]
        total += price * quantity

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO ns_orders (user_id, total_amount, status)
            VALUES (?, ?, 'Submitted')
        """, (user_id, total))

        order_id = cursor.lastrowid

        for row in rows:
            product_id = row[0]
            quantity = row[1]
            price = row[2]

            cursor.execute("""
                INSERT INTO ns_order_items (order_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)
            """, (order_id, product_id, quantity, price))

        cursor.execute(
            "DELETE FROM ns_cart_items WHERE user_id = ?",
            (user_id,)
        )

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Order submitted successfully.",
            "order_id": order_id,
            "total_amount": money(total)
        })

    except mariadb.Error as error:
        conn.rollback()
        conn.close()
        return jsonify({"error": f"Checkout failed: {error}"}), 500


# ---------------------------------------------------------
# START APP
# ---------------------------------------------------------
PORT_NUMBER = 64008

if __name__ == "__main__":
    init_db()
    app.run(host="130.225.170.248", port=PORT_NUMBER)
