#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для сравнения Excel файлов заявок с формами в проекте
"""

import sys
import os

try:
    import openpyxl
except ImportError:
    print("Установите openpyxl: pip install openpyxl")
    sys.exit(1)

# Поля формы ФИГАРО из проекта
FIGARO_FIELDS = [
    "Название сюжета",
    "Аннотация к съемке и адрес локации",
    "Примечания (погода, парковка и т.д.)",
    "Аккредитация",
    "Режиссер (редактор)",
    "Корреспондент",
    "Продюсер",
    "Оператор",
    "Видеоинженер",
    "Дата подачи заявки",
    "Дата съемки",
    "Время съемки",
    "Дата эфира",
    "Оборудование"
]

# Поля формы ТТК из проекта
TTK_FIELDS = [
    "Название сюжета",
    "Аннотация к съемке и адрес локации",
    "Примечания (погода, парковка и т.д.)",
    "Аккредитация",
    "Уточнения",
    "Режиссер (редактор)",
    "Корреспондент",
    "Продюсер",
    "Оператор",
    "Видеоинженер",
    "Номер машины",
    "Дата подачи заявки",
    "Дата съемки",
    "Время съемки",
    "Продление",
    "Дата эфира",
    "Дата сдачи",
    "Оборудование"
]

def read_excel_file(file_path):
    """Читает Excel файл и возвращает список полей из первой строки"""
    try:
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active
        
        # Читаем первую строку как заголовки
        headers = []
        for cell in ws[1]:
            if cell.value:
                headers.append(str(cell.value).strip())
        
        return headers
    except Exception as e:
        print(f"Ошибка при чтении файла {file_path}: {e}")
        return None

def compare_fields(excel_fields, project_fields, form_name):
    """Сравнивает поля из Excel с полями проекта"""
    excel_set = set(excel_fields)
    project_set = set(project_fields)
    
    print(f"\n{'='*60}")
    print(f"Сравнение формы: {form_name}")
    print(f"{'='*60}\n")
    
    # Поля, которые есть в Excel, но нет в проекте
    only_in_excel = excel_set - project_set
    if only_in_excel:
        print(f"⚠️  Поля, которые есть в Excel, но ОТСУТСТВУЮТ в проекте:")
        for field in sorted(only_in_excel):
            print(f"   - {field}")
        print()
    
    # Поля, которые есть в проекте, но нет в Excel
    only_in_project = project_set - excel_set
    if only_in_project:
        print(f"⚠️  Поля, которые есть в проекте, но ОТСУТСТВУЮТ в Excel:")
        for field in sorted(only_in_project):
            print(f"   - {field}")
        print()
    
    # Поля, которые совпадают
    common_fields = excel_set & project_set
    if common_fields:
        print(f"✅ Поля, которые СОВПАДАЮТ ({len(common_fields)}):")
        for field in sorted(common_fields):
            print(f"   ✓ {field}")
        print()
    
    # Общая статистика
    print(f"📊 Статистика:")
    print(f"   Всего в Excel: {len(excel_fields)}")
    print(f"   Всего в проекте: {len(project_fields)}")
    print(f"   Совпадают: {len(common_fields)}")
    print(f"   Только в Excel: {len(only_in_excel)}")
    print(f"   Только в проекте: {len(only_in_project)}")
    
    # Проверка на полное совпадение
    if not only_in_excel and not only_in_project:
        print(f"\n✅ ✅ ✅ ВСЕ ПОЛЯ СОВПАДАЮТ! Формы идентичны!")
    else:
        print(f"\n⚠️  Есть различия между Excel и проектом")
    
    return {
        'excel_fields': excel_fields,
        'project_fields': project_fields,
        'common': common_fields,
        'only_excel': only_in_excel,
        'only_project': only_in_project
    }

def main():
    base_path = r"c:\Users\user\Desktop\дут"
    
    # Пути к Excel файлам
    figaro_excel = os.path.join(base_path, "Заявка ФИГАРО.xlsx")
    ttk_excel = os.path.join(base_path, "Заявка ТТК.xlsx")
    
    print("="*60)
    print("СРАВНЕНИЕ EXCEL ФАЙЛОВ С ФОРМАМИ ПРОЕКТА")
    print("="*60)
    
    # Проверка существования файлов
    if not os.path.exists(figaro_excel):
        print(f"❌ Файл не найден: {figaro_excel}")
    else:
        print(f"\n📄 Читаю файл: {figaro_excel}")
        figaro_excel_fields = read_excel_file(figaro_excel)
        if figaro_excel_fields:
            compare_fields(figaro_excel_fields, FIGARO_FIELDS, "ФИГАРО")
    
    if not os.path.exists(ttk_excel):
        print(f"❌ Файл не найден: {ttk_excel}")
    else:
        print(f"\n📄 Читаю файл: {ttk_excel}")
        ttk_excel_fields = read_excel_file(ttk_excel)
        if ttk_excel_fields:
            compare_fields(ttk_excel_fields, TTK_FIELDS, "ТТК")
    
    print("\n" + "="*60)
    print("СРАВНЕНИЕ ЗАВЕРШЕНО")
    print("="*60)

if __name__ == "__main__":
    main()
