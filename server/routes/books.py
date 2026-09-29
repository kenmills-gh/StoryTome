# server/routes/books.py
from flask import Blueprint, g, request, jsonify
from config import db
from models.book import Book
from routes.auth_helpers import login_required

books_bp = Blueprint("books", __name__, url_prefix="/api/books")
BOOK_STATUSES = {"Want to Read", "Currently Reading", "Completed"}
BOOK_FIELDS = {
    "title",
    "author",
    "series_name",
    "series_order",
    "status",
    "current_page",
    "total_pages",
}


def _valid_nonnegative_int(value):
    return type(value) is int and value >= 0


def _validate_book_data(data, book=None):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object."
    if not data or set(data) - BOOK_FIELDS:
        return None, "Request contains unsupported or missing fields."

    values = {
        "title": book.title if book else None,
        "author": book.author if book else None,
        "series_name": book.series_name if book else None,
        "series_order": book.series_order if book else None,
        "status": book.status if book else "Want to Read",
        "current_page": book.current_page if book else 0,
        "total_pages": book.total_pages if book else 0,
    }
    values.update(data)

    for field in ("title", "author"):
        if not isinstance(values[field], str) or not values[field].strip():
            return None, f"A non-empty {field} is required."
        values[field] = values[field].strip()
    if values["series_name"] is not None and not isinstance(values["series_name"], str):
        return None, "series_name must be a string or null."
    if values["series_order"] is not None and not _valid_nonnegative_int(
        values["series_order"]
    ):
        return None, "series_order must be a non-negative integer or null."
    if not isinstance(values["status"], str) or values["status"] not in BOOK_STATUSES:
        return None, "Invalid book status."
    for field in ("current_page", "total_pages"):
        if not _valid_nonnegative_int(values[field]):
            return None, f"{field} must be a non-negative integer."
    if values["current_page"] > values["total_pages"]:
        return None, "current_page cannot exceed total_pages."

    return values, None


@books_bp.route("", methods=["GET", "POST"])  # type: ignore
@login_required
def handle_books():
    if request.method == "GET":
        books = Book.query.filter_by(user_id=g.current_user.id).all()
        return jsonify([book.to_dict() for book in books]), 200

    elif request.method == "POST":
        data = request.get_json(silent=True)
        values, error = _validate_book_data(data)
        if error:
            return jsonify({"error": error}), 400

        new_book = Book(user_id=g.current_user.id, **values)

        db.session.add(new_book)
        db.session.commit()
        return jsonify(new_book.to_dict()), 201


@books_bp.route("/<int:id>", methods=["GET", "PATCH", "DELETE"])  # type: ignore
@login_required
def handle_book_by_id(id):
    book = Book.query.filter_by(id=id, user_id=g.current_user.id).first()
    if not book:
        return jsonify({"error": "Book not found"}), 404

    if request.method == "GET":
        return jsonify(book.to_dict()), 200

    elif request.method == "PATCH":
        values, error = _validate_book_data(request.get_json(silent=True), book)
        if error:
            return jsonify({"error": error}), 400
        for attr, val in values.items():
            setattr(book, attr, val)
        db.session.commit()
        return jsonify(book.to_dict()), 200

    elif request.method == "DELETE":
        db.session.delete(book)
        db.session.commit()
        return jsonify({"message": "Book deleted successfully"}), 200
