import unittest
import os

os.environ["DATABASE_URI"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "storytome-test-secret"

from app import app
from config import db
from models import Book, Note, User
from sqlalchemy.exc import SQLAlchemyError


class ApiOwnershipTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config.update(
            TESTING=True,
            SECRET_KEY="test-secret-key",
            SQLALCHEMY_DATABASE_URI="sqlite://",
        )
        cls.app_context = app.app_context()
        cls.app_context.push()
        if db.engine.dialect.name != "sqlite":
            raise RuntimeError("API tests must use an isolated SQLite database.")
        db.create_all()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        cls.app_context.pop()

    def setUp(self):
        db.session.remove()
        db.drop_all()
        db.create_all()
        self.client = app.test_client()
        self.first_user = self._create_user("reader_one")
        self.second_user = self._create_user("reader_two")

    def _create_user(self, username):
        user = User(username=username, email=f"{username}@example.com")
        user.password = "password123"
        db.session.add(user)
        db.session.commit()
        return user

    def _login(self, username):
        return self.client.post(
            "/api/auth/login",
            json={"username": username, "password": "password123"},
        )

    def test_resource_routes_require_authentication(self):
        self.assertEqual(self.client.get("/api/books").status_code, 401)
        self.assertEqual(self.client.get("/api/notes").status_code, 401)

    def test_http_errors_return_json(self):
        missing = self.client.get("/api/books/not-an-integer")
        self.assertEqual(missing.status_code, 404)
        self.assertIn("error", missing.get_json())

        unsupported = self.client.put("/api/books")
        self.assertEqual(unsupported.status_code, 405)
        self.assertIn("error", unsupported.get_json())

    def test_database_errors_return_generic_json(self):
        with app.test_request_context("/api/books"):
            response = app.handle_user_exception(
                SQLAlchemyError("sensitive database detail")
            )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.get_json(), {"error": "A database error occurred."})

    def test_signup_login_session_and_logout_flow(self):
        signup = self.client.post(
            "/api/auth/signup",
            json={
                "username": "new_reader",
                "email": "new_reader@example.com",
                "password": "password123",
            },
        )
        self.assertEqual(signup.status_code, 201)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

        self.assertEqual(self.client.delete("/api/auth/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        self.assertEqual(self._login("new_reader").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    def test_book_creation_uses_session_user_and_hides_other_users_books(self):
        self.assertEqual(self._login("reader_one").status_code, 200)
        response = self.client.post(
            "/api/books",
            json={"title": "A Book", "author": "An Author", "total_pages": 120},
        )
        self.assertEqual(response.status_code, 201)
        book_id = response.get_json()["id"]
        book = db.session.get(Book, book_id)
        self.assertEqual(book.user_id, self.first_user.id)

        self._login("reader_two")
        self.assertEqual(self.client.get("/api/books").get_json(), [])
        self.assertEqual(self.client.get(f"/api/books/{book_id}").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/books/{book_id}").status_code, 404)

    def tearDown(self):
        db.session.remove()

    def test_owner_can_update_book_but_cannot_assign_it_to_another_user(self):
        self._login("reader_one")
        created = self.client.post(
            "/api/books",
            json={"title": "A Book", "author": "An Author", "total_pages": 120},
        )
        book_id = created.get_json()["id"]
        updated = self.client.patch(
            f"/api/books/{book_id}",
            json={"current_page": 40, "status": "Currently Reading"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["current_page"], 40)
        self.assertEqual(self.client.get(f"/api/books/{book_id}").status_code, 200)
        self.assertEqual(
            self.client.patch(
                f"/api/books/{book_id}", json={"user_id": self.second_user.id}
            ).status_code,
            400,
        )
        self.assertEqual(self.client.delete(f"/api/books/{book_id}").status_code, 200)
        self.assertEqual(self.client.get(f"/api/books/{book_id}").status_code, 404)

    def test_notes_are_owned_by_the_authenticated_user(self):
        book = Book(user_id=self.first_user.id, title="A Book", author="An Author")
        db.session.add(book)
        db.session.commit()
        self._login("reader_one")
        response = self.client.post(
            "/api/notes",
            json={
                "book_id": book.id,
                "content": "A private recap",
                "note_type": "Chapter Recap",
                "chapter_num": 1,
            },
        )
        self.assertEqual(response.status_code, 201)
        note_id = response.get_json()["id"]
        self.assertEqual(db.session.get(Note, note_id).user_id, self.first_user.id)
        self.assertEqual(response.get_json()["note_type"], "Chapter Recap")
        self.assertEqual(self.client.get("/api/notes").get_json()[0]["id"], note_id)
        self.assertEqual(self.client.get(f"/api/notes/{note_id}").status_code, 200)
        updated = self.client.patch(
            f"/api/notes/{note_id}", json={"content": "Updated private note"}
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["content"], "Updated private note")

        self._login("reader_two")
        self.assertEqual(self.client.get("/api/notes").get_json(), [])
        self.assertEqual(
            self.client.post(
                "/api/notes", json={"book_id": book.id, "content": "Not allowed"}
            ).status_code,
            404,
        )
        self.assertEqual(self.client.get(f"/api/notes/{note_id}").status_code, 404)
        self.assertEqual(
            self.client.patch(
                f"/api/notes/{note_id}", json={"content": "Changed"}
            ).status_code,
            404,
        )
        self.assertEqual(self.client.delete(f"/api/notes/{note_id}").status_code, 404)

        self._login("reader_one")
        self.assertEqual(self.client.delete(f"/api/notes/{note_id}").status_code, 200)
        self.assertEqual(self.client.get(f"/api/notes/{note_id}").status_code, 404)


if __name__ == "__main__":
    unittest.main()
