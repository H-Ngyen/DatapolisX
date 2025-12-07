import asyncio
import os
from datetime import datetime, UTC
import json
import logging
import io
import aiohttp
import boto3
from botocore.exceptions import ClientError
from google.cloud import pubsub_v1
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

CAMERA_LIST = [
    '662b86c41afb9c00172dd31c',
    '5a6065c58576340017d06615',
    '6623f4df6f998a001b2528eb',
    '662b7ce71afb9c00172dc676',
    "649da77ea6068200171a6dd4",
    "662b857b1afb9c00172dd106",
    "5d9ddd49766c880017188c94",
    "5d9ddec9766c880017188c9c",
    "5a8256315058170011f6eac9",
    "58b5510817139d0010f35d4e",
    "5d8cd653766c88001718894c",
    "5d9ddf0f766c880017188c9e",
    "5d9dde1f766c880017188c98",
    "587ee0ecb807da0011e33d50",
    "5a8253615058170011f6eabf",
    "6623df636f998a001b251e92",
    "58e49e3dd9d6200011e0b9d1",
    "5a8241105058170011f6eaa6",
    "662b7f9f1afb9c00172dca50",
    "587ed91db807da0011e33d4e",
]

ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY')
SECRET_KEY = os.getenv('MINIO_SECRET_KEY')
AWS_REGION = 'us-east-1'
BUCKET_NAME = 'images'
ENDPOINT_URL = os.getenv('MINIO_ENDPOINT')

PUBSUB_TOPIC_ID = os.getenv('PUBSUB_TOPIC_ID')
CONCURRENCY_LIMIT = 20

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=ENDPOINT_URL, # Rất quan trọng khi dùng MinIO
            region_name=AWS_REGION,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY
        )

        self.pubsub_publisher = pubsub_v1.PublisherClient()
        self.topic_path = self.pubsub_publisher.topic_path(
            'message-queue-479804',
            PUBSUB_TOPIC_ID
        )

        # Semaphore để giới hạn tác vụ chạy song song (thay thế p-limit)
        self.semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

    def get_current_timestamp_string(self) -> str:
        return datetime.now().strftime('%Y%m%d_%H%M%S')

    async def init_cookie(self, session: aiohttp.ClientSession):
        try:
            # Sử dụng aiohttp để tự động quản lý cookie (cookiejar)
            async with session.get('https://giaothong.hochiminhcity.gov.vn/',
                                   headers={'User-Agent': 'Mozilla/5.0'}) as response:
                response.raise_for_status()
            logger.info('Đã lấy cookie thành công')
        except Exception as err:
            logger.error(f'Lỗi lấy cookie: {err}')

    async def publish_image_request(self, minio_key: str, camera_id: str) -> str:
        """Tương đương với publishImageRequest()"""
        if not PUBSUB_TOPIC_ID:
            logger.warning(f"[{camera_id}] PUBSUB_TOPIC_ID không được thiết lập. Bỏ qua Pub/Sub.")
            return "NO_TOPIC"

        payload = {
            'minio_bucket': BUCKET_NAME,
            'minio_key': minio_key,
            'camera_id': camera_id,
            'timestamp_utc': datetime.now(UTC).isoformat(),
        }

        data_buffer = json.dumps(payload).encode('utf-8')

        try:
            message_future = self.pubsub_publisher.publish(self.topic_path, data_buffer)
            message_id = await asyncio.wrap_future(message_future)

            logger.info(f'[{camera_id}] Pub/Sub OK. Message ID: {message_id}')
            return message_id
        except Exception as error:
            logger.error(f'[{camera_id}] Lỗi khi Publish Pub/Sub: {error}')
            raise

    def upload_minio(self, image_data: bytes, image_name: str):
        """Tương đương với uploadMinio() (Đồng bộ)"""
        try:
            # Thao tác tải lên
            image_stream = io.BytesIO(image_data)

            # SỬ DỤNG put_object VỚI stream và ContentLength
            self.s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=image_name,
                Body=image_stream,
                ContentLength=len(image_data),
                ContentType='image/jpeg',
            )
            logger.info(f"Thành công tải file {image_name} lên minio")
            return True

        except Exception as e:
            logger.error(f"❌ Lỗi khi tải file {image_name}: {e}")
            raise

    async def pull_single_camera(self, session: aiohttp.ClientSession, camera_id: str) -> bool:
        """Tương đương với pullSingleCamera() (Sử dụng Semaphore để giới hạn song song)"""
        # Sử dụng semaphore để giới hạn số lượng tác vụ chạy đồng thời
        async with self.semaphore:
            url = f'https://giaothong.hochiminhcity.gov.vn:8007/Render/CameraHandler.ashx?id={camera_id}'

            try:
                async with session.get(
                        url,
                        headers={
                            'User-Agent': 'Mozilla/5.0',
                            'Referer': 'https://giaothong.hochiminhcity.gov.vn/',
                        },
                        timeout=30  # 30 giây
                ) as response:

                    if response.status == 200:
                        # Lấy dữ liệu dưới dạng bytes
                        image = await response.read()
                        byte_length = len(image)

                        timestamp = self.get_current_timestamp_string()
                        image_name = f'image_{camera_id}_{timestamp}.jpeg'

                        await asyncio.to_thread(self.upload_minio, image, image_name)

                        # Pub/Sub
                        await self.publish_image_request(image_name, camera_id)

                        logger.info(
                            f'[{camera_id}] Pull ảnh OK: {image_name} ({byte_length} bytes)'
                        )
                        return True

                    logger.warning(
                        f'[{camera_id}] Lỗi status {response.status} khi pull ảnh.'
                    )
                    return False

            except Exception as err:
                logger.error(f'[{camera_id}] Pull/Upload ERROR: {err}')
                return False

    async def pull_real_image(self):
        """Tương đương với pullRealImage() (Vòng lặp chính)"""
        # Sử dụng aiohttp.ClientSession để quản lý kết nối và cookie
        async with aiohttp.ClientSession(cookie_jar=aiohttp.CookieJar(unsafe=True)) as session:
            # Đảm bảo cookie đã sẵn sàng trước khi bắt đầu vòng lặp
            await self.init_cookie(session)

            while True:
                start_time = datetime.now()

                # Tạo mảng các TÁC VỤ không đồng bộ
                # Mỗi task sẽ sử dụng self.pull_single_camera() và bị giới hạn bởi self.semaphore
                tasks = [self.pull_single_camera(session, camera_id) for camera_id in CAMERA_LIST]

                logger.info(
                    f'Bắt đầu pull {len(CAMERA_LIST)} camera với giới hạn {CONCURRENCY_LIMIT} song song...'
                )

                # Chờ TẤT CẢ các tác vụ hoàn thành (tương đương Promise.allSettled)
                results = await asyncio.gather(*tasks, return_exceptions=False)

                # Đếm số lượng thành công (kết quả là True)
                success_count = sum(1 for result in results if result is True)

                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()

                logger.info(
                    f'Hoàn thành chu kỳ pull. Tổng: {len(CAMERA_LIST)} cam, Thành công: {success_count}. Thời gian: {duration:.2f}s'
                )

                await asyncio.sleep(10)


if __name__ == '__main__':
    service = CameraService()
    try:
        asyncio.run(service.pull_real_image())
    except KeyboardInterrupt:
        logger.info("Chương trình đã dừng.")
    except Exception as e:
        logger.error(f"Lỗi ngoài luồng: {e}")