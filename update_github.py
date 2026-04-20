#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import base64
import json
import os
import urllib.request
import urllib.parse
import time

token = 'YOUR_GITHUB_TOKEN_HERE'
repo = 'volkonskiy93-cyber/-2'
base_url = f'https://api.github.com/repos/{repo}/contents'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

files = [
    'index.html',
    'admin.html',
    'auth.js',
    'data.js',
    'admin.js',
    'vercel.json',
    'package.json'
]

def update_file(file_name):
    try:
        file_path = file_name
        if not os.path.exists(file_path):
            print(f'❌ {file_name} не найден')
            return False
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
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
        
        body = {
            'message': f'Update {file_name}',
            'content': b64
        }
        
        if sha:
            body['sha'] = sha
        
        put_url = f'{base_url}/{urllib.parse.quote(file_name)}'
        req = urllib.request.Request(put_url, 
                                     data=json.dumps(body).encode('utf-8'),
                                     headers=headers,
                                     method='PUT')
        
        with urllib.request.urlopen(req) as response:
            print(f'✅ {file_name} - OK')
            return True
            
    except Exception as e:
        print(f'❌ {file_name} - ERROR: {str(e)}')
        return False

def update_deepseek_file():
    try:
        # Ищем файл с "общая" в названии
        files_list = os.listdir('.')
        deepseek_file = None
        for f in files_list:
            if 'общая' in f and f.endswith('.html'):
                deepseek_file = f
                break
        
        if not deepseek_file:
            print('❌ deepseek_htmlобщая.html не найден')
            return False
        
        with open(deepseek_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        b64 = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        
        sha = None
        try:
            get_url = f'{base_url}/{urllib.parse.quote(deepseek_file)}'
            req = urllib.request.Request(get_url, headers=headers)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                sha = data.get('sha')
        except:
            pass
        
        body = {
            'message': f'Update {deepseek_file} - добавлена функция выгрузки в DOC',
            'content': b64
        }
        
        if sha:
            body['sha'] = sha
        
        put_url = f'{base_url}/{urllib.parse.quote(deepseek_file)}'
        req = urllib.request.Request(put_url,
                                     data=json.dumps(body).encode('utf-8'),
                                     headers=headers,
                                     method='PUT')
        
        with urllib.request.urlopen(req) as response:
            print(f'✅ {deepseek_file} - OK')
            return True
            
    except Exception as e:
        print(f'❌ deepseek_htmlобщая.html - ERROR: {str(e)}')
        return False

def main():
    print('========================================')
    print('  ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB')
    print('========================================\n')
    
    success = 0
    fail = 0
    
    for file_name in files:
        if update_file(file_name):
            success += 1
        else:
            fail += 1
        time.sleep(0.5)
    
    if update_deepseek_file():
        success += 1
    else:
        fail += 1
    
    print('\n========================================')
    print(f'Результат: Success={success} Errors={fail}')
    print('========================================\n')
    print('Ссылка на проект: https://2-git-main-pendehos-projects.vercel.app')
    print('Подождите 1-2 минуты для автоматического деплоя на Vercel')

if __name__ == '__main__':
    main()
