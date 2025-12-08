FROM python:3.12

WORKDIR /app

RUN apt update && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

COPY . .

CMD ["python3", "main.py"]