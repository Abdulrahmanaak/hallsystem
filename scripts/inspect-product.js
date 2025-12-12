const https = require('https');

const API_KEY = '07ef494508aefabed688ff444';
const BASE_URL = 'www.qoyod.com';

function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: '/api/2.0' + path,
            method: method,
            headers: {
                'API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`STATUS: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    console.error('Invalid JSON:', data);
                    resolve(null);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('Fetching Product 38...');
    const data = await request('/products/38');
    if (data && data.product) {
        console.log('Product Check:');
        console.log('ID:', data.product.id);
        console.log('Type:', data.product.type);
        console.log('Track Quantity:', data.product.track_quantity);
        console.log('Category ID:', data.product.category_id);
    } else {
        console.log('Product not found or error');
    }
}

main();
