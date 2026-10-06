FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_PATH=/data/db.sqlite3

RUN useradd --system --create-home --uid 10001 app \
    && mkdir /data && chown app:app /data

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Build-time only values: collectstatic needs settings to import.
RUN SECRET_KEY=build-only DEBUG=False python manage.py collectstatic --noinput \
    && chown -R app:app /app

USER app
VOLUME ["/data"]
EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile -"]
