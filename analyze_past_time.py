# -*- coding: utf-8 -*-
import pandas as pd
import os

def create_report():
    file_path = r'c:\Users\user\Downloads\Прошлое время 2026 (1).xlsx'
    output_html = r'c:\Исходники DaVinci\дут\report.html'
    
    if not os.path.exists(file_path):
        # Пробуем без (1)
        file_path = r'c:\Users\user\Downloads\Прошлое время 2026.xlsx'
        if not os.path.exists(file_path):
            with open(output_html, 'w', encoding='utf-8') as f:
                f.write("<h1>Файл не найден в Загрузках</h1>")
            return

    try:
        df = pd.read_excel(file_path)
        
        html = f"<h1>Анализ файла: {os.path.basename(file_path)}</h1>"
        html += f"<p><b>Колонки:</b> {', '.join(df.columns.tolist())}</p>"
        
        # Поиск фильтров
        for col in df.columns:
            if any(word in str(col).lower() for word in ['корреспондент', 'редактор', 'автор']):
                unique_vals = df[col].dropna().unique().tolist()
                html += f"<h2>Фильтр по столбцу: {col}</h2>"
                html += "<ul>"
                for val in sorted(unique_vals):
                    count = (df[col] == val).sum()
                    html += f"<li>{val} (записей: {count})</li>"
                html += "</ul>"
        
        html += "<h2>Первые 20 строк данных:</h2>"
        html += df.head(20).to_html()
        
        with open(output_html, 'w', encoding='utf-8') as f:
            f.write(f"<html><head><meta charset='utf-8'></head><body>{html}</body></html>")
            
    except Exception as e:
        with open(output_html, 'w', encoding='utf-8') as f:
            f.write(f"<h1>Ошибка анализа: {str(e)}</h1>")

if __name__ == "__main__":
    create_report()
