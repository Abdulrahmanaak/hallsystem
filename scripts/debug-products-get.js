const https = require('https');

const API_KEY = '07ef494508aefabed688ff444';
const BASE_URL = 'https://www.qoyod.com/api/2.0';

function getProducts() {
    console.log('Fetching Products...');

    const options = {
        method: 'GET',
        headers: {
            'API-KEY': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const req = https.request(`${BASE_URL}/products?limit=1`, options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.products && json.products.length > 0) {
                    const p = json.products[0];
                    console.log('Keys:', Object.keys(p).join(', '));
                    console.log('Price Fields:', JSON.stringify(
                        Object.entries(p).filter(([k]) => k.includes('price') || k.includes('cost')).reduce((o, [k, v]) => ({ ...o, [k]: v }), {})
                    ));
                } else {
                    console.log('No products found.');
                }
            } catch (e) {
                console.log('Raw Body:', data);
            }
        });
    });

    req.on('error', e => console.error(e));
    req.end();
}

getProducts();
