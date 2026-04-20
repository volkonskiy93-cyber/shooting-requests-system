const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'YOUR_GITHUB_TOKEN_HERE';
const repo = 'volkonskiy93-cyber/-2';
const baseUrl = `https://api.github.com/repos/${repo}/contents`;

const files = [
    'index.html',
    'admin.html',
    'auth.js',
    'data.js',
    'admin.js',
    'vercel.json',
    'package.json'
];

function base64Encode(str) {
    return Buffer.from(str, 'utf8').toString('base64');
}

function makeRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Node.js'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
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

async function updateFile(fileName) {
    try {
        const filePath = path.join(__dirname, fileName);
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ ${fileName} не найден`);
            return false;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const b64 = base64Encode(content);

        // Получаем SHA существующего файла
        let sha = null;
        try {
            const getUrl = `${baseUrl}/${encodeURIComponent(fileName)}`;
            const response = await makeRequest(getUrl, 'GET');
            if (response.status === 200) {
                sha = response.data.sha;
            }
        } catch (e) {
            // Файл не существует
        }

        const body = {
            message: `Update ${fileName}`,
            content: b64
        };

        if (sha) {
            body.sha = sha;
        }

        const putUrl = `${baseUrl}/${encodeURIComponent(fileName)}`;
        const result = await makeRequest(putUrl, 'PUT', body);

        if (result.status === 200 || result.status === 201) {
            console.log(`✅ ${fileName} - OK`);
            return true;
        } else {
            console.log(`❌ ${fileName} - ERROR: ${JSON.stringify(result.data)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${fileName} - ERROR: ${error.message}`);
        return false;
    }
}

async function updateDeepseekFile() {
    try {
        const files = fs.readdirSync(__dirname);
        const deepseekFile = files.find(f => f.includes('общая') && f.endsWith('.html'));
        
        if (!deepseekFile) {
            console.log('❌ deepseek_htmlобщая.html не найден');
            return false;
        }

        const filePath = path.join(__dirname, deepseekFile);
        const content = fs.readFileSync(filePath, 'utf8');
        const b64 = base64Encode(content);

        let sha = null;
        try {
            const getUrl = `${baseUrl}/${encodeURIComponent(deepseekFile)}`;
            const response = await makeRequest(getUrl, 'GET');
            if (response.status === 200) {
                sha = response.data.sha;
            }
        } catch (e) {
            // Файл не существует
        }

        const body = {
            message: `Update ${deepseekFile} - добавлена функция выгрузки в DOC`,
            content: b64
        };

        if (sha) {
            body.sha = sha;
        }

        const putUrl = `${baseUrl}/${encodeURIComponent(deepseekFile)}`;
        const result = await makeRequest(putUrl, 'PUT', body);

        if (result.status === 200 || result.status === 201) {
            console.log(`✅ ${deepseekFile} - OK`);
            return true;
        } else {
            console.log(`❌ ${deepseekFile} - ERROR: ${JSON.stringify(result.data)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ deepseek_htmlобщая.html - ERROR: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('========================================');
    console.log('  ОБНОВЛЕНИЕ ФАЙЛОВ НА GITHUB');
    console.log('========================================\n');

    let success = 0;
    let fail = 0;

    for (const file of files) {
        const result = await updateFile(file);
        if (result) success++;
        else fail++;
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const deepseekResult = await updateDeepseekFile();
    if (deepseekResult) success++;
    else fail++;

    console.log('\n========================================');
    console.log(`Результат: Success=${success} Errors=${fail}`);
    console.log('========================================\n');
    console.log('Ссылка на проект: https://2-git-main-pendehos-projects.vercel.app');
    console.log('Подождите 1-2 минуты для автоматического деплоя на Vercel');
}

main().catch(console.error);
