const { LightStarProductModel } = require('./productModel');
const { FavouriteLightProductModel } = require('./productModel');
const { KinkLightProductModel } = require('./productModel');
const { WerkelProductModel } = require('./productModel');
const { StluceProductModel } = require('./productModel');
const { MaytoniProductModel } = require('./productModel');
const { ArtelampProductModel } = require('./productModel');

// Модели для разных поставщиков
const models = {
    FavouriteLight: FavouriteLightProductModel,
    LightStar: LightStarProductModel,
    KinkLight: KinkLightProductModel,
    Werkel: WerkelProductModel,
    Stluce: StluceProductModel,
    Maytoni: MaytoniProductModel,
    Artelamp: ArtelampProductModel,
};



// Модели для разных поставщиков для получение одного товара(костыль брат)
const modelsOfProduct = {
    FavouriteLightProduct: FavouriteLightProductModel,
    LightStarProduct: LightStarProductModel,
    KinkLightProduct: KinkLightProductModel,
    WerkelProduct: WerkelProductModel,
    StluceProduct:  StluceProductModel,
    MaytoniProduct:  MaytoniProductModel,
    ArtelampProduct:  ArtelampProductModel,
};

exports.getProducts = async (req, res) => {
    const { page = 1, limit = 10, name = '', minPrice = 0, maxPrice = Infinity } = req.query;
    const { supplier } = req.params;

    if (!models[supplier]) {
        return res.status(400).json({ message: 'Неверно указан поставщик' });
    }

    const ProductModel = models[supplier];

    try {
        // Извлечение короткого имени продукта с помощью регулярного выражения
        const nameRegex = new RegExp(/^(.*?)(, .*|$)/, 'i');
        const searchName = name.match(nameRegex)?.[1] || '';

        // Вычисление смещения для пагинации
        const skip = (page - 1) * limit;

        // Фильтрация по имени и цене
        const products = await ProductModel.find({
            name: { $regex: new RegExp(searchName, 'i') },
            price: { $gte: Number(minPrice), $lte: Number(maxPrice) }
        })
        .skip(skip)
        .limit(Number(limit));

        // Подсчет общего количества продуктов
        const totalProducts = await ProductModel.countDocuments({
            name: { $regex: new RegExp(searchName, 'i') },
            price: { $gte: Number(minPrice), $lte: Number(maxPrice) }
        });
        
        const totalPages = Math.ceil(totalProducts / limit);

        // Отправляем ответ с продуктами и дополнительной информацией о пагинации
        res.json({
            totalProducts,
            totalPages,
            currentPage: page,
            products
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Контроллер для получения одного товара по ID и поставщику
exports.getProductByArticle = async (req, res) => {
    const { supplier } = req.params;
    const { productArticle } = req.query;

    // Проверяем, существует ли модель для указанного поставщика
    if (!modelsOfProduct[supplier]) {
        return res.status(400).json({ message: 'Неверно указан поставщик' });
    }

    const ProductModel = modelsOfProduct[supplier];

    try {
        // Ищем товар по артикулу
        const product = await ProductModel.findOne({ article: productArticle });
        
        if (!product) {
            return res.status(404).json({ message: 'Товар не найден' });
        }

        // Отправляем найденный товар в ответе
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Контроллер для получения списка товаров по переданным артикулам и поставщикам, для корзин и тд 
exports.getProductList = async (req, res) => {
    const { products } = req.body; // Expecting products to be passed in the request body

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Invalid product list' });
    }

    try {
        const productDetails = await Promise.all(
            products.map(async (item) => {
                const ProductModel = modelsOfProduct[item.source]; // Get the model based on source

                if (!ProductModel) {
                    return { article: item.article, source: item.source, quantity: item.quantity, error: 'source model not found' };
                }

                const product = await ProductModel.findOne({ article: item.article }); // Fetch product by article

                if (!product) {
                    return { article: item.article, source: item.source, quantity: item.quantity, error: 'Product not found' };
                }

                return {
                    ...product.toObject(),
                    quantity: item.quantity
                };
            })
        );

        res.json({ products: productDetails });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

