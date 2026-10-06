"""Settings used by pytest: never touches a real .env or a real database file."""

import os

os.environ.setdefault("SECRET_KEY", "test-only-secret-key")
os.environ["DEBUG"] = "True"
os.environ["DATABASE_PATH"] = ":memory:"

from .settings import *  # noqa: E402,F401,F403
