# Sử dụng image Python 3.10-slim để giảm kích thước (Khuyến nghị)
FROM python:3.12

## Thiết lập thư mục làm việc trong container
WORKDIR /app
#
## Sao chép các file yêu cầu (Đây là lớp cache tốt nhất)
COPY requirements.txt .
#RUN pip install --no-cache-dir -r requirements.txt

COPY best.pt .
COPY main.py .
COPY .env .
COPY python-subscriber-key.json .

#CMD ["python3", "main.py"]