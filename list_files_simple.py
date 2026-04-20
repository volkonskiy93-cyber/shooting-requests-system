# -*- coding: utf-8 -*-
import os

root = r'C:\Исходники DaVinci\дут'
output = r'C:\Исходники DaVinci\дут\all_files_list.txt'

with open(output, 'w', encoding='utf-8') as f:
    for item in os.listdir(root):
        f.write(item + '\n')

print(f"List of files saved to {output}")
