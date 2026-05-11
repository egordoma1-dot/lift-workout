from __future__ import annotations

import json
import mimetypes
import os
import re
import shutil
import sys
import tempfile
import threading
import time
import urllib.parse
import zipfile
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

PORT = int(os.environ.get("LIFT_PORT", "5180"))
HOST = os.environ.get("LIFT_HOST", "0.0.0.0")
RUNTIME_DIR = Path(__file__).resolve().parent
APP_ROOT = RUNTIME_DIR.parent
VERSIONS_DIR = APP_ROOT / "versions"
RELEASES_DIR = VERSIONS_DIR / "releases"
SAVERS_DIR = VERSIONS_DIR / "savers"
TMP_DIR = VERSIONS_DIR / "tmp"
RESTART_FLAG = VERSIONS_DIR / "_restart_requested.flag"


def now_stamp() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S")


def safe_filename(name: str) -> str:
    name = urllib.parse.unquote(name or "Lift-update.zip")
    name = Path(name.replace("\\", "/")).name
    name = re.sub(r"[^A-Za-z0-9А-Яа-я._() +\\-]", "-", name).strip(" .")
    if not name.lower().endswith(".zip"):
        name += ".zip"
    return name or "Lift-update.zip"


def ensure_storage() -> None:
    for path in (VERSIONS_DIR, RELEASES_DIR, SAVERS_DIR, TMP_DIR):
        path.mkdir(parents=True, exist_ok=True)


def app_version() -> str:
    try:
        text = (RUNTIME_DIR / "app.js").read_text(encoding="utf-8", errors="replace")
        m = re.search(r"APP_VERSION\s*=\s*'([^']+)'", text)
        return m.group(1) if m else "LIFT"
    except Exception:
        return "LIFT"


def version_from_zip(path: Path) -> str:
    try:
        with zipfile.ZipFile(path, "r") as zf:
            app_names = [n for n in zf.namelist() if n.endswith("LiftWeb/app.js") or n == "LiftWeb/app.js"]
            if app_names:
                text = zf.read(app_names[0]).decode("utf-8", errors="replace")
                m = re.search(r"APP_VERSION\s*=\s*'([^']+)'", text)
                if m:
                    return m.group(1)
    except Exception:
        pass
    cleaned = path.stem
    cleaned = re.sub(r"^Lift[- ]update[- ]", "", cleaned, flags=re.I)
    cleaned = re.sub(r"^Lift[- ]", "", cleaned, flags=re.I)
    return cleaned


def list_releases() -> list[dict]:
    ensure_storage()
    current = app_version()
    rows = []
    for path in sorted(RELEASES_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
        version = version_from_zip(path)
        rows.append({
            "name": path.name,
            "version": version,
            "current": version == current,
            "bytes": path.stat().st_size,
            "created": time.strftime("%Y-%m-%d %H:%M", time.localtime(path.stat().st_mtime)),
        })
    rows.sort(key=lambda row: (not row.get("current", False), row.get("version", ""), row.get("name", "")))
    return rows[:20]


def info() -> dict:
    ensure_storage()
    current = app_version()
    return {
        "ok": True,
        "app_version": current,
        "target_version": current,
        "app_root": str(APP_ROOT),
        "runtime": str(RUNTIME_DIR),
        "versions": {
            "root": str(VERSIONS_DIR),
            "releases_dir": str(RELEASES_DIR),
            "savers_dir": str(SAVERS_DIR),
            "releases": list_releases(),
            "savers": sorted([p.name for p in SAVERS_DIR.glob("Lift-saver-v*.txt")], reverse=True)[:12],
        },
    }


def find_update_root(tmp: Path) -> Path:
    # Accept either root/LiftWeb or one top folder/LiftWeb.
    if (tmp / "LiftWeb").is_dir():
        return tmp
    candidates = [p for p in tmp.iterdir() if p.is_dir() and (p / "LiftWeb").is_dir()]
    if candidates:
        return candidates[0]
    raise RuntimeError("Update zip must contain a LiftWeb/ folder.")


def iter_saver_candidates(update_root: Path):
    # Normal new update packages keep savers inside LiftWeb/_update_savers/.
    candidate_dirs = [
        update_root / "LiftWeb" / "_update_savers",
        update_root / "versions" / "savers",
        update_root / "_update_savers",
        update_root,  # legacy fallback only; never copied back to app root.
    ]
    seen = set()
    for folder in candidate_dirs:
        if not folder.exists() or not folder.is_dir():
            continue
        for saver in folder.glob("Lift-saver-v*.txt"):
            resolved = saver.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            yield saver


def copy_savers(update_root: Path) -> None:
    ensure_storage()
    for saver in iter_saver_candidates(update_root):
        shutil.copy2(saver, SAVERS_DIR / saver.name)


def import_runtime_savers() -> None:
    ensure_storage()
    runtime_savers = RUNTIME_DIR / "_update_savers"
    if runtime_savers.exists():
        for saver in runtime_savers.glob("Lift-saver-v*.txt"):
            shutil.copy2(saver, SAVERS_DIR / saver.name)
        shutil.rmtree(runtime_savers, ignore_errors=True)


def cleanup_root_savers() -> None:
    ensure_storage()
    for saver in APP_ROOT.glob("Lift-saver-v*.txt"):
        try:
            shutil.copy2(saver, SAVERS_DIR / saver.name)
            saver.unlink()
        except Exception:
            pass


def overlay_tree(src: Path, dst: Path) -> None:
    # Partial-update friendly: copy changed files over the existing runtime.
    # Missing files in the update zip do not delete existing runtime files.
    dst.mkdir(parents=True, exist_ok=True)
    for item in src.iterdir():
        target = dst / item.name
        if item.is_dir():
            if item.name == "_update_savers":
                continue
            overlay_tree(item, target)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)


def install_update_zip(zip_path: Path) -> str:
    ensure_storage()
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    extract_to = Path(tempfile.mkdtemp(prefix="lift_update_", dir=str(TMP_DIR)))
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_to)
    update_root = find_update_root(extract_to)
    new_runtime = update_root / "LiftWeb"
    if not new_runtime.exists() or not new_runtime.is_dir():
        raise RuntimeError("Update zip must contain LiftWeb/.")

    # p.28.1+: overlay changed runtime files instead of replacing the whole runtime.
    # This lets future updates be real patches rather than full app folders.
    overlay_tree(new_runtime, RUNTIME_DIR)

    # Update launcher only if package explicitly includes one.
    for launcher_name in ("Start Local.bat", "start local.bat"):
        src = update_root / launcher_name
        if src.exists():
            shutil.copy2(src, APP_ROOT / "Start Local.bat")
            break

    copy_savers(update_root)
    import_runtime_savers()
    cleanup_root_savers()
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    return app_version()


def request_restart() -> None:
    ensure_storage()
    RESTART_FLAG.write_text(f"restart requested {now_stamp()}\n", encoding="utf-8")


def exit_soon() -> None:
    time.sleep(1.0)
    os._exit(0)


class LiftHandler(BaseHTTPRequestHandler):
    server_version = "LiftLocal/0.2.2"

    def log_message(self, fmt: str, *args) -> None:
        print("%s - %s" % (self.address_string(), fmt % args))

    def send_json(self, payload: dict, status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, path: Path) -> None:
        try:
            path = path.resolve()
            if not str(path).startswith(str(RUNTIME_DIR.resolve())):
                self.send_error(403)
                return
            if not path.exists() or not path.is_file():
                self.send_error(404)
                return
            data = path.read_bytes()
            ctype = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            if path.suffix == ".js":
                ctype = "application/javascript; charset=utf-8"
            elif path.suffix == ".css":
                ctype = "text/css; charset=utf-8"
            elif path.suffix in {".html", ".htm"}:
                ctype = "text/html; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:
            self.send_error(500, str(exc))

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path in ("/api/app-info", "/api/library-info"):
            return self.send_json(info())
        if path == "/" or path == "":
            return self.send_file(RUNTIME_DIR / "index.html")
        rel = urllib.parse.unquote(path.lstrip("/"))
        if rel.startswith("api/"):
            return self.send_json({"ok": False, "error": "Unknown API endpoint"}, 404)
        return self.send_file(RUNTIME_DIR / rel)

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8") or "{}")

    def install_uploaded_update(self) -> None:
        ensure_storage()
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0:
            raise RuntimeError("Empty update upload.")
        raw_name = self.headers.get("X-Filename") or "Lift-update.zip"
        name = safe_filename(raw_name)
        target = RELEASES_DIR / name
        if target.exists():
            stem, suffix = target.stem, target.suffix
            target = RELEASES_DIR / f"{stem}-{int(time.time())}{suffix}"
        with target.open("wb") as f:
            remaining = length
            while remaining:
                chunk = self.rfile.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                f.write(chunk)
                remaining -= len(chunk)
        with zipfile.ZipFile(target, "r") as zf:
            bad = zf.testzip()
            if bad:
                raise RuntimeError(f"Bad zip member: {bad}")
        target_version = install_update_zip(target)
        request_restart()
        payload = info()
        payload.update({
            "ok": True,
            "target_version": target_version,
            "message": f"Installed {target.name}. Restarting…",
        })
        self.send_json(payload)
        threading.Thread(target=exit_soon, daemon=True).start()

    def switch_stored_version(self) -> None:
        ensure_storage()
        body = self.read_json_body()
        name = safe_filename(body.get("name") or "")
        target = RELEASES_DIR / name
        if not target.exists():
            raise RuntimeError("Stored version zip was not found.")
        target_version = install_update_zip(target)
        request_restart()
        payload = info()
        payload.update({
            "ok": True,
            "target_version": target_version,
            "message": f"Switched to {version_from_zip(target)}. Restarting…",
        })
        self.send_json(payload)
        threading.Thread(target=exit_soon, daemon=True).start()

    def delete_stored_version(self) -> None:
        ensure_storage()
        body = self.read_json_body()
        name = safe_filename(body.get("name") or "")
        target = RELEASES_DIR / name
        if not target.exists():
            raise RuntimeError("Stored version zip was not found.")
        target_version = version_from_zip(target)
        if target_version == app_version():
            raise RuntimeError("Current version cannot be deleted.")
        target.unlink()
        payload = info()
        payload.update({"ok": True, "message": f"Deleted {target_version}."})
        self.send_json(payload)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            if parsed.path == "/api/install-update":
                return self.install_uploaded_update()
            if parsed.path == "/api/switch-version":
                return self.switch_stored_version()
            if parsed.path == "/api/delete-version":
                return self.delete_stored_version()
            return self.send_json({"ok": False, "error": "Unknown API endpoint"}, 404)
        except Exception as exc:
            self.send_json({"ok": False, "error": f"{type(exc).__name__}: {exc}"}, 500)


def main() -> None:
    ensure_storage()
    import_runtime_savers()
    cleanup_root_savers()
    print(f"LIFT running at http://127.0.0.1:{PORT}")
    print(f"App folder: {APP_ROOT}")
    print(f"Versions: {VERSIONS_DIR}")
    httpd = ThreadingHTTPServer((HOST, PORT), LiftHandler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
