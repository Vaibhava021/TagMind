
from .settings import *

DATABASES["default"]["NAME"] = BASE_DIR / "db_phase3_backup.sqlite3"

# Disable Django's test database replacement.
DATABASES["default"]["TEST"]["NAME"] = BASE_DIR / "db_phase3_backup.sqlite3"
