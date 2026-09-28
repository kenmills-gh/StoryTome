from datetime import datetime
from config import db


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    chapter_num = db.Column(db.Integer, nullable=True)
    note_type = db.Column(
        db.String(50), default="Chapter Note"
    )  # "Chapter Note", "Character Note", "Quote", "Theory"
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "book_id": self.book_id,
            "chapter_num": self.chapter_num,
            "note_type": self.note_type,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
