from functools import wraps

from flask import g, jsonify, session

from config import db
from models import User


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        user_id = session.get("user_id")
        user = db.session.get(User, user_id) if user_id else None
        if user is None:
            return jsonify({"error": "Authentication required."}), 401

        g.current_user = user
        return view(*args, **kwargs)

    return wrapped_view
