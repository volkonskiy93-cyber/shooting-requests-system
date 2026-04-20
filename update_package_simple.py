#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import base64
import json
import urllib.request
import urllib.parse

token = 'YOUR_GITHUB_TOKEN_HERE'
repo = 'volkonskiy93-cyber/shooting-requests-system'
base_url = f'https://api.github.com/repos/{repo}/contents'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

file_name = 'package.json'

# Читаем файл
with open(file_name, 'r', encoding='utf-8') as f:
    content = f.read()

# Кодируем в base64
b64 = base64.b64encode(content.encode('utf-8')).decode('utf-8')

# Получаем SHA существующего файла
sha = None
try:
    get_url = f'{base_url}/{urllib.parse.quote(file_name)}'
    req = urllib.request.Request(get_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        sha = data.get('sha')
except:
    pass

# Создаем тело запроса
body = {
    'message': 'Update package.json - upgrade Node.js to 24.x',
    'content': b64
}

if sha:
    body['sha'] = sha

# Отправляем запрос
put_url = f'{base_url}/{urllib.parse.quote(file_name)}'
req = urllib.request.Request(put_url,
                             data=json.dumps(body).encode('utf-8'),
                             headers=headers,
                             method='PUT')

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print('✅ package.json updated successfully!')
        print(f'Commit: {result.get("commit", {}).get("sha", "N/A")}')
        print('Vercel will automatically redeploy')
except Exception as e:
    print(f'❌ Error: {e}')
