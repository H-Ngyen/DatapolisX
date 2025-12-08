# Contributing to DatapolisX

Cảm ơn bạn đã quan tâm đến việc đóng góp cho DatapolisX! 🎉

## 📋 Mục lục

- [Code of Conduct](#code-of-conduct)
- [Bắt đầu](#bắt-đầu)
- [Cấu trúc Dự án](#cấu-trúc-dự-án)
- [Quy trình Phát triển](#quy-trình-phát-triển)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request](#pull-request)
- [Báo cáo Lỗi](#báo-cáo-lỗi)

## 📜 Code of Conduct

- Tôn trọng mọi người đóng góp
- Chấp nhận phản hồi mang tính xây dựng
- Tập trung vào điều tốt nhất cho cộng đồng
- Thể hiện sự đồng cảm với các thành viên khác

## 🚀 Bắt đầu

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/DatapolisX.git
cd DatapolisX
```

### 2. Setup Backend (Python)

```bash
cd AnalysisWorker

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows

# Install dependencies cho từng service
cd camera-ingest && pip install -r requirements.txt
cd ../image-process && pip install -r requirements.txt
cd ../image-predict && pip install -r requirements.txt
```

### 3. Setup Frontend (Node.js)

```bash
cd web
npm install
```

### 4. Setup Infrastructure

```bash
# MinIO
docker-compose -f AnalysisWorker/minio-compose.yml up -d

# PostgreSQL
docker-compose -f AnalysisWorker/postgres-service-compose.yml up -d
psql -U postgres -d datapolisx -f AnalysisWorker/init-scripts/schema.sql

# Google Cloud Pub/Sub
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

## 📁 Cấu trúc Dự án

```
DatapolisX/
├── AnalysisWorker/     # Backend Python services
│   ├── camera-ingest/  # Camera data collection
│   ├── image-process/  # YOLO object detection
│   └── image-predict/  # ML traffic prediction
│
└── web/                # Frontend Next.js application
    ├── src/app/        # Pages & API routes
    ├── src/lib/        # Utilities
    └── src/prisma/     # Database schema
```

## 🔄 Quy trình Phát triển

### 1. Tạo Branch

```bash
git checkout -b feature/ten-tinh-nang
# hoặc
git checkout -b fix/ten-loi
```

**Quy tắc đặt tên branch:**
- `feature/` - Tính năng mới
- `fix/` - Sửa lỗi
- `docs/` - Cập nhật tài liệu
- `refactor/` - Refactor code
- `perf/` - Cải thiện performance
- `test/` - Thêm/sửa tests

### 2. Thực hiện Thay đổi

**Backend (Python):**
- Tuân thủ PEP 8
- Sử dụng type hints
- Viết docstrings
- Test với data thật

**Frontend (TypeScript):**
- Tuân thủ ESLint rules
- Sử dụng TypeScript strict mode
- Component-based architecture
- Responsive design

### 3. Commit Changes

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(camera-ingest): thêm retry logic"
git commit -m "fix(web): sửa lỗi hiển thị SI score"
git commit -m "docs: cập nhật README với setup guide"
```

**Commit types:**
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Thay đổi tài liệu
- `style`: Format code (không ảnh hưởng logic)
- `refactor`: Refactor code
- `perf`: Cải thiện performance
- `test`: Thêm/sửa tests
- `chore`: Công việc bảo trì

### 4. Push & Pull Request

```bash
git push origin feature/ten-tinh-nang
```

Tạo Pull Request trên GitHub với mô tả chi tiết.

## 💻 Coding Standards

### Python (Backend)

**Style Guide:**
```python
# ✅ Good
def process_image(image_data: bytes, camera_id: str) -> dict:
    """Process image with YOLO detection.
    
    Args:
        image_data: Raw image bytes
        camera_id: Camera identifier
        
    Returns:
        Detection results dictionary
    """
    results = model(image_data)
    return {"status": "success", "detections": results}

# ❌ Bad
def processImage(imageData,cameraId):
    results=model(imageData)
    return {"status":"success","detections":results}
```

**Naming:**
- Functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private: `_leading_underscore`

### TypeScript (Frontend)

**Style Guide:**
```typescript
// ✅ Good
interface TrafficData {
  id: string;
  siScore: number;
  changePercent: number;
}

export default function TrafficCard({ data }: { data: TrafficData }) {
  return <div>{data.siScore}</div>;
}

// ❌ Bad
export default function TrafficCard({ data }) {
  return <div>{data.si_score}</div>;
}
```

**Naming:**
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case` hoặc `camelCase`

### Error Handling

**Python:**
```python
try:
    result = process_data()
except ValueError as e:
    logger.error(f"Invalid data: {e}")
    raise
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    return {"status": "error", "message": str(e)}
```

**TypeScript:**
```typescript
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error('Failed to fetch:', error);
  throw new Error('Data fetch failed');
}
```

## 🧪 Testing

### Backend Testing

```bash
# Test Camera Ingest
cd AnalysisWorker/camera-ingest
python main.py

# Test Image Process
cd ../image-process
python main.py

# Test Prediction
cd ../image-predict
python predict.py
```

**Verify:**
- MinIO có ảnh mới
- PostgreSQL có records mới
- Logs không có errors

### Frontend Testing

```bash
cd web

# Development
npm run dev

# Build test
npm run build

# Lint
npm run lint
```

**Verify:**
- UI hiển thị đúng
- API calls thành công
- No TypeScript errors
- Responsive trên mobile

## 🔀 Pull Request

### Checklist

- [ ] Code tuân thủ coding standards
- [ ] Đã test thủ công
- [ ] Không có lỗi TypeScript/Python
- [ ] Đã cập nhật README (nếu cần)
- [ ] Commit messages tuân thủ Conventional Commits
- [ ] Không có credentials trong code
- [ ] Branch đã được rebase với main

### PR Template

```markdown
## Mô tả

Mô tả ngắn gọn về thay đổi.

## Component ảnh hưởng

- [ ] Camera Ingest
- [ ] Image Process
- [ ] Image Predict
- [ ] Web Frontend

## Loại thay đổi

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Mô tả cách test:
- [ ] Test với data thật
- [ ] Test error cases
- [ ] Verify database
- [ ] Check UI/UX

## Screenshots

Thêm screenshots nếu thay đổi UI.

## Related Issues

Closes #123
```

## 🐛 Báo cáo Lỗi

### Bug Report Template

```markdown
## Component

Camera Ingest / Image Process / Image Predict / Web Frontend

## Mô tả lỗi

Mô tả rõ ràng về lỗi.

## Các bước tái hiện

1. Chạy service X
2. Thực hiện action Y
3. Thấy lỗi Z

## Kết quả mong đợi

Mô tả điều gì nên xảy ra.

## Kết quả thực tế

Mô tả điều gì đã xảy ra.

## Logs

```
[Paste error logs]
```

## Môi trường

- OS: Windows/Linux/Mac
- Python: 3.10/3.11/3.12
- Node.js: 18.x/20.x
- Browser: Chrome/Firefox/Safari

## Thông tin bổ sung

Database size, MinIO storage, etc.
```

## 💡 Đề xuất Tính năng

```markdown
## Tính năng đề xuất

Mô tả tính năng mới.

## Lý do

Tại sao cần tính năng này?

## Giải pháp đề xuất

Cách tính năng sẽ hoạt động.

## Alternatives

Các giải pháp thay thế đã xem xét.

## Mockups

Thêm wireframes/mockups nếu có.
```

## 📚 Best Practices

### Backend (Python)

- Sử dụng `asyncio` cho I/O operations
- Implement retry logic với exponential backoff
- Cleanup resources (close connections)
- Use context managers (`with` statement)
- Log errors với context đầy đủ

### Frontend (TypeScript)

- Component composition over inheritance
- Custom hooks cho reusable logic
- Error boundaries cho error handling
- Memoization cho performance
- Accessibility compliance (ARIA labels)

### Database

- Use prepared statements
- Index frequently queried columns
- Validate input data
- Handle connection errors
- Monitor query performance

### Security

- **KHÔNG** commit credentials
- Use environment variables
- Validate all inputs
- Sanitize SQL queries
- Use HTTPS for APIs

## 📞 Liên hệ

- **GitHub Issues**: [Create an issue](https://github.com/H-Ngyen/DatapolisX/issues)
- **GitHub Discussions**: [Join discussion](https://github.com/H-Ngyen/DatapolisX/discussions)

---

Happy Coding! 🚀

Made with ❤️ for OLP 2025
