"""
Скрипт для копирования Excel-шаблонов (ФИГАРО/ТТК) в папку проекта.

Зачем: файлы-шаблоны часто лежат на Desktop, а проект генерирует Excel "с нуля",
из-за чего теряются выпадающие списки/валидации. Этот скрипт ищет .xlsx на рабочем
столе и копирует их в папку excel_templates/ под ASCII-именами.
"""

from __future__ import annotations

import os
import re
import shutil
from pathlib import Path


def _guess_kind(filename: str) -> str | None:
    n = filename.lower()
    if "ттк" in n or "ttk" in n:
        return "ttk"
    if "фигаро" in n or "figaro" in n:
        return "figaro"
    return None


def main() -> int:
    desktop = Path(os.path.expanduser("~")) / "Desktop"
    if not desktop.exists():
        print(f"❌ Desktop не найден: {desktop}")
        return 1

    found: dict[str, Path] = {}
    candidates: list[Path] = []

    for p in desktop.rglob("*.xlsx"):
        # игнорируем временные/офисные файлы
        if p.name.startswith("~$"):
            continue
        candidates.append(p)
        kind = _guess_kind(p.name)
        if kind and kind not in found:
            found[kind] = p

    print(f"Найдено .xlsx на Desktop: {len(candidates)}")
    for p in candidates[:50]:
        print(" -", p)
    if len(candidates) > 50:
        print(" ...")

    out_dir = Path(__file__).resolve().parent / "excel_templates"
    out_dir.mkdir(parents=True, exist_ok=True)

    copied = []
    for kind in ("figaro", "ttk"):
        src = found.get(kind)
        if not src:
            print(f"⚠️ Не найден шаблон для {kind.upper()} на Desktop (по имени файла).")
            continue
        dst = out_dir / f"{kind}_template.xlsx"
        shutil.copy2(src, dst)
        copied.append((kind, src, dst))

    print()
    if not copied:
        print("НЕ УДАЛОСЬ найти шаблоны по имени файла.")
        print("Подсказка: назовите файлы на Desktop так, чтобы содержали 'ТТК' и 'ФИГАРО',")
        print("или 'ttk'/'figaro' в названии, и запустите скрипт снова.")
        return 2

    print("СКОПИРОВАНО:")
    for kind, src, dst in copied:
        print(f" - {kind.upper()}:")
        print(f"   src: {src}")
        print(f"   dst: {dst}")

    print()
    print("Дальше: генератор Excel будет использовать excel_templates/*.xlsx как шаблоны.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

