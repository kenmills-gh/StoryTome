# server/routes/auth.py
from flask import Blueprint, request, jsonify, session
from config import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

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

    session["user_id"] = user.id
    return jsonify(user.to_dict()), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if user and user.authenticate(password):
        session["user_id"] = user.id
        return jsonify(user.to_dict()), 200

    return jsonify({"error": "Invalid username or password"}), 401


@auth_bp.route("/logout", methods=["DELETE"])
def logout():
    if session.get("user_id"):
        session.pop("user_id", None)
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
