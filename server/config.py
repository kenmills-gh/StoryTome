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
APP_ENV = os.getenv("APP_ENV", "development").lower()
SECRET_KEY = os.getenv("SECRET_KEY")
if APP_ENV == "production" and not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be configured in production.")

app.config["SECRET_KEY"] = SECRET_KEY or "dev-only-storytome-secret-key"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = APP_ENV == "production"
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI", DEFAULT_DB_URI)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize Extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)
allowed_origins = os.getenv(
    "CLIENT_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
CORS(app, supports_credentials=True, origins=[origin.strip() for origin in allowed_origins.split(",") if origin.strip()])
