"""DataX Town multiplayer server — เสิร์ฟไฟล์เกม + WebSocket realtime ในพอร์ตเดียว

ใช้ Python stdlib ล้วน (ไม่ต้องติดตั้งอะไรเพิ่ม)  รัน: python server.py
ผู้เล่นในเครื่องเดียวกัน:  http://localhost:8700
ผู้เล่นเครื่องอื่นใน LAN:  http://<ip-เครื่องนี้>:8700  (สคริปต์พิมพ์ ip ให้ตอนสตาร์ต)

Protocol (JSON ผ่าน WebSocket ที่ path /ws):
  client -> server: {t:"join", name, variant, hair, shirt, pet, petName, x, y, dir}
                    {t:"move", x, y, dir, moving}
                    {t:"pet", petId, petName}
                    {t:"chat", text}
  server -> client: {t:"welcome", id, players:[...]}
                    {t:"join", player} / {t:"leave", id}
                    {t:"move", id, x, y, dir, moving}
                    {t:"pet", id, petId, petName} / {t:"chat", id, text}
"""
import argparse
import base64
import hashlib
import json
import os
import socket
import struct
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = int(os.environ.get("PORT", "8700"))  # cloud hosts (เช่น Render) กำหนดพอร์ตผ่าน env
ROOT = Path(__file__).resolve().parent
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
MAX_CHAT_LEN = 200
ACCESS_KEY = None  # ตั้งผ่าน --key ตอนสตาร์ต; None = ไม่ต้องใช้รหัส


class Client:
    def __init__(self, cid, conn, info):
        self.id = cid
        self.conn = conn
        self.send_lock = threading.Lock()
        self.info = info  # name, variant, hair, shirt, x, y, dir, moving

    def send(self, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        n = len(payload)
        if n < 126:
            header = bytes([0x81, n])
        elif n < 65536:
            header = bytes([0x81, 126]) + struct.pack(">H", n)
        else:
            header = bytes([0x81, 127]) + struct.pack(">Q", n)
        with self.send_lock:
            self.conn.sendall(header + payload)

    def snapshot(self):
        return {"id": self.id, **self.info}


class Hub:
    def __init__(self):
        self.lock = threading.Lock()
        self.clients = {}
        self.next_id = 1

    def join(self, conn, info):
        with self.lock:
            cid = self.next_id
            self.next_id += 1
            client = Client(cid, conn, info)
            others = [c.snapshot() for c in self.clients.values()]
            self.clients[cid] = client
        client.send({"t": "welcome", "id": cid, "players": others})
        self.broadcast({"t": "join", "player": client.snapshot()}, exclude=cid)
        print(f"[join] #{cid} {info.get('name')} (online: {len(self.clients)})")
        return client

    def leave(self, client):
        with self.lock:
            if self.clients.pop(client.id, None) is None:
                return
        self.broadcast({"t": "leave", "id": client.id})
        print(f"[leave] #{client.id} {client.info.get('name')} (online: {len(self.clients)})")

    def broadcast(self, obj, exclude=None):
        with self.lock:
            targets = [c for c in self.clients.values() if c.id != exclude]
        dead = []
        for c in targets:
            try:
                c.send(obj)
            except OSError:
                dead.append(c)
        for c in dead:
            self.leave(c)


HUB = Hub()


class GameHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/ws" and "websocket" in self.headers.get("Upgrade", "").lower():
            self.handle_websocket()
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # เงียบ request log ของไฟล์ static ไม่ให้ท่วม console

    # ---------- WebSocket (RFC 6455, text frames เท่านั้น) ----------

    def handle_websocket(self):
        key = self.headers.get("Sec-WebSocket-Key", "")
        accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode()).digest()).decode()
        self.wfile.write(
            ("HTTP/1.1 101 Switching Protocols\r\n"
             "Upgrade: websocket\r\nConnection: Upgrade\r\n"
             f"Sec-WebSocket-Accept: {accept}\r\n\r\n").encode())
        self.wfile.flush()
        self.close_connection = True

        client = None
        try:
            while True:
                msg = self.read_text_message()
                if msg is None:
                    break
                try:
                    data = json.loads(msg)
                except ValueError:
                    continue
                t = data.get("t")
                if t == "join" and client is None and ACCESS_KEY and data.get("key") != ACCESS_KEY:
                    payload = json.dumps({"t": "denied"}).encode()
                    self.connection.sendall(bytes([0x81, len(payload)]) + payload)
                    break
                if t == "join" and client is None:
                    info = {
                        "name": str(data.get("name", "Guest"))[:24],
                        "variant": int(data.get("variant", 0)),
                        "hair": data.get("hair"), "shirt": data.get("shirt"),
                        "pet": data.get("pet"), "petName": data.get("petName"),
                        "spriteId": data.get("spriteId"),
                        "x": float(data.get("x", 0)), "y": float(data.get("y", 0)),
                        "dir": data.get("dir", "down"), "moving": False, "running": False,
                    }
                    client = HUB.join(self.connection, info)
                elif client and t == "move":
                    client.info.update(x=float(data["x"]), y=float(data["y"]),
                                       dir=data.get("dir", "down"), moving=bool(data.get("moving")),
                                       running=bool(data.get("running")))
                    HUB.broadcast({"t": "move", "id": client.id, **{k: client.info[k] for k in ("x", "y", "dir", "moving", "running")}},
                                  exclude=client.id)
                elif client and t == "pet":
                    pet_id = data.get("petId")
                    pet_name = data.get("petName")
                    client.info.update(pet=pet_id, petName=pet_name)
                    HUB.broadcast({"t": "pet", "id": client.id, "petId": pet_id, "petName": pet_name},
                                  exclude=client.id)
                elif client and t == "chat":
                    text = str(data.get("text", ""))[:MAX_CHAT_LEN].strip()
                    if text:
                        HUB.broadcast({"t": "chat", "id": client.id, "text": text}, exclude=client.id)
        except (OSError, ConnectionError):
            pass
        finally:
            if client:
                HUB.leave(client)

    def read_exact(self, n):
        data = self.rfile.read(n)
        if data is None or len(data) < n:
            raise ConnectionError("socket closed")
        return data

    def read_text_message(self):
        """อ่านจนได้ข้อความเต็ม 1 อัน (รองรับ fragmentation) — None = ปิด connection"""
        buffer = b""
        while True:
            b1, b2 = self.read_exact(2)
            fin, opcode = b1 & 0x80, b1 & 0x0F
            length = b2 & 0x7F
            if length == 126:
                length = struct.unpack(">H", self.read_exact(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self.read_exact(8))[0]
            mask = self.read_exact(4) if b2 & 0x80 else None
            payload = self.read_exact(length) if length else b""
            if mask:
                payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))

            if opcode == 0x8:  # close
                return None
            if opcode == 0x9:  # ping -> pong
                self.connection.sendall(bytes([0x8A, len(payload)]) + payload)
                continue
            if opcode == 0xA:  # pong
                continue
            if opcode in (0x0, 0x1, 0x2):
                buffer += payload
                if fin:
                    return buffer.decode("utf-8", errors="replace")


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=None,
                    help="รหัสเข้าห้อง — ผู้เล่นต้องเปิดลิงก์แบบ ?key=<รหัส> ถึงจะ join ได้")
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()
    ACCESS_KEY = args.key

    handler = partial(GameHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("0.0.0.0", PORT), handler) as httpd:
        httpd.daemon_threads = True
        suffix = f"?key={ACCESS_KEY}" if ACCESS_KEY else ""
        print(f"DataX Town multiplayer server")
        print(f"  เครื่องนี้:      http://localhost:{PORT}/{suffix}")
        ip = lan_ip()
        if ip:
            print(f"  เครื่องอื่นใน LAN: http://{ip}:{PORT}/{suffix}")
        if ACCESS_KEY:
            print(f"  ต้องใช้รหัสเข้าห้อง: แชร์ลิงก์พร้อม ?key={ACCESS_KEY} เท่านั้น")
        print("  นอกวง LAN: รัน python tunnel.py เพิ่มอีกหน้าต่าง แล้วแชร์ลิงก์ trycloudflare ที่ได้")
        print("(Ctrl+C เพื่อหยุด — ถ้า Windows Firewall ถามให้กด Allow เพื่อให้เครื่องอื่นเข้าได้)")
        if not args.no_browser:
            try:
                webbrowser.open(f"http://localhost:{PORT}/{suffix}")
            except Exception:
                pass
        httpd.serve_forever()
