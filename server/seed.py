# server/seed.py
from config import app, db
from models.book import Book
from models.note import Note
from models.users import User

with app.app_context():
    db.create_all()

    user = User.query.filter_by(username="demo_user").first()
    if user is None:
        print("Creating default user...")
        user = User()
        user.username = "demo_user"
        user.email = "demo@example.com"
        db.session.add(user)
    user.password = "password123"
    db.session.commit()

    print("Seeding books...")
    existing_book = Book.query.filter_by(
        user_id=user.id, title="The Way of Kings", author="Brandon Sanderson"
    ).first()

    if existing_book is None:
        existing_book = Book()
        existing_book.user_id = user.id
        existing_book.title = "The Way of Kings"
        existing_book.author = "Brandon Sanderson"
        existing_book.series_name = "The Stormlight Archive"
        existing_book.series_order = 1
        existing_book.status = "Currently Reading"
        existing_book.current_page = 400
        existing_book.total_pages = 1007
        db.session.add(existing_book)
        db.session.commit()

    demo_books = [
        {
            "title": "The Final Empire",
            "author": "Brandon Sanderson",
            "series_name": "Mistborn",
            "series_order": 1,
            "status": "Currently Reading",
            "current_page": 100,
            "total_pages": 541,
        },
        {
            "title": "Fourth Wing",
            "author": "Rebecca Yarros",
            "series_name": "The Empyrean",
            "series_order": 1,
            "status": "Want to Read",
            "current_page": 0,
            "total_pages": 512,
        },
        {
            "title": "Iron Flame",
            "author": "Rebecca Yarros",
            "series_name": "The Empyrean",
            "series_order": 2,
            "status": "Want to Read",
            "current_page": 0,
            "total_pages": 640,
        },
        {
            "title": "Spark of the Everflame",
            "author": "Penn Cole",
            "series_name": "Kindred's Curse Saga",
            "series_order": 1,
            "status": "Completed",
            "current_page": 576,
            "total_pages": 576,
        },
        {
            "title": "Glow of the Everflame",
            "author": "Penn Cole",
            "series_name": "Kindred's Curse Saga",
            "series_order": 2,
            "status": "Completed",
            "current_page": 640,
            "total_pages": 640,
        },
    ]

    for book_data in demo_books:
        seeded_book = Book.query.filter_by(
            user_id=user.id,
            title=book_data["title"],
            author=book_data["author"],
        ).first()
        if seeded_book is None:
            seeded_book = Book()
            seeded_book.user_id = user.id
            seeded_book.title = book_data["title"]
            seeded_book.author = book_data["author"]
            seeded_book.series_name = book_data["series_name"]
            seeded_book.series_order = book_data["series_order"]
            seeded_book.status = book_data["status"]
            seeded_book.current_page = book_data["current_page"]
            seeded_book.total_pages = book_data["total_pages"]
            db.session.add(seeded_book)
    db.session.commit()

    existing_note = Note.query.filter_by(
        user_id=user.id,
        book_id=existing_book.id,
        chapter_num=1,
        note_type="Character Note",
    ).first()
    if existing_note is None:
        note1 = Note()
        note1.user_id = user.id
        note1.book_id = existing_book.id
        note1.chapter_num = 1
        note1.note_type = "Character Note"
        note1.content = "Kaladin stormblessed introduced in the slave wagon."

        db.session.add(note1)
        db.session.commit()

        print("Database seeded successfully!")
    else:
        print("Demo book and note already seeded!")
