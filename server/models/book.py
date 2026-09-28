from datetime import datetime
from config import db


class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    series_name = db.Column(db.String(150), nullable=True)
    series_order = db.Column(db.Integer, nullable=True)
    status = db.Column(
        db.String(50), default="Want to Read"
    )  # "Want to Read", "Currently Reading", "Completed"
    current_page = db.Column(db.Integer, default=0)
    total_pages = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    notes = db.relationship(
        "Note", backref="book", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "author": self.author,
            "series_name": self.series_name,
            "series_order": self.series_order,
            "status": self.status,
            "current_page": self.current_page,
            "total_pages": self.total_pages,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "notes_count": len(self.notes) if self.notes else 0,  # type: ignore
        }
