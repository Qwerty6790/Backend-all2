const mongoose = require('mongoose');
const { OrderModel } = require('./orderModel'); // Импорт модели заказа
const User = require('../users/userModel'); // Импорт модели пользователя
const axios = require('axios'); // Импортируем axios для отправки email

// Функция для добавления заказа
exports.addOrder = async (req, res) => {
    const { products } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Недействительный список товаров' });
    }

    for (const product of products) {
        if (!product.name || product.price == null) {
            return res.status(400).json({ message: 'Каждый товар должен содержать имя и цену' });
        }
    }

    const totalAmount = products.reduce((total, product) => total + (product.price * product.quantity), 0);

    try {
        const order = new OrderModel({ userId, products, totalAmount });
        await order.save();
        res.status(201).json({ message: 'Заказ создан', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Функция для получения заказов пользователя
exports.getUserOrders = async (req, res) => {
    const userId = req.user.userId;

    try {
        const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Функция для удаления заказа
exports.deleteOrder = async (req, res) => {
    const userId = req.user.userId;
    const { orderId } = req.params;

    try {
        const order = await OrderModel.findOneAndDelete({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ message: 'Заказ не найден или не принадлежит пользователю' });
        }

        res.status(200).json({ message: 'Заказ успешно удалён' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Функция для обновления статуса товара в заказе
exports.updateProductInOrderStatus = async (req, res) => {
    const { orderId, article } = req.params;
    const { status } = req.body;

    try {
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        const product = order.products.find(p => p.article === article);

        if (!product) {
            return res.status(404).json({ message: 'Товар не найден в заказе' });
        }

        product.status = status;
        await order.save();

        // Отправка уведомления по электронной почте
        const user = await User.findById(order.userId);
        await axios.post('https://palermo-light-backend-emailer.vercel.app/api/send-email', {
            from: 'your-gmail-account@gmail.com',
            to: user.email,
            subject: 'Статус товара в заказе изменён',
            text: `Здравствуйте, ${user.username}!

            Статус товара "${product.name}" в вашем заказе #${orderId} был изменён на "${status}".

            Если у вас есть вопросы, пожалуйста, свяжитесь с нашей службой поддержки - davidmonte00@mail.ru

            С уважением,
            Команда Palermo Light.`
        });

        res.status(200).json({ message: 'Состояние товара успешно изменено', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Функция для обновления статуса заказа
exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        order.status = status;
        await order.save();

        // Отправка уведомления по электронной почте
        const user = await User.findById(order.userId);
        await axios.post('https://palermo-light-backend-emailer.vercel.app/api/send-email', {
            from: 'your-gmail-account@gmail.com',
            to: user.email,
            subject: 'Статус заказа изменён',
            text: `Здравствуйте, ${user.username}!

            Статус вашего заказа #${orderId} был изменён на "${status}".

            Если у вас есть вопросы, пожалуйста, свяжитесь с нашей службой поддержки - davidmonte00@mail.ru

            С уважением,
            Команда Palermo Light.`
        });

        res.status(200).json({ message: 'Состояние заказа успешно изменено' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Функция для получения конкретного заказа по его ID
exports.getOrderById = async (req, res) => {
    const userId = req.user.userId;
    const { orderId } = req.params;

    try {
        const order = await OrderModel.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ message: 'Заказ не найден или не принадлежит пользователю' });
        }

        res.json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Получение всех заказов для админа
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.find().sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
