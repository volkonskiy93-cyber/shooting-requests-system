# -*- coding: utf-8 -*-
import os

search_dirs = [r'c:\Исходники DaVinci', r'c:\Users\user\Downloads', r'c:\Users\user\Documents', r'c:\USB Dima']
output_file = r'c:\Исходники DaVinci\дут\find_past_time_results.txt'

found_files = []

for s_dir in search_dirs:
    if os.path.exists(s_dir):
        for root, dirs, files in os.walk(s_dir):
            for file in files:
                if 'прошлое' in file.lower() and file.endswith(('.xlsx', '.xls', '.xlsm')):
                    found_files.append(os.path.join(root, file))

with open(output_file, 'w', encoding='utf-8') as f:
    if found_files:
        f.write("Найденные файлы:\n")
        for path in found_files:
            f.write(path + "\n")
    else:
        f.write("Файлы не найдены.")

print(f"Результаты поиска записаны в {output_file}")
