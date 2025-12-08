from google.cloud import pubsub_v1
import os
import time
from dotenv import load_dotenv
load_dotenv()


subscriber = pubsub_v1.SubscriberClient()
SUBSCRIPTION_ID = os.environ.get('PUBSUB_SUBSCRIPTION_ID')
subscription_path = subscriber.subscription_path("message-queue-479804","image-process-sub")

def clear_messages():
    """Kéo và ACK tin nhắn cho đến khi không còn tin nhắn nào."""
    print(f"Bắt đầu làm sạch {subscription_path}...")
    while True:
        response = subscriber.pull(
            request={"subscription": subscription_path, "max_messages": 1000}
        )

        if not response.received_messages:
            print("Đã hoàn tất. Không còn tin nhắn nào.")
            break

        ack_ids = [msg.ack_id for msg in response.received_messages]

        # Gửi ACK để xác nhận và xóa tin nhắn
        subscriber.acknowledge(
            request={"subscription": subscription_path, "ack_ids": ack_ids}
        )

        print(f"Đã ACK {len(response.received_messages)} tin nhắn.")
        time.sleep(0.5)


clear_messages()
