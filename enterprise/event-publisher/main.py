import os
import time
import sqlite3
import json
import pika

# In a real environment, this might be handled by Debezium directly inside Kafka.
# Here we poll the ledger and broadcast events to RabbitMQ.

LEDGER_DB = "/app/ledger/ledger.db"
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
EXCHANGE_NAME = "hvverify_events"

def get_rabbitmq_connection():
    for _ in range(10):
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
            return connection
        except Exception:
            print("Waiting for RabbitMQ...")
            time.sleep(5)
    raise Exception("Could not connect to RabbitMQ")

def broadcast_events():
    if not os.path.exists(LEDGER_DB):
        print("Waiting for ledger...")
        return

    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='fanout')

        conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
        cursor = conn.cursor()
        
        # In a real system, we would track the last processed ID to avoid re-publishing.
        # For this skeleton, we just publish the latest vote to demonstrate the hook.
        cursor.execute("SELECT original_vote_id, candidate_id, timestamp, ledger_hash FROM immutable_votes ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            event_payload = {
                "event_type": "VoteCast",
                "original_vote_id": row[0],
                "candidate_id": row[1],
                "timestamp": row[2],
                "ledger_hash": row[3]
            }
            
            # Broadcast
            channel.basic_publish(
                exchange=EXCHANGE_NAME,
                routing_key='',
                body=json.dumps(event_payload)
            )
            print(f"Published event: {event_payload}")

        conn.close()
        connection.close()
    except Exception as e:
        print(f"Event publish failed: {e}")

if __name__ == "__main__":
    print("Starting Enterprise Event Publisher...")
    while True:
        broadcast_events()
        time.sleep(10)
