# server/routes/auth.py
from flask import Blueprint, request, jsonify, session
from config import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if (
        not isinstance(username, str)
        or not username.strip()
        or not isinstance(email, str)
        or not email.strip()
        or not isinstance(password, str)
        or not password.strip()
    ):
        return jsonify({"error": "Username, email, and password are required"}), 400

    username = username.strip()
    email = email.strip().lower()
    if len(username) > 80 or len(email) > 120:
        return jsonify({"error": "Username or email is too long."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400
    if len(password.encode("utf-8")) > 72:
        return jsonify({"error": "Password must be no more than 72 UTF-8 bytes."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 422

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 422

    user = User()
    user.username = username
    user.email = email
    user.password = password

    db.session.add(user)
    db.session.commit()

    session.clear()
    session["user_id"] = user.id
    return jsonify(user.to_dict()), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return jsonify({"error": "Username and password are required."}), 400

    user = User.query.filter_by(username=username.strip()).first()

    if user and user.authenticate(password):
        session.clear()
        session["user_id"] = user.id
        return jsonify(user.to_dict()), 200

    return jsonify({"error": "Invalid username or password"}), 401


@auth_bp.route("/logout", methods=["DELETE"])
def logout():
    if session.get("user_id"):
        session.clear()
        return jsonify({"message": "Logged out successfully"}), 200
    return jsonify({"error": "No active session"}), 401


@auth_bp.route("/me", methods=["GET"])
def check_session():
    user_id = session.get("user_id")
    if user_id:
        user = db.session.get(User, user_id)
        if user:
            return jsonify(user.to_dict()), 200
    return jsonify({"error": "Unauthorized"}), 401
