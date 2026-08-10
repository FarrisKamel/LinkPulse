# LinkPulse backend image (development).
FROM python:3.12-slim

WORKDIR /app

# Copy the whole backend (minus .dockerignore entries) and install it editable
# into the image's system Python. Deps land in site-packages, which the runtime
# bind-mount of the source does NOT shadow — so hot-reload works while deps stay.
COPY . .
RUN pip install --no-cache-dir -e ".[dev]"

EXPOSE 8000

# Default command. docker-compose overrides this to run migrations first.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
