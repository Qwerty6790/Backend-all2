const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    article: String,
    name: String,
    price: Number,
    stock: String,
    imageAddress: String,
    source: String  
});

const FavouriteLightProductModel = mongoose.model('FavouriteLightProduct', productSchema);
const LightStarProductModel = mongoose.model('LightStarProduct', productSchema);
const KinkLightProductModel = mongoose.model('KinkLightProduct', productSchema);
const WerkelProductModel = mongoose.model('WerkelProductProduct', productSchema);
const StluceProductModel = mongoose.model('StluceProduct', productSchema);
const MaytoniProductModel = mongoose.model('MaytoniProduct', productSchema);
const ArtelampProductModel = mongoose.model('ArtelampProduct', productSchema);

module.exports = { 
    FavouriteLightProductModel, 
    LightStarProductModel, 
    KinkLightProductModel,  
    WerkelProductModel,
    StluceProductModel,
    MaytoniProductModel,
    ArtelampProductModel
};
