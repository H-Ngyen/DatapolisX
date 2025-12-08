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
