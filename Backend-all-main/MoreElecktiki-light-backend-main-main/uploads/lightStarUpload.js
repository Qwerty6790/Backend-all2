const axios = require('axios');
const xml2js = require('xml2js');
const { LightStarProductModel } = require('../app/products/productModel');

const uploadProductsByLightStar = async () => {
    const url = 'https://lightstar.ru/today/stock.xml'; 

    try {
        const response = await axios.get(url);
        const xmlData = response.data;

        xml2js.parseString(xmlData, async (err, result) => {
            if (err) {
                throw new Error('Ошибка парсинга XML: ' + err.message);
            }

            const products = result.Таблица.element;

            const updatePromises = products.map(lightData => {
                const retailPrice = lightData.Цены[0].$.Розничная ? parseFloat(lightData.Цены[0].$.Розничная) : 0;

                const productData = {
                    article: lightData.Артикул[0],
                    name: lightData.Наименование[0],
                    price: retailPrice,
                    stock: lightData.Остаток[0] ? parseInt(lightData.Остаток[0]) : 0,
                    imageAddress: lightData.АдресКартинки[0],
                    source: 'LightStarProduct'  // Optional source field
                };

                // Use findOneAndUpdate to update or create a product
                return LightStarProductModel.findOneAndUpdate(
                    { article: productData.article }, // Find by article
                    productData, // Update data
                    { upsert: true, new: true } // Create if it doesn't exist
                );
            });

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

module.exports = { uploadProductsByLightStar };
