# -*- coding: utf-8 -*-
import pandas as pd
import openpyxl
import os

file_path = r'c:\Users\user\Downloads\Прошлое время 2026.xlsx'
output_file = r'c:\Исходники DaVinci\дут\excel_analysis_report.txt'

def analyze():
    if not os.path.exists(file_path):
        return f"Файл не найден: {file_path}"
    
    results = []
    results.append("=" * 50)
    results.append(f"АНАЛИЗ ФАЙЛА: {os.path.basename(file_path)}")
    results.append("=" * 50)
    
    try:
        # Читаем все листы
        xl = pd.ExcelFile(file_path)
        results.append(f"Листы в файле: {xl.sheet_names}")
        
        for sheet_name in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            results.append(f"\n--- ЛИСТ: {sheet_name} ---")
            results.append(f"Размер: {df.shape[0]} строк, {df.shape[1]} столбцов")
            results.append(f"Столбцы: {df.columns.tolist()}")
            
            # Анализируем ключевые колонки
            for col in df.columns:
                col_name = str(col).lower()
                if any(word in col_name for word in ['корреспондент', 'редактор', 'автор', 'фио']):
                    unique_vals = df[col].dropna().unique().tolist()
                    results.append(f"\nФильтр [{col}]: {len(unique_vals)} уникальных значений")
                    results.append(f"Примеры: {unique_vals[:15]}")
            
            # Показываем первые 10 строк для понимания структуры
            results.append("\nПервые 10 строк данных:")
            results.append(df.head(10).to_string())
            
    except Exception as e:
        results.append(f"Ошибка при анализе: {str(e)}")
    
    return "\n".join(results)

if __name__ == "__main__":
    report = analyze()
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"Отчет сохранен в {output_file}")
