# -*- coding: utf-8 -*-
import os

path = r'c:\Исходники DaVinci\дут\выработка'
output = r'c:\Исходники DaVinci\дут\check_files.txt'

with open(output, 'w', encoding='utf-8') as f:
    if os.path.exists(path):
        f.write(f"Contents of {path}:\n")
        for item in os.listdir(path):
            f.write(f"  - {item}\n")
    else:
        f.write(f"Path {path} does not exist.\n")

    # Проверим еще корень
    root = r'c:\Исходники DaVinci\дут'
    f.write(f"\nCSV files in {root}:\n")
    for item in os.listdir(root):
        if item.endswith('.csv'):
            f.write(f"  - {item}\n")
