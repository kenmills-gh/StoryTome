# StoryTome

StoryTome is a full-stack reading tracker for organizing a personal bookshelf, tracking page progress, and keeping notes tied to each book. It uses a React/Vite client and a Flask API backed by SQLAlchemy. Flask cookie sessions authenticate users; each user's books and notes are private to that account.

## Requirements

- Python 3.13
- Pipenv
- Node.js and npm

## Development Setup

1. In `server/`, install backend dependencies and configure environment variables:

	```powershell
	cd server
	pipenv install
	Copy-Item .env.example .env
	```

	Set `SECRET_KEY` in `server/.env` to a unique random value. The default database is a SQLite file under `server/instance/`.

2. Initialize the database and start Flask:

	```powershell
	pipenv run flask --app app db upgrade
	pipenv run flask --app app run --port 5555
	```

	If the database already contains tables created by `seed.py` or `db.create_all()`, back it up first and run `pipenv run flask --app app db stamp head` instead of `db upgrade` to mark that matching schema as migrated.

3. In another terminal, install client dependencies and start Vite:

	```powershell
	cd client
	npm install
	npm run dev
	```

	Open the URL printed by Vite, usually `http://localhost:5173`.

For a local demo dataset, run `pipenv run python seed.py` from `server/`. It creates a development account (`demo_user` / `password123`); never use this seeded account in a deployed environment.

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `APP_ENV` | Set to `production` to require a configured secret and secure session cookies. | `development` |
| `SECRET_KEY` | Signs Flask session cookies. Required in production. | Development-only value |
| `DATABASE_URI` | SQLAlchemy database URL. | Local SQLite database |
| `CLIENT_ORIGINS` | Comma-separated allowed browser origins when cross-origin hosting is used. | Local Vite origins |
| `VITE_API_BASE_URL` | Client API base path or URL. | `/api` |

Keep secrets in environment variables. Do not commit `.env` files.

## API Routes

Authentication routes are under `/api/auth`:

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Create an account and start a session. |
| `POST` | `/api/auth/login` | Authenticate and start a session. |
| `DELETE` | `/api/auth/logout` | End the active session. |
| `GET` | `/api/auth/me` | Return the active user. |

Authenticated resource routes:

| Method | Route | Purpose |
|---|---|---|
| `GET`, `POST` | `/api/books` | List the current user's books or create a book. |
| `GET`, `PATCH`, `DELETE` | `/api/books/<id>` | Read, update, or delete an owned book. |
| `GET`, `POST` | `/api/notes` | List owned notes (optionally by `book_id`) or create a note for an owned book. |
| `GET`, `PATCH`, `DELETE` | `/api/notes/<id>` | Read, update, or delete an owned note. |
| `GET` | `/api/health` | API health check. |

## Checks

From `server/`, run backend authorization tests:

```powershell
pipenv run python -m unittest discover -s tests -v
```

From `client/`, run frontend checks:

```powershell
npm run lint
npm run build
```

## Production Notes

Set `APP_ENV=production`, provide a strong `SECRET_KEY`, and set `DATABASE_URI`. Prefer serving the client and API from the same site (for example, behind a reverse proxy); `CLIENT_ORIGINS` only configures CORS and does not make cross-site session cookies work. Serve the API over HTTPS; secure session cookies are enabled in production. Run migrations with `flask --app app db upgrade` as part of deployment.

Run Flask behind a production WSGI server, for example `pipenv run gunicorn -w 2 -b 0.0.0.0:5555 app:app` from `server/`; terminate HTTPS at your hosting platform or reverse proxy.