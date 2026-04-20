# -*- coding: utf-8 -*-
import os

def find_excel_files(root_dir):
    excel_extensions = ('.xlsx', '.xls', '.xlsm')
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(excel_extensions):
                print(os.path.join(root, file))

if __name__ == "__main__":
    print("Searching in c:\\Исходники DaVinci...")
    find_excel_files(r'c:\Исходники DaVinci')
    print("\nSearching in c:\\USB Dima...")
    find_excel_files(r'c:\USB Dima')
