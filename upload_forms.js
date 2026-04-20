const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'YOUR_GITHUB_TOKEN_HERE';
const repo = 'volkonskiy93-cyber/shooting-requests-system';
const baseUrl = `https://api.github.com/repos/${repo}/contents`;

console.log('========================================');
console.log('  FIXING 404 ERROR');
console.log('========================================');
console.log('');

// Step 1: Copy file
const source = 'deepseek_htmlобщая.html';
const target = 'forms.html';

if (!fs.existsSync(source)) {
    console.error(`ERROR: ${source} not found`);
    process.exit(1);
}

console.log(`Copying ${source} -> ${target}...`);
fs.copyFileSync(source, target);
console.log('File copied');
console.log('');

// Step 2: Read file
console.log(`Reading ${target}...`);
const content = fs.readFileSync(target, 'utf8');
const b64 = Buffer.from(content, 'utf8').toString('base64');

console.log(`File size: ${content.length} characters`);
console.log('');

// Step 3: Check if file exists
console.log('Checking GitHub...');
checkAndUpload();

function checkAndUpload(sha = null) {
    const url = `${baseUrl}/forms.html`;
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${repo}/contents/forms.html`,
        method: sha ? 'PUT' : 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Node.js',
            'Content-Type': 'application/json'
        }
    };

    if (sha) {
        // Upload file
        console.log('Uploading to GitHub...');
        const body = JSON.stringify({
            message: 'Add forms.html - fix 404 error for correspondent page',
            content: b64,
            sha: sha
        });
        options.headers['Content-Length'] = Buffer.byteLength(body);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    const result = JSON.parse(data);
                    console.log('');
                    console.log('SUCCESS! File uploaded to GitHub');
                    console.log(`Commit SHA: ${result.commit.sha.substring(0, 8)}...`);
                    console.log('');
                    console.log('Vercel will auto-redeploy in 1-2 minutes');
                    console.log('URL: https://shooting-requests-system.vercel.app');
                    console.log('');
                    console.log('========================================');
                    console.log('  DONE');
                    console.log('========================================');
                } else {
                    console.error(`ERROR: ${res.statusCode} ${res.statusMessage}`);
                    console.error(data);
                    process.exit(1);
                }
            });
        });
        
        req.on('error', (e) => {
            console.error(`ERROR: ${e.message}`);
            process.exit(1);
        });
        
        req.write(body);
        req.end();
    } else {
        // Check if file exists
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('File exists, updating...');
                    checkAndUpload(result.sha);
                } else {
                    console.log('Creating new file...');
                    checkAndUpload(null);
                }
            });
        });
        
        req.on('error', (e) => {
            console.error(`ERROR: ${e.message}`);
            process.exit(1);
        });
        
        req.end();
    }
}
