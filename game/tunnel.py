"""เปิด DataX Town สู่อินเทอร์เน็ตผ่าน Cloudflare Quick Tunnel (ฟรี ไม่ต้องสมัคร)

ใช้คู่กับ server.py ที่รันอยู่แล้ว:
    หน้าต่าง 1: python server.py            (เกม + WebSocket ที่พอร์ต 8700)
    หน้าต่าง 2: python tunnel.py            (ได้ลิงก์ https://xxx.trycloudflare.com)
แล้วแชร์ลิงก์ที่ได้ให้เพื่อนที่อยู่นอกวง LAN — รองรับ WebSocket (wss) ในตัว

หมายเหตุ: Quick Tunnel ได้ URL สุ่มใหม่ทุกครั้งที่รัน และมีอายุเท่าที่หน้าต่างนี้เปิดอยู่
ถ้าต้องการ URL ถาวรให้ใช้ Cloudflare named tunnel (ต้องมีบัญชี + โดเมน)

ครั้งแรกสคริปต์จะดาวน์โหลด cloudflared.exe (~60MB) มาไว้ที่ ../bin/ ให้อัตโนมัติ
"""
import argparse
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

BIN_DIR = Path(__file__).resolve().parent.parent / "bin"
EXE = BIN_DIR / "cloudflared.exe"
DOWNLOAD_URL = ("https://github.com/cloudflare/cloudflared/releases/latest/download/"
                "cloudflared-windows-amd64.exe")
URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")


def ensure_cloudflared():
    if EXE.exists():
        return
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    print(f"กำลังดาวน์โหลด cloudflared (~60MB) -> {EXE}")
    tmp = EXE.with_suffix(".part")
    urllib.request.urlretrieve(DOWNLOAD_URL, tmp)
    tmp.rename(EXE)
    print("ดาวน์โหลดเสร็จ")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8700)
    ap.add_argument("--key", default=None, help="ถ้า server.py รันด้วย --key ให้ใส่ตัวเดียวกันเพื่อพิมพ์ลิงก์แชร์ให้ครบ")
    args = ap.parse_args()

    ensure_cloudflared()
    proc = subprocess.Popen(
        [str(EXE), "tunnel", "--url", f"http://localhost:{args.port}"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        encoding="utf-8", errors="replace",
    )
    print("กำลังสร้างอุโมงค์ ...")
    public_url = None
    try:
        for line in proc.stdout:
            if not public_url:
                m = URL_RE.search(line)
                if m:
                    public_url = m.group(0)
                    share = public_url + (f"/?key={args.key}" if args.key else "")
                    print()
                    print("=" * 64)
                    print("  DataX Town ออนไลน์แล้ว! แชร์ลิงก์นี้ให้เพื่อน (นอก LAN ก็เข้าได้):")
                    print(f"  {share}")
                    print("=" * 64)
                    print("(ปิดหน้าต่างนี้ = ปิดอุโมงค์; URL เปลี่ยนใหม่ทุกครั้งที่รัน)")
        proc.wait()
    except KeyboardInterrupt:
        proc.terminate()
        sys.exit(0)


if __name__ == "__main__":
    main()
