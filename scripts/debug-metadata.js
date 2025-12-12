const https = require('https');

const API_KEY = '07ef494508aefabed688ff444';
const BASE_URL = 'https://www.qoyod.com/api/2.0';

function fetchResource(resource) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: { 'API-KEY': API_KEY, 'Accept': 'application/json' }
        };

        const req = https.request(`${BASE_URL}/${resource}`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error(`Error parsing ${resource}:`, data);
                    resolve({});
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        console.log('Fetching Accounts...');
        const accountsData = await fetchResource('accounts');
        const revenueAccounts = (accountsData.accounts || []).filter(a => a.type === 'Revenue' || a.parent_type === 'Revenue');
        console.log('Revenue Accounts:', revenueAccounts.map(a => ({ id: a.id, name: a.name_en || a.name_ar, code: a.code })));

        console.log('\nFetching Unit Types...');
        const unitsData = await fetchResource('product_unit_types');
        console.log('Unit Types:', (unitsData.product_unit_types || []).map(u => ({ id: u.id, name: u.unit_name })));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
