from flask import Flask, request, jsonify, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "change-this-secret-key"

DATABASE = "database.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row):
    if row is None:
        return None
    return dict(row)


def init_db():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            full_name TEXT,
            phone TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            description TEXT,
            price INTEGER NOT NULL,
            image_url TEXT
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount INTEGER NOT NULL,
            status TEXT DEFAULT 'submitted',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    products = [
        {
            "slug": "milano-navy-suit",
            "name": "Milano Navy Suit",
            "category": "Suit",
            "description": "Slim fit, wool blend, ideal for business and formal occasions.",
            "price": 3499,
            "image_url": "images/suit.navy.front.jpeg"
        },
        {
            "slug": "torino-charcoal-suit",
            "name": "Torino Charcoal Suit",
            "category": "Suit",
            "description": "Classic tailored silhouette with a soft structured shoulder.",
            "price": 3799,
            "image_url": "images/suit.sort.front.jpeg"
        },
        {
            "slug": "como-sand-suit",
            "name": "Como Sand Suit",
            "category": "Suit",
            "description": "Lightweight suit in breathable fabric for spring and summer events.",
            "price": 3299,
            "image_url": "images/suit.sand.front.jpeg"
        }
    ]

    for product in products:
        conn.execute("""
            INSERT OR IGNORE INTO products 
            (slug, name, category, description, price, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            product["slug"],
            product["name"],
            product["category"],
            product["description"],
            product["price"],
            product["image_url"]
        ))

    conn.commit()
    conn.close()


def get_current_user():
    user_id = session.get("user_id")

    if not user_id:
        return None

    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, email FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    return row_to_dict(user)


@app.route("/")
def root():
    return send_from_directory(".", "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    password_hash = generate_password_hash(password)

    conn = get_db_connection()

    try:
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, password_hash)
        )

        user_id = cursor.lastrowid

        conn.execute(
            "INSERT INTO profiles (user_id, full_name, phone) VALUES (?, ?, ?)",
            (user_id, "", "")
        )

        conn.commit()

    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "User already exists"}), 400

    conn.close()

    return jsonify({"message": "Account created"})


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user["id"]

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "email": user["email"]
        }
    })


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.route("/api/me", methods=["GET"])
def me():
    user = get_current_user()

    if not user:
        return jsonify({"user": None})

    return jsonify({"user": user})


@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db_connection()
    products = conn.execute("SELECT * FROM products").fetchall()
    conn.close()

    return jsonify([row_to_dict(product) for product in products])


@app.route("/api/product/<slug>", methods=["GET"])
def get_product(slug):
    conn = get_db_connection()
    product = conn.execute(
        "SELECT * FROM products WHERE slug = ?",
        (slug,)
    ).fetchone()
    conn.close()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(row_to_dict(product))


@app.route("/api/cart", methods=["GET"])
def get_cart():
    user = get_current_user()

    if not user:
        return jsonify({"error": "You must log in first"}), 401

    conn = get_db_connection()

    items = conn.execute("""
        SELECT 
            cart_items.id,
            cart_items.quantity,
            products.id AS product_id,
            products.name,
            products.price
        FROM cart_items
        JOIN products ON cart_items.product_id = products.id
        WHERE cart_items.user_id = ?
    """, (user["id"],)).fetchall()

    conn.close()

    result = []

    for item in items:
        result.append({
            "id": item["id"],
            "quantity": item["quantity"],
            "product": {
                "id": item["product_id"],
                "name": item["name"],
                "price": item["price"]
            }
        })

    return jsonify(result)


@app.route("/api/cart", methods=["POST"])
def add_to_cart():
    user = get_current_user()

    if not user:
        return jsonify({"error": "You must log in first"}), 401

    data = request.json
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"error": "Missing product id"}), 400

    conn = get_db_connection()

    existing = conn.execute("""
        SELECT * FROM cart_items
        WHERE user_id = ? AND product_id = ?
    """, (user["id"], product_id)).fetchone()

    if existing:
        conn.execute("""
            UPDATE cart_items
            SET quantity = quantity + 1
            WHERE id = ?
        """, (existing["id"],))
    else:
        conn.execute("""
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
        """, (user["id"], product_id, 1))

    conn.commit()
    conn.close()

    return jsonify({"message": "Added to cart"})


@app.route("/api/cart/<int:item_id>", methods=["DELETE"])
def remove_cart_item(item_id):
    user = get_current_user()

    if not user:
        return jsonify({"error": "You must log in first"}), 401

    conn = get_db_connection()

    conn.execute("""
        DELETE FROM cart_items
        WHERE id = ? AND user_id = ?
    """, (item_id, user["id"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Item removed"})


@app.route("/api/checkout", methods=["POST"])
def checkout():
    user = get_current_user()

    if not user:
        return jsonify({"error": "You must log in first"}), 401

    conn = get_db_connection()

    items = conn.execute("""
        SELECT 
            cart_items.quantity,
            products.id AS product_id,
            products.price
        FROM cart_items
        JOIN products ON cart_items.product_id = products.id
        WHERE cart_items.user_id = ?
    """, (user["id"],)).fetchall()

    if not items:
        conn.close()
        return jsonify({"error": "Cart is empty"}), 400

    total_amount = 0

    for item in items:
        total_amount += item["quantity"] * item["price"]

    cursor = conn.execute("""
        INSERT INTO orders (user_id, total_amount, status)
        VALUES (?, ?, ?)
    """, (user["id"], total_amount, "submitted"))

    order_id = cursor.lastrowid

    for item in items:
        conn.execute("""
            INSERT INTO order_items 
            (order_id, product_id, quantity, unit_price)
            VALUES (?, ?, ?, ?)
        """, (
            order_id,
            item["product_id"],
            item["quantity"],
            item["price"]
        ))

    conn.execute(
        "DELETE FROM cart_items WHERE user_id = ?",
        (user["id"],)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Order submitted successfully",
        "order_id": order_id
    })


@app.route("/api/profile", methods=["GET"])
def get_profile():
    user = get_current_user()

    if not user:
        return jsonify({"error": "You must log in first"}), 401

    conn = get_db_connection()

    profile = conn.execute("""
        SELECT full_name, phone
        FROM profiles
        WHERE user_id = ?
    """, (user["id"],)).fetchone()

    orders = conn.execute("""
        SELECT id, total_amount, status, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user["id"],)).fetchall()

    conn.close()

    return jsonify({
        "profile": row_to_dict(profile),
        "orders": [row_to_dict(order) for order in orders]
    })


@app.route("/api/profile", methods=["POST"])
def save_profile():
    user = get_current_user()

    if not user:
        return jsonify({"error": "You must log in first"}), 401

    data = request.json

    full_name = data.get("full_name", "").strip()
    phone = data.get("phone", "").strip()

    conn = get_db_connection()

    conn.execute("""
        INSERT INTO profiles (user_id, full_name, phone)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id)
        DO UPDATE SET
            full_name = excluded.full_name,
            phone = excluded.phone
    """, (user["id"], full_name, phone))

    conn.commit()
    conn.close()

    return jsonify({"message": "Profile updated"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
