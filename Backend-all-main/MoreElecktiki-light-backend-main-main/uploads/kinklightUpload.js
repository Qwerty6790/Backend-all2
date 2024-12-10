const axios = require('axios');
const xml2js = require('xml2js');
const iconv = require('iconv-lite');
const { KinkLightProductModel } = require('../app/products/productModel');

const uploadProductsByKinkLight = async () => {
    const url = 'https://kinklight.ru/obmen/yml/unir_full.xml';

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const xmlData = iconv.decode(Buffer.from(response.data), 'windows-1251');

        xml2js.parseString(xmlData, { explicitArray: false, trim: true }, async (err, result) => {
            if (err) {
                throw new Error('Ошибка парсинга XML: ' + err.message);
            }

            const offers = result.yml_catalog.shop.offers.offer;

            const updatePromises = Array.isArray(offers) ? offers.map(offer => {
                const price = parseFloat(offer.price.replace(/\s/g, '').replace(',', '.')) || 0;
                const stock = offer.stock || '0';
                const productName = (offer.name || '').trim();

                // Skip products with a price of 0
                if (price === 0) {
                    return Promise.resolve();
                }

                const imageUrl = Array.isArray(offer.picture) ? offer.picture[0] : offer.picture || '';

                const productData = {
                    article: offer.vendorCode || '',
                    name: productName,
                    price: price,
                    stock: stock,
                    imageAddress: imageUrl,
                    source: 'KinkLightProduct'  // Optional source field
                };

                // Use findOneAndUpdate to update or create a product
                return KinkLightProductModel.findOneAndUpdate(
                    { article: productData.article }, // Find by article
                    productData, // Update data
                    { upsert: true, new: true } // Create if it doesn't exist
                );
            }) : [];

            try {
                await Promise.all(updatePromises);
            } catch (saveError) {
                console.error('Ошибка обновления в БД: ' + saveError.message);
            }
        });
    } catch (error) {
        console.error('Ошибка при получении XML: ' + error.message);
    }
};

module.exports = { uploadProductsByKinkLight };
