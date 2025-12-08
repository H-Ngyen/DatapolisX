# DatapolisX - Hệ thống Giám sát Giao thông Thông minh

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

Hệ thống giám sát và phân tích giao thông thời gian thực cho TP. Hồ Chí Minh, sử dụng AI để dự đoán tình trạng giao thông và cung cấp thông tin thời tiết tích hợp.

## 🌟 Tính năng

- 📊 **Dashboard Giao thông**: Xếp hạng các điểm tắc nghẽn theo chỉ số SI (Severity Index)
- 🎥 **Giám sát Camera**: Xem trực tiếp camera giao thông từ hệ thống TPHCM
- 🤖 **AI Dự đoán**: Dự báo xu hướng giao thông dựa trên machine learning
- 🌤️ **Thông tin Thời tiết**: Tích hợp AI (Google Gemini) để cung cấp thông tin thời tiết và lời khuyên giao thông
- 🔍 **Tìm kiếm Camera**: Tìm kiếm camera theo địa điểm hoặc mã camera
- 📱 **Responsive Design**: Giao diện tối ưu cho mọi thiết bị

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React (icons)
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **AI Integration**: Google Generative AI (Gemini)

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Linting**: ESLint 9
- **Code Quality**: TypeScript strict mode

## 📋 Yêu cầu hệ thống

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0
- Git

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/H-Ngyen/DatapolisX.git
cd DatapolisX/web
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
# Client Side
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_TIMEZONE=Asia/Ho_Chi_Minh
NEXT_PUBLIC_LOCALE=vi-VN
NEXT_PUBLIC_TIME_UPDATE_INTERVAL=60000

# Server Side
DATABASE_URL='postgresql://user:password@localhost:5432/datapolisx'

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

### 4. Thiết lập Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx tsx src/prisma/seed.ts
```

### 5. Chạy Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📦 Build Production

```bash
# Build ứng dụng
npm run build

# Chạy production server
npm start
```

## 📁 Cấu trúc thư mục

```
web/
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── api/        # API routes
│   │   │   ├── dashboard/  # Dashboard API
│   │   │   └── weather/    # Weather AI API
│   │   ├── search/     # Search pages
│   │   ├── globals.css # Global styles
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── assets/         # JSON data files
│   ├── controllers/    # Business logic
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   │   ├── errorHandler.ts
│   │   ├── exceptions.ts
│   │   ├── logger.ts
│   │   ├── prisma.ts
│   │   ├── types.ts
│   │   └── validations.ts
│   ├── generated/      # Prisma generated files
│   └── prisma/         # Database schema & migrations
├── .env.example        # Environment variables template
├── next.config.ts      # Next.js configuration
├── package.json        # Dependencies
├── prisma.config.ts    # Prisma configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## 🔑 API Endpoints

### GET `/api/dashboard`
Lấy dữ liệu dashboard với thông tin giao thông của tất cả camera.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "camera_id",
      "si_score": 85,
      "composition": { "primary": "car" },
      "change_percent": 15
    }
  ]
}
```

### POST `/api/weather`
Lấy thông tin thời tiết và địa chỉ cho một địa điểm.

**Request:**
```json
{
  "location": "Đường Võ Văn Ngân",
  "traffic": {
    "si_score": 85,
    "change_percent": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": { ... },
    "weather": { ... }
  }
}
```

## 🧪 Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm start        # Chạy production server
npm run lint     # Chạy ESLint
```

## 🗃️ Database Schema

### `camera_detections`
Lưu trữ dữ liệu phát hiện từ camera (từ AnalysisWorker).

### `camera_predictions`
Lưu trữ dự đoán giao thông từ ML model.

Chi tiết schema: `src/prisma/schema.prisma`

## 🤝 Contributing

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách đóng góp cho dự án.

## 📄 License

Dự án này được phát hành dưới giấy phép [MIT License](../LICENSE).

## 👥 Tác giả

**DatapolisX Team** - Cuộc thi Phần mềm Nguồn mở - OLP 2025

- GitHub: [@H-Ngyen](https://github.com/H-Ngyen)
- Trường: Đại học Văn Lang

## 🙏 Acknowledgments

- Dữ liệu camera từ [Sở Giao thông Vận tải TP.HCM](https://giaothong.hochiminhcity.gov.vn/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- UI Icons by [Lucide](https://lucide.dev/)

## 📞 Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng tạo [Issue](https://github.com/H-Ngyen/DatapolisX/issues) trên GitHub.

---

Made with ❤️ for OLP 2025
