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
                console.log(`[${method} ${path}] STATUS: ${res.statusCode}`);
                if (res.statusCode >= 400) {
                    console.log('Error Body:', data);
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('Finding Hall Booking Service...');

    // 1. Search
    const searchRes = await request('/products?q[sku_eq]=HALL-SERVICE');
    let product;

    if (searchRes.products && searchRes.products.length > 0) {
        product = searchRes.products[0];
        console.log(`Found by SKU: ID=${product.id}, Name=${product.name_en}`);
    } else {
        console.log('Not found by SKU. Searching by Name...');
        const nameRes = await request('/products?q[name_ar_eq]=' + encodeURIComponent('خدمة حجز قاعة'));
        if (nameRes.products && nameRes.products.length > 0) {
            product = nameRes.products[0];
            console.log(`Found by Name: ID=${product.id}, Name=${product.name_en}`);
        }
    }

    if (!product) {
        console.error('Product Not Found! Cannot fix.');
        return;
    }

    console.log('Current Config:', {
        id: product.id,
        track_quantity: product.track_quantity,
        type: product.type
    });

    // 2. Fix
    console.log('Applying Fix: Setting track_quantity=0, type=Service...');
    const updateRes = await request(`/products/${product.id}`, 'PUT', {
        product: {
            track_quantity: "0",
            // type: "Service", // Type might be immutable? Let's try sending it.
            sale_item: "1",
            sales_account_id: "17" // Ensure account is set too
        }
    });

    console.log('Update Result:', JSON.stringify(updateRes, null, 2));
}

main();
