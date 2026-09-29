# server/routes/notes.py
from flask import Blueprint, g, request, jsonify
from config import db
from models import Note, Book
from routes.auth_helpers import login_required

notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")
NOTE_TYPES = {"Chapter Note", "Character Log", "Character Note", "Quote", "Theory"}
NOTE_FIELDS = {"chapter_num", "note_type", "content"}


@notes_bp.route("", methods=["GET", "POST"])  # type: ignore
@login_required
def handle_notes():
    if request.method == "GET":
        book_id = request.args.get("book_id")
        if book_id:
            try:
                book_id = int(book_id)
            except ValueError:
                return jsonify({"error": "book_id must be an integer"}), 400
            book = Book.query.filter_by(id=book_id, user_id=g.current_user.id).first()
            if book is None:
                return jsonify({"error": "Book not found."}), 404
            notes = Note.query.filter_by(
                book_id=book.id, user_id=g.current_user.id
            ).all()
        else:
            notes = Note.query.filter_by(user_id=g.current_user.id).all()
        return jsonify([note.to_dict() for note in notes]), 200

    elif request.method == "POST":
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or set(data) - (NOTE_FIELDS | {"book_id"}):
            return jsonify({"error": "Request body contains invalid fields."}), 400

        book_id = data.get("book_id")
        if type(book_id) is not int:
            return jsonify({"error": "book_id must be an integer."}), 400
        book = Book.query.filter_by(id=book_id, user_id=g.current_user.id).first()
        if not book:
            return jsonify({"error": "Book not found."}), 404

        content = data.get("content")
        note_type = data.get("note_type", "Chapter Note")
        chapter_num = data.get("chapter_num")
        if not isinstance(content, str) or not content.strip():
            return jsonify({"error": "A non-empty note content is required."}), 400
        if not isinstance(note_type, str) or note_type not in NOTE_TYPES:
            return jsonify({"error": "Invalid note type."}), 400
        if chapter_num is not None and (
            type(chapter_num) is not int or chapter_num < 1
        ):
            return (
                jsonify({"error": "chapter_num must be a positive integer or null."}),
                400,
            )

        new_note = Note(
            user_id=g.current_user.id,
            book_id=book.id,
            chapter_num=chapter_num,
            note_type=note_type,
            content=content.strip(),
        )

        db.session.add(new_note)
        db.session.commit()
        return jsonify(new_note.to_dict()), 201


@notes_bp.route("/<int:id>", methods=["GET", "PATCH", "DELETE"])  # type: ignore
@login_required
def handle_note_by_id(id):
    note = Note.query.filter_by(id=id, user_id=g.current_user.id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404

    if request.method == "GET":
        return jsonify(note.to_dict()), 200

    elif request.method == "PATCH":
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not data or set(data) - NOTE_FIELDS:
            return jsonify({"error": "Request body contains invalid fields."}), 400
        if "content" in data and (
            not isinstance(data["content"], str) or not data["content"].strip()
        ):
            return jsonify({"error": "A non-empty note content is required."}), 400
        if "note_type" in data and (
            not isinstance(data["note_type"], str)
            or data["note_type"] not in NOTE_TYPES
        ):
            return jsonify({"error": "Invalid note type."}), 400
        if (
            "chapter_num" in data
            and data["chapter_num"] is not None
            and (type(data["chapter_num"]) is not int or data["chapter_num"] < 1)
        ):
            return (
                jsonify({"error": "chapter_num must be a positive integer or null."}),
                400,
            )
        for attr, val in data.items():
            setattr(note, attr, val.strip() if attr == "content" else val)
        db.session.commit()
        return jsonify(note.to_dict()), 200

    elif request.method == "DELETE":
        db.session.delete(note)
        db.session.commit()
        return jsonify({"message": "Note deleted successfully"}), 200
