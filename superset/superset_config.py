import os
from cachelib.redis import RedisCache

# Security
SECRET_KEY = "ebp-superset-secret-key-change-in-prod"
WTF_CSRF_ENABLED = False

# Database - Use PostgreSQL
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://ebpuser:ebppass@ebp-postgres:5432/ebpdb"

# Allow embedding via iframe from React frontend
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
}

# CORS - allow React frontend to call Superset API
ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": {"r/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}},
}

# Allow iframe embedding from our frontend
HTTP_HEADERS = {"X-Frame-Options": "ALLOWALL"}
TALISMAN_ENABLED = False

# Redis cache
CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_",
    "CACHE_REDIS_URL": "redis://ebp-redis:6379/0",
}

DATA_CACHE_CONFIG = CACHE_CONFIG

# Celery for async queries
class CeleryConfig:
    broker_url = "redis://ebp-redis:6379/1"
    result_backend = "redis://ebp-redis:6379/2"
    task_annotations = {"sql_lab.get_sql_results": {"rate_limit": "100/s"}}

CELERY_CONFIG = CeleryConfig

# Guest token config for embedding
GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = "ebp-guest-token-secret-change-in-prod"
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_HEADER_NAME = "X-GuestToken"
GUEST_TOKEN_JWT_EXP_SECONDS = 300
