# -*- coding: utf-8 -*-
import os
import sys

root = r'c:\Исходники DaVinci'
found = False
excel_files = []

for r, d, files in os.walk(root):
    # Проверяем папки
    for dir_name in d:
        if 'выработка' in dir_name.lower():
            print(f"Папка найдена: {os.path.join(r, dir_name)}")
            found = True
    
    # Проверяем файлы
    for f in files:
        if 'прошлое' in f.lower():
            full_path = os.path.join(r, f)
            print(f"Файл найден: {full_path}")
            if f.endswith(('.xlsx', '.xls', '.xlsm')):
                excel_files.append(full_path)
            found = True
        # Также ищем Excel файлы в папке выработка
        if 'выработка' in r.lower() and (f.endswith('.xlsx') or f.endswith('.xls') or f.endswith('.xlsm')):
            full_path = os.path.join(r, f)
            print(f"Excel файл в папке выработка: {full_path}")
            excel_files.append(full_path)
            found = True

if not found:
    print("Файлы не найдены")
else:
    print(f"\nНайдено Excel файлов: {len(excel_files)}")
    for f in excel_files:
        print(f"  - {f}")
