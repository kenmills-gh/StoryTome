# server/seed.py
from config import app, db
from models.book import Book
from models.note import Note
from models.users import User

with app.app_context():
    db.create_all()

    # Check for User 1; create if missing
    user = db.session.get(User, 1)
    if user is None:
        print("Creating default user...")
        user = User()
        user.username = "demo_user"
        user.email = "demo@example.com"
        user.password = "password123"  # Triggers @password.setter in users.py
        db.session.add(user)
        db.session.commit()

    print("Seeding books...")
    existing_book = Book.query.filter_by(
        user_id=user.id, title="The Way of Kings", author="Brandon Sanderson"
    ).first()

    if existing_book is None:
        book1 = Book()
        book1.user_id = user.id
        book1.title = "The Way of Kings"
        book1.author = "Brandon Sanderson"
        book1.series_name = "The Stormlight Archive"
        book1.series_order = 1
        book1.status = "Currently Reading"
        book1.current_page = 400
        book1.total_pages = 1007

        db.session.add(book1)
        db.session.commit()

        # Seed sample note
        note1 = Note()
        note1.user_id = user.id
        note1.book_id = book1.id
        note1.chapter_num = 1
        note1.note_type = "Character Note"
        note1.content = "Kaladin stormblessed introduced in the slave wagon."

        db.session.add(note1)
        db.session.commit()

        print("Database seeded successfully!")
    else:
        print("Book already seeded!")
