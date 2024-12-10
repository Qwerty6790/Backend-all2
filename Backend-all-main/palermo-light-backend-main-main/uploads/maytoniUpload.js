const mongoose = require('mongoose');

const axios = require('axios');
const xml2js = require('xml2js');
const { MaytoniProductModel } = require('../app/products/productModel');

// Connect to MongoDB
mongoose.connect('mongodb+srv://MoreElectriki:GhH3bpAvDN51IsF7@cluster0moreelecktirki.ftsf8.mongodb.net/MoreElecktriki?retryWrites=true&w=majority&appName=Cluster0MoreElecktirki', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout for server selection
});

const parseXML = async (xml) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, (err, result) => {
            if (err) {
                reject('Ошибка парсинга XML: ' + err);
            } else {
                resolve(result);
            }
        });
    });
};

const uploadProductsByMaytoni = async () => {
    const url = 'https://mais-upload.maytoni.de/YML/all.yml';
    const pLimit = (await import('p-limit')).default; // Dynamically import p-limit
    const limit = pLimit(10); // Ограничение на 10 параллельных задач

    try {
        console.log('Fetching data from URL: ' + url);
        const response = await axios.get(url);
        const xmlData = response.data;

        const result = await parseXML(xmlData);
        console.log('XML parsing completed successfully.');

        if (!result || !result.yml_catalog || !result.yml_catalog.shop || !result.yml_catalog.shop[0].offers) {
            console.error('No product data found in XML');
            return;
        }

        const products = result.yml_catalog.shop[0].offers[0].offer;
        console.log(`Found ${products.length} products for processing.`);

        const tasks = products.map((lightData) => limit(async () => {
            // Извлечение цены из `priceWB`
            const retailPrice = lightData.priceWB && lightData.priceWB[0]
                ? parseFloat(lightData.priceWB[0])
                : 0;

            const productData = {
                article: lightData.vendorCode && lightData.vendorCode[0] ? lightData.vendorCode[0] : '',
                name: lightData.name && lightData.name[0] ? lightData.name[0] : '',
                price: retailPrice,
                stock: lightData.param?.find((param) => param.$?.name === 'Остаток')?._ || 0,
                imageAddress: lightData.picture && lightData.picture[0] ? lightData.picture[0] : '',
                source: 'MaytoniProduct',
            };

            if (!productData.article || !productData.name) {
                console.warn('Skipping product due to missing required fields:', productData);
                return;
            }

            try {
                await MaytoniProductModel.findOneAndUpdate(
                    { article: productData.article },
                    productData,
                    { upsert: true, new: true }
                );
                console.log(`Product with article ${productData.article} updated successfully.`);
            } catch (err) {
                console.error(`Error updating product with article ${productData.article}:`, err);
            }
        }));

        await Promise.all(tasks);
        console.log('All products successfully updated or created.');
    } catch (error) {
        console.error('Error fetching XML data: ' + error.message);
    }
};




uploadProductsByMaytoni();
