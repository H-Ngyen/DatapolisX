# Deployment Guide

This guide explains how to deploy DatapolisX services using Docker Compose.

## Infrastructure Services

The system relies on core infrastructure defined in `AnalysisWorker/*-compose.yml`.

### 1. Database & Storage
Start the database and object storage first:

```bash
# In AnalysisWorker directory
docker-compose -f postgres-service-compose.yml up -d
docker-compose -f minio-compose.yml up -d
```

*   **PostgreSQL:** Runs on port `5432`.
*   **MinIO:** Runs on port `9000` (API) and `9001` (Console).

### 2. Analysis Workers
Start the processing pipeline:

```bash
# In AnalysisWorker directory
docker-compose -f image-process-compose.yml up -d
```

**Note:** Ensure your `.env` files in `camera-ingest` and `image-process` are configured with valid Google Cloud Pub/Sub credentials if you are using the production configuration.

### 3. Web Application
The web application can be deployed as a standalone container or Vercel deployment.

#### Local Docker Build
```bash
cd web
docker build -t datapolis-web .
docker run -p 3000:3000 --env-file .env datapolis-web
```

## Configuration Reference

### Environment Variables

#### Web (`web/.env`)
| Variable | Description |
|s---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/DatapolisX`) |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for internal API calls |

#### Workers (`AnalysisWorker/**/.env`)
| Variable | Description |
|---|---|
| `MINIO_ENDPOINT` | URL of MinIO service |
| `MINIO_ACCESS_KEY` | MinIO Access Key |
| `MINIO_SECRET_KEY` | MinIO Secret Key |
| `PUBSUB_TOPIC_ID` | Google Pub/Sub Topic ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to JSON key file |
