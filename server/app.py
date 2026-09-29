from config import app, db
from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

from models import User, Book, Note
from routes.books import books_bp
from routes.notes import notes_bp
from routes.auth import auth_bp


@app.errorhandler(HTTPException)
def handle_http_error(error):
    return jsonify({"error": error.description}), error.code or 500


@app.errorhandler(SQLAlchemyError)
def handle_database_error(error):
    db.session.rollback()
    app.logger.error("Database error while handling request")
    return jsonify({"error": "A database error occurred."}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "StoryTome API active"}), 200


# Register Blueprints
app.register_blueprint(books_bp)
app.register_blueprint(notes_bp)
app.register_blueprint(auth_bp)


@app.route("/")
def index():
    return jsonify({"message": "Welcome to StoryTome API"}), 200


if __name__ == "__main__":
    with app.app_context():
        print("Database tables initialized successfully!")

    app.run(port=5555, debug=True)
