# AnalysisWorker - DatapolisX Backend Services

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)

Backend services xử lý dữ liệu giao thông cho DatapolisX, bao gồm thu thập ảnh từ camera, phát hiện đối tượng bằng YOLO, và dự đoán giao thông bằng Machine Learning.

## 🏗️ Kiến trúc

```
AnalysisWorker/
├── camera-ingest/      # Thu thập ảnh từ camera TPHCM
├── image-process/      # Xử lý ảnh với YOLO + lưu DB
├── image-predict/      # ML model dự đoán giao thông
└── init-scripts/       # Database initialization
```

## 📦 Services

### 1. Camera Ingest Service
Thu thập ảnh từ 20 camera giao thông TPHCM theo chu kỳ 10 giây.

**Chức năng:**
- Pull ảnh từ API giao thông TPHCM
- Upload lên MinIO (S3-compatible storage)
- Publish message lên Google Pub/Sub

**Tech Stack:**
- `aiohttp` - Async HTTP requests
- `boto3` - MinIO/S3 client
- `google-cloud-pubsub` - Message queue

### 2. Image Process Service
Xử lý ảnh với YOLO object detection và lưu kết quả vào PostgreSQL.

**Chức năng:**
- Subscribe từ Pub/Sub queue
- Download ảnh từ MinIO
- Phát hiện phương tiện với YOLOv8
- Lưu kết quả vào PostgreSQL
- Xóa ảnh đã xử lý khỏi MinIO

**Tech Stack:**
- `ultralytics` - YOLOv8
- `psycopg` - PostgreSQL client
- `minio` - MinIO client
- `torch` - Deep learning framework

### 3. Image Predict Service
Dự đoán lưu lượng giao thông 30 phút tương lai bằng Random Forest.

**Chức năng:**
- Lấy dữ liệu lịch sử từ PostgreSQL
- Feature engineering (time features, lag features)
- Dự đoán với Random Forest model
- Lưu kết quả dự đoán vào DB

**Tech Stack:**
- `scikit-learn` - Machine Learning
- `pandas` - Data processing
- `SQLAlchemy` - ORM

## 🚀 Cài đặt

### Yêu cầu hệ thống

- Python 3.10+
- PostgreSQL 14+
- MinIO (hoặc S3)
- Google Cloud Pub/Sub
- CUDA 12.x (cho GPU acceleration - optional)

### 1. Clone repository

```bash
git clone https://github.com/H-Ngyen/DatapolisX.git
cd DatapolisX/AnalysisWorker
```

### 2. Cài đặt Camera Ingest

```bash
cd camera-ingest
pip install -r requirements.txt
```

Tạo file `.env`:
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
PUBSUB_TOPIC_ID=image-ingest-topic
```

Chạy service:
```bash
python main.py
```

### 3. Cài đặt Image Process

```bash
cd image-process
pip install -r requirements.txt
```

Tải YOLO model:
- Đặt file `best.pt` (YOLOv8 trained model) vào thư mục `image-process/`

Tạo file `.env`:
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
PUBSUB_SUBSCRIPTION_ID=projects/message-queue-479804/subscriptions/image-process-sub
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost:5432/datapolisx
```

Chạy service:
```bash
python main.py
```

### 4. Cài đặt Image Predict

```bash
cd image-predict
pip install -r requirements.txt
```

Tạo file `.env`:
```env
DB_CONNECTION_STRING=postgresql://user:password@localhost:5432/datapolisx
```

**Train model (lần đầu):**
```bash
python train.py
```

**Chạy prediction service:**
```bash
python predict.py
```

## 🗄️ Database Setup

### Khởi tạo Database

```bash
psql -U postgres -d datapolisx -f init-scripts/schema.sql
```

### Schema

**camera_detections** - Lưu kết quả phát hiện từ YOLO
```sql
CREATE TABLE camera_detections (
    id SERIAL PRIMARY KEY,
    minio_key VARCHAR(255) UNIQUE NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    detections JSONB,
    total_objects INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
```

**camera_predictions** - Lưu dự đoán từ ML model
```sql
CREATE TABLE camera_predictions (
    id SERIAL PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    forecast_timestamp TIMESTAMPTZ NOT NULL,
    predicted_total_objects FLOAT NOT NULL,
    minutes_resample SMALLINT NOT NULL,
    prediction_time TIMESTAMPTZ DEFAULT NOW()
);
```

## 🐳 Docker Compose

### MinIO
```bash
docker-compose -f minio-compose.yml up -d
```

### PostgreSQL
```bash
docker-compose -f postgres-service-compose.yml up -d
```

### Image Process
```bash
docker-compose -f image-process-compose.yml up -d
```

## 📊 Data Flow

```
Camera API → Camera Ingest → MinIO → Pub/Sub
                                        ↓
                              Image Process → PostgreSQL
                                        ↓
                              Image Predict → PostgreSQL
                                        ↓
                                    Web API
```

## 🔧 Configuration

### Camera List
Danh sách 20 camera được cấu hình trong `camera-ingest/main.py`:
```python
CAMERA_LIST = [
    '662b86c41afb9c00172dd31c',
    '5a6065c58576340017d06615',
    # ... 18 cameras khác
]
```

### YOLO Model
- Model: YOLOv8 custom trained
- Classes: `motorbike`, `car`, `truck`, `bus`, `container`
- Input: 640x640
- File: `best.pt`

### ML Model
- Algorithm: Random Forest Regressor
- Features: Time features + Lag features (1,2,3) + Camera one-hot encoding
- Prediction window: 30 minutes (3 steps x 10 minutes)
- Update frequency: Every 30 minutes

## 🧪 Testing

### Test Camera Ingest
```bash
cd camera-ingest
python main.py
# Kiểm tra MinIO bucket 'images' có ảnh mới
```

### Test Image Process
```bash
cd image-process
# Clear old messages
python clear-message.py

# Run processor
python main.py
# Kiểm tra PostgreSQL table 'camera_detections'
```

### Test Prediction
```bash
cd image-predict
python predict.py
# Kiểm tra PostgreSQL table 'camera_predictions'
```

## 📈 Performance

- **Camera Ingest**: 20 cameras / 10 seconds = 2 cameras/sec
- **Image Process**: ~2-3 seconds/image (with GPU)
- **Prediction**: ~5 seconds for 20 cameras x 3 steps

## 🐛 Troubleshooting

### MinIO Connection Error
```bash
# Kiểm tra MinIO đang chạy
docker ps | grep minio

# Test connection
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local
```

### Pub/Sub Authentication Error
```bash
# Set Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### YOLO Model Not Found
```bash
# Download model từ Google Drive hoặc train lại
# Đặt file best.pt vào image-process/
```

### Database Connection Error
```bash
# Kiểm tra PostgreSQL
psql -U postgres -d datapolisx -c "SELECT 1"

# Kiểm tra connection string trong .env
```

## 🤝 Contributing

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách đóng góp.

## 📄 License

Dự án này được phát hành dưới giấy phép [MIT License](../LICENSE).

## 👥 Tác giả

**DatapolisX Team** - Cuộc thi Phần mềm Nguồn mở - OLP 2025

## 🔗 Links

- [Web Frontend](../web/README.md)
- [Main Repository](https://github.com/H-Ngyen/DatapolisX)
- [Issues](https://github.com/H-Ngyen/DatapolisX/issues)

---

Made with ❤️ for OLP 2025
