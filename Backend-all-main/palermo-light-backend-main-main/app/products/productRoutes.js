const express = require('express');
const router = express.Router();
const productController = require('./productControllers');

router.get('/products/:supplier', productController.getProducts);
router.get('/product/:supplier', productController.getProductByArticle);
router.post('/products/list', productController.getProductList);

module.exports = router;
