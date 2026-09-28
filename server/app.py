from config import app, db
from flask import jsonify
from models import users, note, book
from routes.books import books_bp


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "StoryTome API active"}), 200


# Register Blueprints
app.register_blueprint(books_bp)


@app.route("/")
def index():
    return jsonify({"message": "Welcome to StoryTome API"}), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Database tables initialized successfully!")

    app.run(port=5555, debug=True)
