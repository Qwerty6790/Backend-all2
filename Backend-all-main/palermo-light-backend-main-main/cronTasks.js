
const { uploadProductsByArtelamp } = require('./uploads/artelampUpload');
const { uploadProductsByFavouriteLight } = require('./uploads/favouriteLightUpload');
const { uploadProductsByKinkLight } = require('./uploads/kinklightUpload');
const { uploadProductsByLightStar } = require('./uploads/lightStarUpload');
const { uploadProductsByWerkel } = require('./uploads/werkelUpload');


function updateProductData(){
    uploadProductsByArtelamp()
    uploadProductsByFavouriteLight();
    uploadProductsByKinkLight();
    uploadProductsByLightStar();
    uploadProductsByWerkel();
    console.log('Данные успешно обновлены!');
}

module.exports = { updateProductData };