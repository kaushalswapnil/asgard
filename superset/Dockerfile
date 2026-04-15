FROM python:3.9-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir apache-superset psycopg2-binary redis gunicorn flask-cors

WORKDIR /app

COPY superset_config.py /app/superset/
COPY bootstrap.sh /app/

CMD ["/bin/bash", "/app/bootstrap.sh"]
