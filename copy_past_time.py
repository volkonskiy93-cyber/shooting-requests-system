# -*- coding: utf-8 -*-
import os
import shutil

src_dir = r'c:\Users\user\Downloads'
dst_dir = r'c:\Исходники DaVinci\дут\выработка'

if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

files_to_copy = [
    'Прошлое время 2024.xlsx',
    'Прошлое время 2025.xlsx',
    'Прошлое время 2026.xlsx',
    'Прошлое время 2026 (1).xlsx'
]

print(f"Копирование файлов из {src_dir} в {dst_dir}...")

for filename in files_to_copy:
    src_path = os.path.join(src_dir, filename)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_dir)
        print(f"✅ Скопирован: {filename}")
    else:
        print(f"❌ Не найден в Загрузках: {filename}")

print("\nСодержимое папки выработка:")
for item in os.listdir(dst_dir):
    print(f"  - {item}")
