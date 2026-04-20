// Прямой доступ к GitHub API через Node.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
const REPO_OWNER = 'volkonskiy93-cyber';
const REPO_NAME = '-2';
const BASE_URL = `/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function updateFile(filePath, fileName) {
    console.log(`📄 Обновление файла: ${fileName}`);
    
    try {
        // Читаем файл
        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log(`  ✓ Файл прочитан (${fileContent.length} символов)`);
        
        // Кодируем в base64
        const base64Content = Buffer.from(fileContent, 'utf8').toString('base64');
        console.log(`  ✓ Файл закодирован в base64`);
        
        // Получаем SHA существующего файла
        let sha = null;
        try {
            const getOptions = {
                hostname: 'api.github.com',
                path: `${BASE_URL}/${encodeURIComponent(fileName)}`,
                method: 'GET',
                headers: {
                    'Authorization': `token ${TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Node.js'
                }
            };
            const existing = await makeRequest(getOptions);
            sha = existing.sha;
            console.log(`  ✓ Найден существующий файл, SHA: ${sha.substring(0, 8)}...`);
        } catch (e) {
            console.log(`  ℹ Файл не существует, будет создан новый`);
        }
        
        // Обновляем файл
        const updateBody = {
            message: 'Обновление стилей iOS 26',
            content: base64Content
        };
        if (sha) {
            updateBody.sha = sha;
        }
        
        const updateOptions = {
            hostname: 'api.github.com',
            path: `${BASE_URL}/${encodeURIComponent(fileName)}`,
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Node.js'
            }
        };
        
        await makeRequest(updateOptions, updateBody);
        console.log(`  ✅ Файл успешно обновлен!`);
        return true;
    } catch (error) {
        console.log(`  ❌ Ошибка: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Начало обновления файлов на GitHub...\n');
    
    const files = [
        { path: 'index.html', name: 'index.html' },
        { path: 'deepseek_htmlобщая.html', name: 'deepseek_htmlобщая.html' },
        { path: 'admin.html', name: 'admin.html' }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
        if (fs.existsSync(file.path)) {
            const result = await updateFile(file.path, file.name);
            if (result) {
                successCount++;
            } else {
                errorCount++;
            }
        } else {
            console.log(`❌ Файл не найден: ${file.path}`);
            errorCount++;
        }
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Результаты обновления:`);
    console.log(`  ✅ Успешно: ${successCount}`);
    console.log(`  ❌ Ошибок: ${errorCount}`);
    console.log('═══════════════════════════════════════════════════\n');
    
    if (errorCount === 0) {
        console.log('🎉 Все файлы успешно обновлены на GitHub!');
        process.exit(0);
    } else {
        console.log('⚠️ Некоторые файлы не удалось обновить');
        process.exit(1);
    }
}

main().catch(console.error);
