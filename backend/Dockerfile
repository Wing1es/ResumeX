FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        texlive-latex-base \
        texlive-fonts-recommended \
        texlive-latex-extra \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Start Uvicorn
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"
