# DatapolisX - Hệ thống Giám sát Giao thông Thông minh

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

Hệ thống giám sát và phân tích giao thông thời gian thực cho TP. Hồ Chí Minh, sử dụng AI để phát hiện phương tiện, dự đoán tình trạng giao thông và cung cấp thông tin thời tiết tích hợp.

**🏆 Dự án tham gia Cuộc thi Phần mềm Nguồn mở - OLP 2025**

---

## 🌟 Tính năng

### 🎯 Core Features
- **📊 Dashboard Thời gian thực**: Xếp hạng các điểm tắc nghẽn theo chỉ số SI (Severity Index)
- **🎥 Giám sát Camera**: Xem trực tiếp 20 camera giao thông từ hệ thống TPHCM
- **🤖 AI Object Detection**: Phát hiện và đếm phương tiện (xe máy, ô tô, xe tải, xe bus) bằng YOLOv8
- **📈 Dự đoán ML**: Dự báo lưu lượng giao thông 30 phút tương lai với Random Forest
- **🌤️ Thông tin Thời tiết AI**: Tích hợp Google Gemini để cung cấp thời tiết và lời khuyên giao thông
- **🔍 Tìm kiếm Camera**: Tìm kiếm camera theo địa điểm hoặc mã camera
- **📱 Responsive Design**: Giao diện tối ưu cho mọi thiết bị

### 🎨 UI/UX
- Modern, clean interface với Tailwind CSS
- Real-time updates
- Interactive charts và visualizations
- Dark mode support

---

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                     DatapolisX System                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Camera API      │      │   Google Cloud   │      │   Google Gemini  │
│  (TPHCM)         │      │   Pub/Sub        │      │   AI             │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AnalysisWorker                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Camera Ingest │→ │Image Process │→ │Image Predict │     │
│  │   (Python)   │  │   (YOLOv8)   │  │   (ML Model) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────┬────────────────────┬─────────────────────┬────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     MinIO       │  │   PostgreSQL    │  │   PostgreSQL    │
│  (S3 Storage)   │  │  (Detections)   │  │  (Predictions)  │
└─────────────────┘  └────────┬────────┘  └────────┬────────┘
                              │                     │
                              └──────────┬──────────┘
                                         ▼
                              ┌─────────────────────┐
                              │    Web Frontend     │
                              │   (Next.js + AI)    │
                              └─────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   End Users         │
                              │   (Browser)         │
                              └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend (AnalysisWorker)
- **Language**: Python 3.10+
- **AI/ML**: 
  - YOLOv8 (Ultralytics) - Object Detection
  - Random Forest (scikit-learn) - Traffic Prediction
- **Database**: PostgreSQL 14+
- **Storage**: MinIO (S3-compatible)
- **Message Queue**: Google Cloud Pub/Sub
- **Libraries**: 
  - `aiohttp` - Async HTTP
  - `boto3` - S3 client
  - `pandas` - Data processing
  - `torch` - Deep learning

### Frontend (Web)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via Prisma ORM)
- **AI Integration**: Google Generative AI (Gemini)
- **UI Components**: Lucide React

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Cloud Services**: Google Cloud Platform
- **Version Control**: Git & GitHub

---

## 📋 Yêu cầu Hệ thống

- **Node.js** >= 18.0.0
- **Python** >= 3.10
- **PostgreSQL** >= 14.0
- **Docker** & Docker Compose
- **Git**
- **CUDA** 12.x (optional, cho GPU acceleration)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/H-Ngyen/DatapolisX.git
cd DatapolisX
```

### 2. Setup Backend (AnalysisWorker)

```bash
cd AnalysisWorker

# Setup MinIO
docker-compose -f minio-compose.yml up -d

# Setup PostgreSQL
docker-compose -f postgres-service-compose.yml up -d
psql -U postgres -d datapolisx -f init-scripts/schema.sql

# Install & Run Camera Ingest
cd camera-ingest
pip install -r requirements.txt
cp .env.example .env  # Cấu hình .env
python main.py

# Install & Run Image Process
cd ../image-process
pip install -r requirements.txt
cp .env.example .env  # Cấu hình .env
python main.py

# Install & Run Image Predict
cd ../image-predict
pip install -r requirements.txt
cp .env.example .env  # Cấu hình .env
python predict.py
```

### 3. Setup Frontend (Web)

```bash
cd web

# Install dependencies
npm install

# Setup environment
cp .env.example .env  # Cấu hình .env

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### 4. Truy cập Ứng dụng

- **Web Dashboard**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432

---

## 📁 Cấu trúc Dự án

```
DatapolisX/
├── AnalysisWorker/          # Backend services
│   ├── camera-ingest/       # Thu thập ảnh từ camera
│   ├── image-process/       # Xử lý ảnh với YOLO
│   ├── image-predict/       # ML prediction
│   ├── init-scripts/        # Database scripts
│   ├── README.md
│   └── CONTRIBUTING.md
│
├── web/                     # Frontend application
│   ├── src/
│   │   ├── app/            # Next.js pages & API routes
│   │   ├── controllers/    # Business logic
│   │   ├── hooks/          # React hooks
│   │   ├── lib/            # Utilities
│   │   └── prisma/         # Database schema
│   ├── README.md
│   └── CONTRIBUTING.md
│
├── LICENSE                  # MIT License
└── README.md               # This file
```

---

## 📊 Data Flow

1. **Camera Ingest** pull ảnh từ 20 camera TPHCM mỗi 10 giây
2. Ảnh được upload lên **MinIO** và publish message lên **Pub/Sub**
3. **Image Process** subscribe message, download ảnh, chạy **YOLOv8** detection
4. Kết quả detection lưu vào **PostgreSQL** (camera_detections)
5. **Image Predict** lấy dữ liệu lịch sử, chạy **ML model** dự đoán 30 phút tương lai
6. Kết quả prediction lưu vào **PostgreSQL** (camera_predictions)
7. **Web Frontend** query database, hiển thị dashboard + tích hợp **Gemini AI** cho thời tiết

---

## 🎯 Chỉ số Giao thông (SI - Severity Index)

DatapolisX sử dụng chỉ số SI để đánh giá mức độ tắc nghẽn:

| SI Score | Trạng thái | Màu sắc | Mô tả |
|----------|-----------|---------|-------|
| 0-50 | Thông thoáng | 🟢 Green | Giao thông lưu thông tốt |
| 51-80 | Đông chậm | 🟡 Yellow | Bắt đầu có dấu hiệu đông |
| 81-95 | Ùn ứ | 🟠 Orange | Giao thông chậm lại đáng kể |
| 96-120 | Tắc nghẽn | 🔴 Red | Tắc nghẽn nghiêm trọng |
| >120 | Kẹt cứng | 🟣 Purple | Kẹt xe hoàn toàn |

**Công thức tính SI:**
```
SI = (Average PCU / Capacity) × 100

PCU (Passenger Car Unit):
- Xe máy: 0.25
- Ô tô: 1.0
- Xe tải/Bus: 2.5
```

---

## 🤖 AI & Machine Learning

### YOLOv8 Object Detection
- **Model**: YOLOv8 custom trained
- **Classes**: motorbike, car, truck, bus, container
- **Accuracy**: ~85% mAP
- **Speed**: 2-3 seconds/image (GPU)

### Random Forest Prediction
- **Features**: Time features + Lag features (1,2,3) + Camera encoding
- **Prediction Window**: 30 minutes (3 steps × 10 minutes)
- **Update Frequency**: Every 30 minutes
- **Accuracy**: MAE ~2-3 vehicles

### Google Gemini AI
- **Model**: Gemini 2.0 Flash
- **Use Case**: Weather info + Traffic advice
- **Response Time**: ~2-3 seconds

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Camera Detail
![Camera Detail](docs/screenshots/camera-detail.png)

### Search
![Search](docs/screenshots/search.png)

---

## 🧪 Testing

### Backend
```bash
cd AnalysisWorker/camera-ingest
python main.py  # Test camera pulling

cd ../image-process
python main.py  # Test YOLO detection

cd ../image-predict
python predict.py  # Test ML prediction
```

### Frontend
```bash
cd web
npm run dev     # Development server
npm run build   # Production build
npm run lint    # ESLint check
```

---

## 📈 Performance

- **Camera Ingest**: 20 cameras / 10 seconds
- **Image Process**: ~2-3 seconds/image (GPU)
- **ML Prediction**: ~5 seconds for 20 cameras
- **Web Response**: <500ms (API routes)
- **Dashboard Load**: <2 seconds

---

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Xem hướng dẫn chi tiết:

- [AnalysisWorker Contributing Guide](AnalysisWorker/CONTRIBUTING.md)
- [Web Contributing Guide](web/CONTRIBUTING.md)

### Quick Contribution Steps

1. Fork repository
2. Tạo branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## 📄 License

Dự án này được phát hành dưới giấy phép [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 DatapolisX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Team

**DatapolisX Team** - Đại học Văn Lang

Dự án tham gia **Cuộc thi Phần mềm Nguồn mở - OLP 2025**

---

## 🙏 Acknowledgments

- **Dữ liệu Camera**: [Sở Giao thông Vận tải TP.HCM](https://giaothong.hochiminhcity.gov.vn/)
- **AI Models**: 
  - [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
  - [Google Gemini](https://ai.google.dev/)
- **UI Icons**: [Lucide](https://lucide.dev/)
- **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

---

## 📞 Contact & Support

- **GitHub Issues**: [Create an issue](https://github.com/H-Ngyen/DatapolisX/issues)
- **GitHub Discussions**: [Join discussion](https://github.com/H-Ngyen/DatapolisX/discussions)
- **Email**: [Contact team](mailto:your-email@example.com)

---

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Camera data collection
- [x] YOLO object detection
- [x] ML traffic prediction
- [x] Web dashboard
- [x] AI weather integration

### Phase 2 (Planned) 🚧
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Historical data analysis
- [ ] Traffic heatmap
- [ ] Route optimization

### Phase 3 (Future) 🔮
- [ ] Multi-city support
- [ ] Advanced ML models (LSTM, Transformer)
- [ ] Integration with Google Maps
- [ ] Public API
- [ ] Community contributions

---

## 📚 Documentation

- [AnalysisWorker Documentation](AnalysisWorker/README.md)
- [Web Frontend Documentation](web/README.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=H-Ngyen/DatapolisX&type=Date)](https://star-history.com/#H-Ngyen/DatapolisX&Date)

---

<div align="center">

**Made with ❤️ for OLP 2025**

[⬆ Back to top](#datapolisx---hệ-thống-giám-sát-giao-thông-thông-minh)

</div>
