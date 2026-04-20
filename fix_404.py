#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import base64
import json
import urllib.request
import urllib.parse
import shutil
import os

token = 'YOUR_GITHUB_TOKEN_HERE'
repo = 'volkonskiy93-cyber/shooting-requests-system'
base_url = f'https://api.github.com/repos/{repo}/contents'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

print('=' * 60)
print('ИСПРАВЛЕНИЕ ОШИБКИ 404')
print('=' * 60)
print()

# Шаг 1: Копируем deepseek_htmlобщая.html в forms.html
source_file = 'deepseek_htmlобщая.html'
target_file = 'forms.html'

if os.path.exists(source_file):
    print(f'📋 Копирую {source_file} -> {target_file}...')
    shutil.copy2(source_file, target_file)
    print(f'✅ Файл скопирован')
else:
    print(f'❌ Файл {source_file} не найден')
    exit(1)

print()

# Шаг 2: Загружаем forms.html на GitHub
print(f'📤 Загружаю {target_file} на GitHub...')

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

b64 = base64.b64encode(content.encode('utf-8')).decode('utf-8')

# Проверяем существование файла
sha = None
try:
    get_url = f'{base_url}/{urllib.parse.quote(target_file)}'
    req = urllib.request.Request(get_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        sha = data.get('sha')
    print('  Файл существует на GitHub, обновляем...')
except:
    print('  Создаем новый файл...')

# Создаем тело запроса
body = {
    'message': 'Add forms.html - fix 404 error for correspondent page',
    'content': b64
}

if sha:
    body['sha'] = sha

# Отправляем запрос
put_url = f'{base_url}/{urllib.parse.quote(target_file)}'
req = urllib.request.Request(put_url,
                             data=json.dumps(body).encode('utf-8'),
                             headers=headers,
                             method='PUT')

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(f'✅ {target_file} успешно загружен на GitHub!')
        print(f'   Commit SHA: {result.get("commit", {}).get("sha", "N/A")[:8]}...')
except Exception as e:
    print(f'❌ Ошибка: {e}')
    exit(1)

print()
print('=' * 60)
print('✅ ГОТОВО!')
print('=' * 60)
print()
print('Vercel автоматически пересоберет проект через 1-2 минуты')
print('Ссылка: https://shooting-requests-system.vercel.app')
