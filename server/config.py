import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

load_dotenv()

app = Flask(__name__)

# Resolve absolute path with forward slashes for Windows SQLite compatibility
BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)

DB_PATH = INSTANCE_DIR / "storytome.db"
DEFAULT_DB_URI = f"sqlite:///{DB_PATH.as_posix()}"

# Core Configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret_key_storytome_2026")
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "jwt_dev_secret_key_storytome_2026"
)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI", DEFAULT_DB_URI)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize Extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)
CORS(app, resources={r"/api/*": {"origins": "*"}})
