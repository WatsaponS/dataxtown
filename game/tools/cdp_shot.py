"""ถ่าย screenshot เกมด้วย Edge headless ผ่าน Chrome DevTools Protocol (เวลาจริง)

ต่างจาก --screenshot/--virtual-time-budget ตรงที่รอ "เวลาจริง" ได้ ทำให้ WebSocket /
multiplayer ทำงานก่อนถ่ายภาพ  ใช้:
    python cdp_shot.py --url "http://localhost:8700/index.html?autostart=1" --wait 6 --out shot.png
"""
import argparse
import base64
import json
import struct
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

from bot_client import ws_connect, send_text

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def recv_message(f, sock):
    """อ่านข้อความ WebSocket เต็ม 1 อัน (ต่อ fragment ให้) — None = ปิด"""
    data = b""
    while True:
        hdr = f.read(2)
        if len(hdr) < 2:
            return None
        fin, opcode = hdr[0] & 0x80, hdr[0] & 0x0F
        length = hdr[1] & 0x7F
        if length == 126:
            length = struct.unpack(">H", f.read(2))[0]
        elif length == 127:
            length = struct.unpack(">Q", f.read(8))[0]
        payload = f.read(length) if length else b""
        if opcode == 0x8:
            return None
        if opcode == 0x9:
            sock.sendall(bytes([0x8A, 0x80]) + b"\x00\x00\x00\x00")
            continue
        if opcode == 0xA:
            continue
        data += payload
        if fin:
            return data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--out", default="shot.png")
    ap.add_argument("--wait", type=float, default=6, help="วินาที (เวลาจริง) ก่อนถ่าย")
    ap.add_argument("--port", type=int, default=9222)
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=800)
    ap.add_argument("--eval", dest="eval_expr", default=None,
                    help="รัน JS ในหน้า (มี user gesture, await promise ให้) หลังครบ --wait แล้วพิมพ์ผลลัพธ์")
    args = ap.parse_args()

    edge = next((p for p in EDGE_PATHS if Path(p).exists()), None)
    if not edge:
        raise SystemExit("msedge.exe not found")

    profile = tempfile.mkdtemp(prefix="cdpshot_")
    proc = subprocess.Popen([
        edge, "--headless=new", "--disable-gpu",
        f"--remote-debugging-port={args.port}",
        f"--user-data-dir={profile}",
        f"--window-size={args.width},{args.height}",
        args.url,
    ])
    try:
        # รอ DevTools endpoint พร้อม แล้วหา page target ของเรา
        ws_url = None
        for _ in range(50):
            time.sleep(0.3)
            try:
                with urllib.request.urlopen(f"http://localhost:{args.port}/json/list") as r:
                    targets = json.load(r)
                pages = [t for t in targets if t.get("type") == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]
                    break
            except OSError:
                continue
        if not ws_url:
            raise SystemExit("no page target found")

        # ws://localhost:9222/devtools/page/<id>
        path = "/" + ws_url.split("/", 3)[3]
        sock = ws_connect("localhost", args.port, path)
        f = sock.makefile("rb")

        def call(msg_id, method, params=None):
            send_text(sock, json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                raw = recv_message(f, sock)
                if raw is None:
                    raise ConnectionError("CDP closed")
                msg = json.loads(raw)
                if msg.get("id") == msg_id:
                    return msg.get("result", {})

        time.sleep(args.wait)  # ให้เกม + WebSocket ทำงานตามเวลาจริง
        if args.eval_expr:
            res = call(2, "Runtime.evaluate", {
                "expression": args.eval_expr,
                "awaitPromise": True, "userGesture": True, "returnByValue": True,
            })
            print("eval:", json.dumps(res.get("result", {}).get("value"), ensure_ascii=False))
        result = call(1, "Page.captureScreenshot", {"format": "png"})
        Path(args.out).write_bytes(base64.b64decode(result["data"]))
        print(f"saved {args.out}")
        sock.close()
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
