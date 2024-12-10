const mongoose = require('mongoose');
const axios = require('axios');
const xlsx = require('xlsx');
const { ArtelampProductModel } = require('../app/products/productModel');

// MongoDB connection
mongoose.connect('mongodb+srv://MoreElectriki:GhH3bpAvDN51IsF7@cluster0moreelecktirki.ftsf8.mongodb.net/MoreElecktriki?retryWrites=true&w=majority&appName=Cluster0MoreElecktirki', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
});

const parseXLSX = async (buffer) => {
    try {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    } catch (error) {
        throw new Error('Error parsing XLSX file: ' + error.message);
    }
};

const uploadProductsByArtelamp = async () => {
    const url = 'https://yarusvsm.ru/ftp/Выгрузки/full.xlsx'; // Direct XLSX file link
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(10); // Limit 10 concurrent tasks

    try {
        console.log('Fetching XLSX file from URL: ' + url);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const xlsxData = response.data;

        console.log('Parsing XLSX file...');
        const products = await parseXLSX(xlsxData);

        console.log(`Parsed ${products.length} products from the XLSX file.`);

        const tasks = products.map((row) => limit(async () => {
            // Mapping product data (adjust keys based on your XLSX columns)
            const productData = {
                article: row['Артикул поставщика'] || '', // Артикул поставщика
                name: row['Наименование для сайта'] || '', // Наименование для сайта
                price: parseFloat(row['РРЦ']) || 0, // РРЦ (рекомендуемая розничная цена)
                stock: parseInt(row['Свободный остаток (Регион)'], 10) || 0, // Свободный остаток
                imageAddress: row['Ссылка на изображение'] || '', // Ссылка на изображение
                source: 'ArtelampProduct', // Статичное значение для источника
            };

            // If required fields are missing, skip the product
            if (!productData.article || !productData.name || !productData.price) {
                console.warn('Skipping product due to missing required fields:', productData);
                return;
            }

            try {
                await ArtelampProductModel.findOneAndUpdate(
                    { article: productData.article },
                    productData,
                    { upsert: true, new: true }
                );
                console.log(`Product with article ${productData.article} updated successfully.`);
            } catch (err) {
                console.error(`Error updating product with article ${productData.article}:`, err.message);
            }
        }));

        await Promise.all(tasks);
        console.log('All products successfully updated or created.');
    } catch (error) {
        console.error('Error fetching or processing XLSX data: ' + error.message);
    }
};

// Run the upload process
uploadProductsByArtelamp();
