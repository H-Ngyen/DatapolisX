# System Architecture

DatapolisX is designed as a distributed system to handle high-throughput image processing and real-time data visualization.

## Component Overview

### 1. Camera Ingest (`AnalysisWorker/camera-ingest`)
*   **Role:** The entry point of the data pipeline.
*   **Function:** Periodically fetches snapshots from public traffic camera APIs (HTTP/RTSP).
*   **Output:** Pushes raw image data/metadata to the Message Queue (Pub/Sub).

### 2. Message Queue (Google Pub/Sub)
*   **Role:** Decouples ingestion from processing.
*   **Function:** Buffers image requests to prevent overloading the processing workers.

### 3. Image Process (`AnalysisWorker/image-process`)
*   **Role:** The heavy-lifting AI worker.
*   **Function:**
    *   Subscribes to the Message Queue.
    *   Downloads raw images.
    *   Runs **YOLOv8** inference to detect vehicles (Car, Motorbike, Bus, Truck).
    *   Uploads the raw image to **MinIO** (Object Storage).
    *   Saves detection results (counts, timestamp) to **PostgreSQL**.

### 4. Image Predict (`AnalysisWorker/image-predict`)
*   **Role:** Future forecasting.
*   **Function:**
    *   Reads historical traffic data from **PostgreSQL**.
    *   Uses ML models (e.g., Random Forest/Linear Regression) to predict traffic density for the next 30-60 minutes.
    *   Writes predictions back to **PostgreSQL**.

### 5. Web Application (`web`)
*   **Role:** Visualization and User Interface.
*   **Stack:** Next.js (Fullstack).
*   **Function:**
    *   **Dashboard Controller:** Aggregates real-time data and predictions.
    *   **Prisma ORM:** Interfaces with PostgreSQL.
    *   **UI:** React components rendering charts and maps.

## Data Flow Diagram

1.  **Ingest:** `Camera` -> `Ingest Service` -> `Pub/Sub`
2.  **Process:** `Pub/Sub` -> `Process Service` -> `YOLO` -> `MinIO` & `DB (camera_detections)`
3.  **Predict:** `DB (camera_detections)` -> `Predict Service` -> `DB (camera_predictions)`
4.  **View:** `User` -> `Next.js` -> `DB` -> `UI`
