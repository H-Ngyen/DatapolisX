# MIT License
# Copyright (c) 2025 DatapolisX
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import os
import json
import io
from minio import Minio
from ultralytics import YOLO
from PIL import Image
from collections import Counter
from google.cloud import pubsub_v1
import datetime
import logging
import psycopg
from dotenv import load_dotenv
load_dotenv()

# --- 1. Cấu hình & Khởi tạo ---
# Thiết lập logging cơ bản
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Cấu hình MinIO
MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT')
MINIO_ACCESS_KEY = os.environ.get('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = os.environ.get('MINIO_SECRET_KEY')

# Ket noi postgres
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_HOST = os.environ.get('DB_HOST')
connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}"

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

# Tải mô hình YOLO (Tắt verbose để chỉ in log bạn muốn)
model = YOLO("best.pt", verbose=False)

# Cấu hình Pub/Sub
SUBSCRIPTION_ID = os.environ.get('PUBSUB_SUBSCRIPTION_ID')
timeout = 60.0


# --- 2. Hàm Tải Object từ MinIO ---
def get_object_as_bytes(bucket_name, object_key):
    """Tải một object từ MinIO vào bộ nhớ (bytes)"""
    try:
        response = minio_client.get_object(bucket_name, object_key)
        object_bytes = response.read()
        logging.info(f"✅ Tải thành công '{object_key}'. Kích thước: {len(object_bytes)} bytes")
        return object_bytes
    except Exception as err:
        logging.error(f"❌ Lỗi MinIO khi tải object '{object_key}': {err}")
        return None
    finally:
        if 'response' in locals():
            response.close()
            response.release_conn()


# --- 3. Hàm Xử lý Ảnh YOLO và Xuất JSON ---
def image_process(bucket_name: str, object_key: str):
    image_data = get_object_as_bytes(bucket_name, object_key)

    if not image_data:
        return {"status": "error", "message": "Failed to download image from MinIO."}

    try:
        logging.info("Bắt đầu xử lý dữ liệu ảnh...")
        image_pil = Image.open(io.BytesIO(image_data))

        results_list = model(image_pil)

        results = results_list[0]

        boxes = results.boxes
        class_ids = boxes.cls.tolist()
        names = results.names

        arr = [names[int(cls_id)] for cls_id in class_ids]
        object_counts = dict(Counter(arr))

        parts = object_key.split("_")

        camera_id = parts[1]  # Ví dụ: 5deb576d1dc17d7c5515ad0c
        date_part = parts[2]  # Ví dụ: 20251130

        time_part_with_ext = parts[3]  # Ví dụ: 211419.jpeg
        time_part = time_part_with_ext.split('.')[0]  # Ví dụ: 211419

        datetime_string_raw = f"{date_part}_{time_part}"  # Ví dụ: 20251130_211419

        datetime_object = datetime.datetime.strptime(datetime_string_raw, '%Y%m%d_%H%M%S')

        create_at_string = datetime_object.isoformat()
        output_data = {
            "status": "success",
            "minio_key": object_key,
            "camera_id": camera_id,
            "detections": object_counts,
            "total_objects": len(boxes),
            "create_at": create_at_string
        }

        json_output = json.dumps(output_data, indent=4)
        logging.info(f"\n--- 📝 KẾT QUẢ XỬ LÝ JSON ---\n{json_output}")
        return output_data

    except Exception as e:
        logging.error(f"❌ LỖI XỬ LÝ YOLO cho {object_key}: {e}")
        return {"status": "error", "message": f"YOLO processing failed: {e}"}

def remove_minio_object(bucket_name: str, object_key: str):
    """Xóa một object từ MinIO."""
    try:
        minio_client.remove_object(bucket_name, object_key)
        logging.info(f"🗑️ Đã xóa thành công object '{object_key}' khỏi bucket '{bucket_name}'.")
        return True
    except Exception as err:
        logging.error(f"❌ Lỗi MinIO khi xóa object '{object_key}': {err}")
        return False

def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    global connection
    try:
        payload = json.loads(message.data.decode('utf-8'))
        is_saved = False
        minio_bucket = payload.get('minio_bucket')
        minio_key = payload.get('minio_key')

        logging.info(f"\n--- 📩 NHẬN TIN NHẮN TỪ TOPIC ---\nKey: {minio_key}, Bucket: {minio_bucket}")

        detection_data = image_process(minio_bucket, minio_key)

        if detection_data and detection_data.get('status') == 'success':
            minio_key = detection_data.get('minio_key')
            existing_record = check_record(connection, minio_key)
            if existing_record:
                # Key đã tồn tại trong CSDL
                print(f"INFO: minio_key '{minio_key}' đã tồn tại trong CSDL. Bỏ qua INSERT.")

                message.ack()  # Xác nhận đã xử lý (và xóa) tin nhắn
            else:
                save_detection_to_db(connection, detection_data)
                is_saved = True
        else:
            logging.warning(f"Không lưu CSDL vì xử lý ảnh thất bại cho key: {minio_key}")

        if is_saved:
            remove_minio_object("images", minio_key)

        message.ack()
        logging.info(f"ACKED message ID: {message.message_id}")

    except Exception as e:
        logging.error(f"Lỗi chung trong callback: {e}")
        # Không ACK để tin nhắn được gửi lại sau
        # message.nack()
        pass



def check_record(conn: psycopg.Connection, minio_key):
    check_sql = "SELECT 1 FROM camera_detections WHERE minio_key = %s"

    # Thực thi truy vấn kiểm tra
    with conn.cursor() as cur:
        cur.execute(check_sql, (minio_key,))

        # Lấy kết quả
        existing_record = cur.fetchone()

    return existing_record

def initialize_database(conn_string: str):
    conn = None
    try:
        conn = psycopg.connect(conn_string)
        logging.info("✅ PostgreSQL đã kết nối thành công.")

        # Mở Cursor và sử dụng Context Manager
        with conn.cursor() as cur:
            # Lệnh SQL để tạo bảng nếu chưa tồn tại
            sql_create_table = f"""
                CREATE TABLE IF NOT EXISTS camera_detections (
                    id SERIAL PRIMARY KEY,
                    minio_key VARCHAR(255) UNIQUE NOT NULL,  -- ĐÃ THÊM TRƯỜNG NÀY
                    camera_id VARCHAR(50) NOT NULL,
                    detections JSONB,
                    total_objects INTEGER NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
                );
            """

            cur.execute(sql_create_table)
            conn.commit()
            logging.info(f"✅ Bảng '{"camera_detections"}' đã sẵn sàng.")

        return conn


    except Exception as e:
        logging.error(f"❌ LỖI KHỞI TẠO CSDL HOẶC TẠO BẢNG: {e}")
        if conn:
            conn.close()
        raise


def save_detection_to_db(conn: psycopg.Connection, data: dict):
    """Sử dụng kết nối đã mở để lưu kết quả phát hiện."""
    try:
        with conn.cursor() as cur:

            sql = """
                  -- Thứ tự cột: minio_key, camera_id, detections, total_objects, created_at
                  INSERT INTO camera_detections (minio_key, camera_id, detections, total_objects, created_at) 
                  VALUES (%s, %s, %s, %s, %s) 
                  """

            # ĐÃ SỬA: Thứ tự tham số PHẢI KHỚP với thứ tự cột
            params = (
                data['minio_key'],          # 1. minio_key
                data['camera_id'],          # 2. camera_id
                json.dumps(data['detections']), # 3. detections
                data['total_objects'],      # 4. total_objects
                data['create_at']           # 5. created_at
            )

            cur.execute(sql, params)
            conn.commit()
            logging.info(f"💾 Đã lưu kết quả cho {data['minio_key']} vào CSDL thành công.")

    except Exception as e:
        logging.error(f"❌ Lỗi CSDL khi lưu kết quả: {e}")
        if conn:
            conn.rollback()
        raise

# --- 5. Chạy Subscriber ---
if __name__ == "__main__":
    connection = initialize_database(connection_string)

    subscriber = pubsub_v1.SubscriberClient()
    logging.info(f"Đã khởi tạo Subscriber Client.")

    # Bọc toàn bộ logic lắng nghe vào vòng lặp vô hạn
    while True:
        streaming_pull_future = None  # Khởi tạo lại biến trong mỗi lần lặp
        try:
            # Bắt đầu lắng nghe và trả về một đối tượng Future
            streaming_pull_future = subscriber.subscribe(SUBSCRIPTION_ID, callback=callback)
            logging.info(f"Bắt đầu lắng nghe tin nhắn liên tục trên {SUBSCRIPTION_ID}...")

            streaming_pull_future.result()

        except KeyboardInterrupt:
            # Xử lý dừng thủ công (Ctrl+C): THOÁT VÀ DỪNG CHƯƠNG TRÌNH
            logging.info("Dừng Subscriber bằng tay (Ctrl+C). Thoát khỏi vòng lặp.")
            if streaming_pull_future:
                streaming_pull_future.cancel()
                try:
                    streaming_pull_future.result()
                except Exception:
                    pass
            break

        except Exception as e:
            # Xử lý các lỗi nghiêm trọng (ví dụ: lỗi mạng, lỗi kết nối Pub/Sub, lỗi nội bộ)
            logging.error(f"LỖI NGHIÊM TRỌNG TRONG LUỒNG SUBSCRIBER: {e}")
            logging.warning("Đang chờ 5 giây trước khi khởi động lại...")

            # Đảm bảo luồng lỗi được hủy sạch sẽ trước khi khởi động lại
            if streaming_pull_future:
                streaming_pull_future.cancel()
                try:
                    streaming_pull_future.result()
                except Exception:
                    pass

            import time

            time.sleep(5)  # Đợi 5 giây
            # Sau 5 giây, vòng lặp 'while True' sẽ tự động khởi động lại luồng mới.