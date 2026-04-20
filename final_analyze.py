# -*- coding: utf-8 -*-
import pandas as pd
import os

file_path = r'c:\Users\user\Downloads\Прошлое время 2026.xlsx'
output_txt = r'c:\Исходники DaVinci\дут\final_report.txt'

with open(output_txt, 'w', encoding='utf-8') as f:
    if os.path.exists(file_path):
        try:
            df = pd.read_excel(file_path)
            f.write(f"COLUMNS: {df.columns.tolist()}\n\n")
            f.write(f"FIRST 5 ROWS:\n{df.head(5).to_string()}\n\n")
            
            for col in df.columns:
                if any(x in str(col).lower() for x in ['корреспондент', 'редактор']):
                    vals = df[col].dropna().unique().tolist()
                    f.write(f"VALUES FOR {col}: {vals}\n")
        except Exception as e:
            f.write(f"ERROR: {str(e)}")
    else:
        f.write("FILE NOT FOUND")
