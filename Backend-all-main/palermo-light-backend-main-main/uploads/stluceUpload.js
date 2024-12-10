const axios = require('axios');
const mongoose = require('mongoose');
const xml2js = require('xml2js');
const iconv = require('iconv-lite'); // Import iconv-lite
const { StluceProductModel } = require('../app/products/productModel');

// Подключение к базе данных MongoDB
mongoose.connect('mongodb+srv://MoreElectriki:GhH3bpAvDN51IsF7@cluster0moreelecktirki.ftsf8.mongodb.net/MoreElecktriki?retryWrites=true&w=majority&appName=Cluster0MoreElecktirki', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Увеличиваем тайм-аут для выбора сервера
});

// Функция для парсинга XML
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

// Загрузка и обработка продуктов из XML
const uploadProductsByStluce = async () => {
    const url = 'https://stluce.ru/upload/1c/stluce_mrc.xml';
    const pLimit = (await import('p-limit')).default; // Динамический импорт для ES Module
    const limit = pLimit(10); // Ограничение на 10 параллельных задач

    try {
        console.log('Fetching data from URL: ' + url);
        const response = await axios.get(url, {
            responseType: 'arraybuffer', // Ensure we get raw data (as a buffer)
        });

        // Пробуем декодировать с кодировкой 'windows-1251', если это необходимо
        const xmlData = iconv.decode(response.data, 'windows-1251'); // или 'utf-8' в зависимости от фактической кодировки

        const result = await parseXML(xmlData);
        console.log('XML parsing completed successfully.');

        if (!result || !result.yml_catalog || !result.yml_catalog.shop || !result.yml_catalog.shop[0].offers) {
            console.error('No product data found in XML');
            return;
        }

        const products = result.yml_catalog.shop[0].offers[0].offer;
        if (!Array.isArray(products)) {
            console.error('No products found or invalid data structure in XML');
            return;
        }

        console.log(`Found ${products.length} products for processing.`);

        const tasks = products.map((lightData) => limit(async () => {
            // Прямое присваивание названия, без очистки
            const productData = {
                article: lightData.model && lightData.model[0] ? lightData.model[0] : '', // Артикул
                name: lightData.name && lightData.name[0] ? lightData.name[0] : '', // Название
                price: lightData.price && lightData.price[0] ? parseFloat(lightData.price[0]) : 0, // Цена
                stock: lightData.stock && lightData.stock[0] ? parseInt(lightData.stock[0]) : 0, // Количество на складе
                imageAddress: lightData.picture && lightData.picture.length > 0 ? lightData.picture[0] : '', // Ссылка на картинку
                source: 'StluceProduct', // Источник
            };

            // Проверка на обязательные поля
            if (!productData.article || !productData.name) {
                console.warn('Skipping product due to missing required fields:', productData);
                return;
            }

            try {
                // Обновление или создание продукта в базе данных
                await StluceProductModel.findOneAndUpdate(
                    { article: productData.article }, // Ищем по артикулу
                    productData, // Обновляем или создаем новый продукт
                    { upsert: true, new: true } // Если не найдено - создаем новый
                );
                console.log(`Product with article ${productData.article} updated successfully.`);
            } catch (err) {
                console.error(`Error updating product with article ${productData.article}:`, err);
            }
        }));

        // Ожидание выполнения всех задач
        await Promise.all(tasks);
        console.log('All products successfully updated or created.');
    } catch (error) {
        console.error('Error fetching or parsing XML data: ' + error.message);
    }
};

// Вызов функции для загрузки продуктов
uploadProductsByStluce();
