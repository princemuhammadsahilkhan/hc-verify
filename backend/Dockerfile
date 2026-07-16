FROM python:3.11-slim

# Install system dependencies required for OpenCV / MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 to accept traffic outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
