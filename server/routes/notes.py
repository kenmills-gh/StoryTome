# server/routes/notes.py
from flask import Blueprint, request, jsonify
from config import db
from models import Note, Book

notes_bp = Blueprint("notes", __name__, url_prefix="/notes")


@notes_bp.route("", methods=["GET", "POST"])  # type: ignore
def handle_notes():
    if request.method == "GET":
        # Support filtering notes by book_id via query param: /notes?book_id=1
        book_id = request.args.get("book_id")
        if book_id:
            notes = Note.query.filter_by(book_id=book_id).all()
        else:
            notes = Note.query.all()
        return jsonify([note.to_dict() for note in notes]), 200

    elif request.method == "POST":
        data = request.get_json() or {}

        # Verify book exists before attaching note
        book = db.session.get(Book, data.get("book_id"))
        if not book:
            return jsonify({"error": "Associated book not found"}), 404

        new_note = Note()
        new_note.user_id = data.get("user_id", book.user_id)
        new_note.book_id = book.id
        new_note.chapter_num = data.get("chapter_num")
        new_note.note_type = data.get("note_type", "Chapter Note")
        new_note.content = data.get("content", "")

        db.session.add(new_note)
        db.session.commit()
        return jsonify(new_note.to_dict()), 201


@notes_bp.route("/<int:id>", methods=["GET", "PATCH", "DELETE"])  # type: ignore
def handle_note_by_id(id):
    note = db.session.get(Note, id)
    if not note:
        return jsonify({"error": "Note not found"}), 404

    if request.method == "GET":
        return jsonify(note.to_dict()), 200

    elif request.method == "PATCH":
        data = request.get_json() or {}
        for attr, val in data.items():
            if hasattr(note, attr):
                setattr(note, attr, val)
        db.session.commit()
        return jsonify(note.to_dict()), 200

    elif request.method == "DELETE":
        db.session.delete(note)
        db.session.commit()
        return jsonify({"message": "Note deleted successfully"}), 200
