const fs = require('fs');

const data = JSON.parse(fs.readFileSync('temp_qoyod_collection.json', 'utf8'));

function findPostProducts(items) {
    for (const item of items) {
        if (item.name === 'Products' || item.name === 'products') {
            // Look for POST method inside
            if (item.item) {
                return findPostProducts(item.item);
            }
        }

        if (item.request && item.request.method === 'POST' && item.request.url.path.includes('products')) {
            return item.request;
        }

        if (item.item) {
            const result = findPostProducts(item.item);
            if (result) return result;
        }
    }
    return null;
}

const req = findPostProducts(data.item);

if (req) {
    console.log('Found Request Body:');
    if (req.body && req.body.mode === 'raw') {
        console.log(req.body.raw);
    } else {
        console.log(JSON.stringify(req.body, null, 2));
    }
} else {
    console.log('POST /products not found.');
}
