# -*- coding: utf-8 -*-
import os

root = r'c:\Исходники DaVinci\дут'
output_file = r'c:\Исходники DaVinci\дут\project_scan_results.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(f"Сканирование директории: {root}\n\n")
    for r, d, files in os.walk(root):
        # Проверяем на наличие "выработка" в пути
        if 'выработка' in r.lower():
            f.write(f"НАЙДЕНА ПАПКА ВЫРАБОТКА: {r}\n")
            for file in files:
                f.write(f"  - {file}\n")
        
        for file in files:
            if 'прошлое' in file.lower():
                f.write(f"НАЙДЕН ФАЙЛ ПРОШЛОЕ: {os.path.join(r, file)}\n")
            
            # Также ищем любые Excel файлы, если "выработка" не найдена явно
            if file.endswith(('.xlsx', '.xls', '.xlsm')):
                f.write(f"Excel файл: {os.path.join(r, file)}\n")

print(f"Результаты сканирования записаны в {output_file}")
