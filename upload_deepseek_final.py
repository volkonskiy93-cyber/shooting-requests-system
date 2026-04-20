#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import base64
import json
import urllib.request
import urllib.parse
import os

token = 'YOUR_GITHUB_TOKEN_HERE'
repo = 'volkonskiy93-cyber/shooting-requests-system'
base_url = f'https://api.github.com/repos/{repo}/contents'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

# Ищем файл
files = os.listdir('.')
deepseek_file = None
for f in files:
    if 'общая' in f and f.endswith('.html'):
        deepseek_file = f
        break

if not deepseek_file:
    print('❌ Файл deepseek_htmlобщая.html не найден')
    exit(1)

print(f'✅ Найден файл: {deepseek_file}')
print('Загрузка на GitHub...')

# Читаем файл
with open(deepseek_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Кодируем в base64
b64 = base64.b64encode(content.encode('utf-8')).decode('utf-8')

# Получаем SHA существующего файла
sha = None
try:
    get_url = f'{base_url}/{urllib.parse.quote(deepseek_file)}'
    req = urllib.request.Request(get_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        sha = data.get('sha')
    print('Файл существует на GitHub, обновляем...')
except:
    print('Файл не существует на GitHub, создаем новый...')

# Создаем тело запроса
body = {
    'message': 'Add/Update deepseek_htmlобщая.html - fix form opening',
    'content': b64
}

if sha:
    body['sha'] = sha

# Отправляем запрос
put_url = f'{base_url}/{urllib.parse.quote(deepseek_file)}'
req = urllib.request.Request(put_url,
                             data=json.dumps(body).encode('utf-8'),
                             headers=headers,
                             method='PUT')

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print('✅ Файл успешно загружен на GitHub!')
        print(f'Commit SHA: {result.get("commit", {}).get("sha", "N/A")}')
        print('Vercel автоматически пересоберет проект')
except Exception as e:
    print(f'❌ Ошибка: {e}')
