const express = require('express');
const cors = require('cors'); 
const cron = require('node-cron');

const connectDB = require('./config/db');

const authRouter = require('./app/auth/authRoutes');
const productRouter = require('./app/products/productRoutes');
const ordersRouter = require('./app/orders/ordersRoutes');
const usersRouter = require('./app/users/userRoutes');

const { updateProductData} = require('./cronTasks')

const app = express();
const PORT = process.env.PORT || 3004;

connectDB();

app.use(express.json());
app.use(cors()); 

app.use('/api', authRouter);
app.use('/api', productRouter);
app.use('/api', ordersRouter);
app.use('/api', usersRouter);

app.get('/', (req, res) => {
    res.send("Основной сервер приложения запущен.");
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

cron.schedule('0 */3 * * *', () => {
    updateProductData();
});

module.exports = app;

