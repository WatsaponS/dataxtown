"""Bot ผู้เล่นจำลองสำหรับทดสอบ multiplayer ของ DataX Town (stdlib ล้วน)

ตัวอย่าง: python bot_client.py --name Botto --tile 15 23 --chat "สวัสดี!" --seconds 60
บอทจะ join, เดินไปมาซ้าย-ขวาเล็กน้อย และส่งแชตซ้ำทุก ~3 วินาที
"""
import argparse
import base64
import hashlib
import json
import os
import socket
import ssl
import struct
import threading
import time

TILE = 16


def ws_connect(host, port, path="/ws", tls=False):
    sock = socket.create_connection((host, port), timeout=10)
    if tls:
        sock = ssl.create_default_context().wrap_socket(sock, server_hostname=host)
    key = base64.b64encode(os.urandom(16)).decode()
    request = (
        f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\n"
        "Upgrade: websocket\r\nConnection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
    )
    sock.sendall(request.encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        chunk = sock.recv(1024)
        if not chunk:
            raise ConnectionError("closed during handshake")
        buf += chunk
    status = buf.split(b"\r\n", 1)[0]
    if b"101" not in status:
        raise ConnectionError(f"handshake failed: {status!r}")
    sock.settimeout(None)
    return sock


def send_text(sock, text):
    payload = text.encode("utf-8")
    mask = os.urandom(4)
    n = len(payload)
    if n < 126:
        header = bytes([0x81, 0x80 | n])
    elif n < 65536:
        header = bytes([0x81, 0x80 | 126]) + struct.pack(">H", n)
    else:
        header = bytes([0x81, 0x80 | 127]) + struct.pack(">Q", n)
    masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
    sock.sendall(header + mask + masked)


def send_json(sock, obj):
    send_text(sock, json.dumps(obj, ensure_ascii=False))


def reader(sock):
    """อ่านทิ้งทุก frame จากเซิร์ฟเวอร์ (กัน buffer เต็ม) และตอบ ping"""
    f = sock.makefile("rb")
    try:
        while True:
            hdr = f.read(2)
            if len(hdr) < 2:
                return
            opcode = hdr[0] & 0x0F
            length = hdr[1] & 0x7F
            if length == 126:
                length = struct.unpack(">H", f.read(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", f.read(8))[0]
            payload = f.read(length) if length else b""
            if opcode == 0x9:
                sock.sendall(bytes([0x8A, 0x80]) + os.urandom(4))  # pong (empty, masked)
            elif opcode == 0x8:
                return
    except OSError:
        return


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=None, help="default: 443 เมื่อใช้ --tls, ปกติ 8700")
    ap.add_argument("--tls", action="store_true", help="ต่อผ่าน wss (เช่นผ่าน Cloudflare Tunnel)")
    ap.add_argument("--key", default=None, help="access key ของเซิร์ฟเวอร์ (ถ้าตั้งไว้)")
    ap.add_argument("--name", default="Botto")
    ap.add_argument("--variant", type=int, default=4)
    ap.add_argument("--hair", default=None, help="hex เช่น 8a2f2f")
    ap.add_argument("--shirt", default=None)
    ap.add_argument("--tile", nargs=2, type=int, default=[15, 22],
                    help="tile บนแผนที่ large3x grid 32 (default ใกล้ทางเข้าหลัก)")
    ap.add_argument("--chat", default="สวัสดีครับ ผมบอททดสอบ 🤖")
    ap.add_argument("--seconds", type=int, default=60)
    args = ap.parse_args()

    x = (args.tile[0] + 0.5) * TILE
    y = (args.tile[1] + 0.5) * TILE
    port = args.port if args.port else (443 if args.tls else 8700)
    sock = ws_connect(args.host, port, tls=args.tls)
    threading.Thread(target=reader, args=(sock,), daemon=True).start()

    send_json(sock, {
        "t": "join", "key": args.key, "name": args.name, "variant": args.variant,
        "hair": ("#" + args.hair) if args.hair else None,
        "shirt": ("#" + args.shirt) if args.shirt else None,
        "x": x, "y": y, "dir": "down",
    })
    print(f"[bot] joined as {args.name} at tile {args.tile}")

    start = time.time()
    step = 0
    while time.time() - start < args.seconds:
        # เดินส่ายซ้าย-ขวารอบจุดเกิด
        offset = [0, 8, 0, -8][step % 4]
        send_json(sock, {"t": "move", "x": x + offset, "y": y,
                         "dir": "left" if offset < 0 else "right", "moving": offset != 0})
        if step % 6 == 2:
            send_json(sock, {"t": "chat", "text": args.chat})
        step += 1
        time.sleep(0.5)

    send_json(sock, {"t": "move", "x": x, "y": y, "dir": "down", "moving": False})
    sock.close()
    print("[bot] done")


if __name__ == "__main__":
    main()
