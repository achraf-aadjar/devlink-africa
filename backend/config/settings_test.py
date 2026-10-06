"""Settings used by pytest: never touches a real .env file.

Tests run on PostgreSQL when DB_ENGINE=postgresql is set explicitly (CI),
otherwise on an in-memory SQLite database.
"""

import os

os.environ.setdefault("SECRET_KEY", "test-only-secret-key")
os.environ["DEBUG"] = "True"
if os.environ.get("DB_ENGINE") != "postgresql":
    os.environ["DB_ENGINE"] = "sqlite"
    os.environ["DATABASE_PATH"] = ":memory:"

from .settings import *  # noqa: E402,F401,F403
