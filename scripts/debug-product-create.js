const https = require('https');

const API_KEY = '07ef494508aefabed688ff444';
const BASE_URL = 'https://www.qoyod.com/api/2.0';

function createProduct() {
    console.log('Testing Product Creation...');

    const payload = JSON.stringify({
        product: {
            name_ar: 'Test Service ' + Date.now(),
            name_en: 'Test Service ' + Date.now(),
            category_id: 1,
            type: 'Service',
            sku: 'TEST-SKU-' + Date.now(),
            product_unit_type_id: "7",

            sale_item: "1",
            sales_account_id: "17",
            selling_price: "10.0",

            purchase_item: "0",
            track_quantity: "0",
            tax_id: "1"
        }
    });

    const options = {
        method: 'POST',
        headers: {
            'API-KEY': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = https.request(`${BASE_URL}/products`, options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('BODY:', data);
        });
    });

    req.on('error', e => console.error(e));
    req.write(payload);
    req.end();
}

createProduct();
