const axios = require('axios'); 
const mongoose = require('mongoose');
const xml2js = require('xml2js');
const { FavouriteLightProductModel } = require('../app/products/productModel');

mongoose.connect('mongodb+srv://MoreElectriki:GhH3bpAvDN51IsF7@cluster0moreelecktirki.ftsf8.mongodb.net/MoreElecktriki?retryWrites=true&w=majority&appName=Cluster0MoreElecktirki', {
    serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
});

const uploadProductsByFavouriteLight = async () => {
    const productUrl = "https://ftp.favourite-light.com/ForClients/export/import.xml";
    const offerUrl = "https://ftp.favourite-light.com/ForClients/export/offers.xml";

    try {
        // Load product data
        const productResponse = await axios.get(productUrl);
        const productXmlData = productResponse.data;

        xml2js.parseString(productXmlData, async (err, productResult) => {
            if (err) {
                throw new Error('XML parsing error: ' + err.message);
            }

            const products = productResult.Данные.Номенклатура;

            // Load offer data (prices, stock)
            const offerResponse = await axios.get(offerUrl);
            const offerXmlData = offerResponse.data;

            xml2js.parseString(offerXmlData, async (err, offerResult) => {
                if (err) {
                    throw new Error('XML parsing error: ' + err.message);
                }

                const offerElements = offerResult.Данные.Номенклатура;

                const updatePromises = products.map(lightData => {
                    const offer = offerElements.find(o => o.$.Имя === lightData.$.Имя);

                    // Set stock as a string
                    const stockQuantity = offer && offer.Остаток[0] ? offer.Остаток[0] : '0'; // Default to '0' if not available

                    const productData = {
                        article: lightData.$.Имя,
                        name: lightData.ПолноеНаименование[0],
                        price: offer ? parseInt(offer.ЦенаРРЦ[0]) : 0,
                        stock: stockQuantity, // Stock as a string
                        imageAddress: lightData.СсылкиНаФото[0].split(', ')[0] || '', // Get the first image
                        source: 'FavouriteLightProduct' // Adding source
                    };

                    // Use findOneAndUpdate to update or create a product
                    return FavouriteLightProductModel.findOneAndUpdate(
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
        });
    } catch (error) {
        console.error('Error fetching XML: ' + error.message);
    }
};

module.exports = { uploadProductsByFavouriteLight };
uploadProductsByFavouriteLight()