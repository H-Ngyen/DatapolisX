# DatapolisX

**DatapolisX** is an intelligent traffic monitoring system that leverages AI to analyze traffic flow from CCTV cameras in real-time. It provides actionable insights, traffic prediction, and visualization through a modern web dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

## 🏗 Architecture

The system follows a microservices architecture separating data ingestion, processing, storage, and presentation.

![architecture](https://github.com/user-attachments/assets/1f40160b-1d87-4d8b-8e7f-9298070947e2)


## 🛠 Tech Stack

*   **Frontend:** Next.js 14, React, Tailwind CSS, TypeScript.
*   **Backend Services:** Python 3.10+.
*   **AI/ML:** YOLOv11 (Object Detection), Scikit-learn (Prediction).
*   **Infrastructure:** Docker, Docker Compose.
*   **Storage:** PostgreSQL (Data), MinIO (Images).
*   **Message Queue:** Google Cloud Pub/Sub.

## 🚀 Getting Started

> **Note:** This project requires **PostgreSQL**, **MinIO**, and **Google Cloud Pub/Sub** credentials to function fully.

### Installation

For a detailed, step-by-step guide on setting up the environment, database, and running the services locally, please read our **[Installation Guide](docs/INSTALL.md)**.

### Quick Summary

1.  **Infrastructure:** Start PostgreSQL & MinIO via Docker Compose.
2.  **Web App:** Setup `.env`, run Prisma migrations, and start Next.js (`npm run dev`).
3.  **Workers:** Setup Python environment, configure Google Cloud credentials, and run the worker scripts.

```bash
# Check the full guide for commands!
# docs/INSTALL.md
```

## 📂 Project Structure

```bash
DatapolisX/
├── AnalysisWorker/       # Python Microservices
│   ├── camera-ingest/    # Pulls images from cameras
│   ├── image-process/    # YOLO detection & MinIO upload
│   ├── image-predict/    # Traffic prediction models
│   └── *.yml             # Docker Compose files for infrastructure
├── web/                  # Next.js Web Application
│   ├── src/              # Source code
│   └── prisma/           # Database schema & migrations
└── docs/                 # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

### Contact

- Nguyen Ngo Hoang Nguyen: hoangnguyennn0210@gmail.com
- Cao Phan Khai: caophankhai2004@gmail.com
- Nguyen Khac Minh Tan: devmind.tan@gmail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
