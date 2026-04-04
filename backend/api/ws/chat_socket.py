# pyre-ignore-all-errors
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from api.ws.manager import manager
from core.config import SECRET_KEY, ALGORITHM
from db.session import SessionLocal
from models.chat import Message

router = APIRouter()

@router.websocket("/ws/chat/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            room_id = data.get("room_id")
            content = data.get("content")

            message_payload = {
                "sender_id": user_id,
                "content": content,
                "room_id": room_id,
                "receiver_id": receiver_id
            }

            db = SessionLocal()
            try:
                msg_entry = Message(sender_id=user_id, content=content, room_id=room_id, receiver_id=receiver_id)
                db.add(msg_entry)
                db.commit()
                
                # Append to CSV
                import csv
                import os
                file_path = os.path.join(os.path.dirname(__file__), "..", "..", "chats.csv")
                file_exists = os.path.isfile(file_path)
                with open(file_path, "a", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    if not file_exists:
                        writer.writerow(["sender_id", "content", "room_id", "receiver_id", "timestamp"])
                    from datetime import datetime
                    writer.writerow([user_id, content, room_id, receiver_id, datetime.utcnow().isoformat()])
            except BaseException as e:
                print(f"Error saving message: {e}")
                db.rollback()
            finally:
                db.close()

            if receiver_id:
                user_is_active = str(receiver_id) in manager.active_connections if hasattr(manager, 'active_connections') else False
                
                await manager.send_personal_message(message_payload, str(receiver_id))
                if str(receiver_id) != str(user_id):
                    await manager.send_personal_message(message_payload, str(user_id))
                    
                # Push Notification Logic
                db = SessionLocal()
                try:
                    from models.user import User
                    target_user = db.query(User).filter(User.id == receiver_id).first()
                    if target_user and target_user.push_subscription:
                        import json
                        import os
                        from pywebpush import webpush
                        try:
                            sub_info = json.loads(target_user.push_subscription)
                            vapid_private_key = os.getenv("VAPID_PRIVATE_KEY", "uO1xR0w-QJ6ZtI-sD5hMw1xQwH0k2n5_K_rN7x8A9Ew") # Placeholder but valid format for dev
                            vapid_claims = {"sub": "mailto:admin@nova.com"}
                            webpush(
                                subscription_info=sub_info,
                                data=json.dumps({"title": "NOVA-CHAT", "body": "You have a new encrypted message", "url": "/chat"}),
                                vapid_private_key=vapid_private_key,
                                vapid_claims=vapid_claims
                            )
                        except Exception as pe:
                            print(f"WebPush Error: {pe}")
                finally:
                    db.close()
            else:
                await manager.broadcast(message_payload)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
