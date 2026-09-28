# server/routes/books.py
from flask import Blueprint, request, jsonify
from config import db
from models.book import Book
from models.users import User

books_bp = Blueprint("books", __name__, url_prefix="/books")


@books_bp.route("", methods=["GET", "POST"])  # type: ignore
def handle_books():
    if request.method == "GET":
        books = Book.query.all()
        return jsonify([book.to_dict() for book in books]), 200

    elif request.method == "POST":
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object."}), 400

        title = data.get("title")
        author = data.get("author")
        if not isinstance(title, str) or not title.strip():
            return jsonify({"error": "A non-empty title is required."}), 400
        if not isinstance(author, str) or not author.strip():
            return jsonify({"error": "A non-empty author is required."}), 400

        user_id = data.get("user_id")
        if type(user_id) is not int:
            return jsonify({"error": "user_id must be an integer."}), 400
        user = db.session.get(User, user_id)
        if user is None:
            return jsonify({"error": "User not found."}), 404

        new_book = Book()
        new_book.user_id = user.id
        new_book.title = title.strip()
        new_book.author = author.strip()
        new_book.series_name = data.get("series_name")
        new_book.series_order = data.get("series_order")
        new_book.status = data.get("status", "Want to Read")
        new_book.current_page = data.get("current_page", 0)
        new_book.total_pages = data.get("total_pages", 0)

        db.session.add(new_book)
        db.session.commit()
        return jsonify(new_book.to_dict()), 201


@books_bp.route("/<int:id>", methods=["GET", "PATCH", "DELETE"])  # type: ignore
def handle_book_by_id(id):
    book = db.session.get(Book, id)
    if not book:
        return jsonify({"error": "Book not found"}), 404

    if request.method == "GET":
        return jsonify(book.to_dict()), 200

    elif request.method == "PATCH":
        data = request.get_json() or {}
        for attr, val in data.items():
            if hasattr(book, attr):
                setattr(book, attr, val)
        db.session.commit()
        return jsonify(book.to_dict()), 200

    elif request.method == "DELETE":
        db.session.delete(book)
        db.session.commit()
        return jsonify({"message": "Book deleted successfully"}), 200
