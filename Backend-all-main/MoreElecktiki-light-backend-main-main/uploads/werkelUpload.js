const axios = require('axios');
const xml2js = require('xml2js');
const { WerkelProductModel } = require('../app/products/productModel');

const uploadProductsByWerkel = async () => {
    const url = 'https://werkel.ru/prices/prices-werkel-rur.yml';

    try {
        const response = await axios.get(url);
        const xmlData = response.data;

        xml2js.parseString(xmlData, { explicitArray: false, trim: true }, async (err, result) => {
            if (err) {
                throw new Error('XML parsing error: ' + err.message);
            }

            const offers = result.yml_catalog.shop.offers.offer;

            const updatePromises = Array.isArray(offers) ? offers.map(offer => {
                const price = parseFloat(offer.price) || 0;
                const stock = parseInt(offer.stock) || 0;

                if (price === 0) {
                    return Promise.resolve(); // Skip if price is 0
                }
                
                const productData = {
                    article: offer.vendorCode || '',
                    name: offer.name || '',
                    price: price,
                    stock: stock,
                    imageAddress: Array.isArray(offer.picture) && offer.picture.length > 0 ? offer.picture[0] : '', 
                    source: 'WerkelProduct'
                };

                // Use findOneAndUpdate to update or create a product
                return WerkelProductModel.findOneAndUpdate(
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

module.exports = { uploadProductsByWerkel };