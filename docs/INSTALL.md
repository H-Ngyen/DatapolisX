# 📦 Installation & Setup Guide

This guide provides step-by-step instructions to set up **DatapolisX** locally for development.

> **⚠️ Important Note:** The current version of the project relies on **Google Cloud Pub/Sub** for message queuing. To run the full pipeline, you will need a valid Google Cloud Service Account. We are working on a RabbitMQ/Redis alternative for easier local development.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed:

*   **Docker Desktop** (or Docker Engine + Compose)
*   **Node.js** (v18 or higher)
*   **Python** (v3.10 or higher)
*   **Git**

---

## 2. Infrastructure Setup (Database & Storage)

We need to start PostgreSQL and MinIO first as other services depend on them.

1.  **Navigate to the AnalysisWorker directory:**
    ```bash
    cd AnalysisWorker
    ```

2.  **Start PostgreSQL:**
    ```bash
    docker-compose -f postgres-service-compose.yml up -d
    ```
    *   This starts a Postgres database on port `5432`.
    *   Default User: `neondb_owner` / Password: `password` / DB: `DatapolisX`

3.  **Start MinIO (Object Storage):**
    ```bash
    docker-compose -f minio-compose.yml up -d
    ```
    *   Access MinIO Console at: `http://localhost:9001`
    *   Default Login: `minioadmin` / `minioadmin`

4.  **⚡ CRITICAL STEP: Create MinIO Bucket**
    *   Open your browser and go to `http://localhost:9001`.
    *   Login with `minioadmin` / `minioadmin`.
    *   Go to **Buckets** -> **Create Bucket**.
    *   Name the bucket: **`images`**.
    *   *Without this step, the image processing worker will crash.*

---

## 3. Web Application Setup

Now we set up the Next.js frontend and initialize the database schema.

1.  **Navigate to the web directory:**
    ```bash
    cd ../web  # From AnalysisWorker folder
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Copy the example file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and verify the `DATABASE_URL`. It should match the Postgres credentials started in Step 2:
    ```env
    DATABASE_URL='your connection string'
    GEMINI_API_KEY=your gemini api key
    ```

4.  **Initialize Database Schema (Prisma):**
    Run the migrations to create tables in PostgreSQL:
    ```bash
    npx prisma migrate dev --name init
    ```
    *If this fails, ensure the Postgres container is running and accessible.*

5.  **Run the Web App:**
    ```bash
    npm run dev
    ```
    *   Open `http://localhost:3000` to see the dashboard.
    *   *Note: The dashboard will be empty until the Python workers start processing data.*

---

## 4. Python Workers Setup

This is the most complex part due to the Google Cloud dependency.

### A. Environment Setup

1.  Navigate to `AnalysisWorker`:
    ```bash
    cd ../AnalysisWorker
    ```
2.  Create a virtual environment (Recommended):
    ```bash
    python -m venv venv
    # Windows:
    venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies for **all** sub-projects:
    ```bash
    pip install -r camera-ingest/requirements.txt
    pip install -r image-process/requirements.txt
    pip install -r image-predict/requirements.txt
    ```

### B. Google Cloud Credentials (Required)

The system needs a Service Account Key to talk to Pub/Sub.

1.  **If you HAVE a GCP Project:**
    *   Create a Service Account with `Pub/Sub Editor` role.
    *   Download the JSON key file.
    *   Save it as `gcp-key.json` in the `AnalysisWorker` folder.
    *   Set the environment variable in your terminal:
        ```bash
        # Windows PowerShell
        $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\DatapolisX\AnalysisWorker\gcp-key.json"
        
        # Mac/Linux
        export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcp-key.json"
        ```

2.  **If you DO NOT have a GCP Project:**
    *   You cannot run the **Real-time Ingest -> Process** pipeline fully.
    *   However, you can still run the **Web App** and manually inject data into the Database to test the UI.

### C. Running the Workers (With GCP Key)

You need to run these services in separate terminals.

**Terminal 1: Camera Ingest**
```bash
cd AnalysisWorker/camera-ingest
# Make sure .env is created and configured
cp .env.example .env 
# Edit .env: Set PUBSUB_TOPIC_ID to your GCP topic
python main.py
```

**Terminal 2: Image Process**
```bash
cd AnalysisWorker/image-process
# Make sure .env is created and configured
cp .env.example .env
# Edit .env: Set PUBSUB_SUBSCRIPTION_ID to your GCP subscription
python main.py
```

---

## Troubleshooting

*   **"Connection refused" to Postgres:** Check if port 5432 is occupied by another local Postgres instance. Stop your local service or change the port in `postgres-service-compose.yml`.
*   **MinIO "NoSuchBucket":** Did you create the `images` bucket in step 2.4?
*   **Missing Dependencies:** Ensure you activated the Python virtual environment before installing `requirements.txt`.
