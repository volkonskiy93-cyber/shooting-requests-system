"""
Extract CSS + body markup from the legacy `forms.html` (Vercel/static version)
into Flask-friendly assets:

- static/forms_vercel.css
- templates/_forms_vercel_body.html

This lets the Flask `/forms` page look identical while keeping Python backend logic.
"""

from __future__ import annotations

from pathlib import Path
import re


def _extract_first_style(html: str) -> str:
    m = re.search(r"<style>(.*?)</style>", html, flags=re.DOTALL | re.IGNORECASE)
    if not m:
        raise RuntimeError("No <style>...</style> found")
    return m.group(1).strip()


def _extract_first_body_container(html: str) -> str:
    # We want the first <body> ... first closing of the main container before the big <script>.
    body_start = html.lower().find("<body")
    if body_start < 0:
        raise RuntimeError("No <body> found")
    body_tag_end = html.find(">", body_start)
    if body_tag_end < 0:
        raise RuntimeError("Malformed <body> tag")
    body = html[body_tag_end + 1 :]

    # Find the first container opening
    container_idx = body.find('<div class="container"')
    if container_idx < 0:
        raise RuntimeError('No <div class="container"> found in body')
    body = body[container_idx:]

    # Cut before the first script tag after the container (legacy JS)
    script_idx = body.lower().find("<script")
    if script_idx < 0:
        raise RuntimeError("No <script> found after container (cannot determine cutoff)")
    body = body[:script_idx]

    # Light rewrite: make "back to main" go to Flask index
    body = body.replace("window.location.href='index.html'", "window.location.href='/'")

    return body.strip()


def main() -> int:
    project_root = Path(__file__).resolve().parent
    legacy = project_root / "forms.html"
    if not legacy.exists():
        print(f"ERROR: legacy file not found: {legacy}")
        return 1

    html = legacy.read_text(encoding="utf-8", errors="replace")

    css = _extract_first_style(html)
    body = _extract_first_body_container(html)

    static_dir = project_root / "static"
    templates_dir = project_root / "templates"
    static_dir.mkdir(parents=True, exist_ok=True)
    templates_dir.mkdir(parents=True, exist_ok=True)

    (static_dir / "forms_vercel.css").write_text(css + "\n", encoding="utf-8")
    (templates_dir / "_forms_vercel_body.html").write_text(body + "\n", encoding="utf-8")

    print("OK: wrote static/forms_vercel.css")
    print("OK: wrote templates/_forms_vercel_body.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

