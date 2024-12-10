const express = require('express');
const ordersController = require('./ordersControllers'); // Обновите здесь
const authenticate = require('../auth/authMiddleware');
const router = express.Router();

// Добавление заказа
router.post('/orders/add-order', authenticate, ordersController.addOrder);

// Получение заказов пользователя
router.get('/orders', authenticate, ordersController.getUserOrders);

// Получение конкретного заказа
router.get('/orders/:orderId', authenticate, ordersController.getOrderById);

// Получение всех заказов для админа
router.get('/all-orders', ordersController.getAllOrders); 

// Удаление заказа
router.delete('/orders/:orderId', authenticate, ordersController.deleteOrder); 

// Обновление статуса товара в заказе
router.patch('/orders/:orderId/products/:article/status', ordersController.updateProductInOrderStatus); 

// Обновление статуса заказа
router.patch('/orders/:orderId/status', ordersController.updateOrderStatus); 

module.exports = router;
