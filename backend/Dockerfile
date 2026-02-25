FROM python:3.11-slim

WORKDIR /app

# Install build deps then runtime deps from requirements.txt
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app sources
COPY . /app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "gemini_backend:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
