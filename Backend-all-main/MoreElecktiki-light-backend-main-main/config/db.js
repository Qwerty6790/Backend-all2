const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://MoreElectriki:GhH3bpAvDN51IsF7@cluster0moreelecktirki.ftsf8.mongodb.net/MoreElecktriki?retryWrites=true&w=majority&appName=Cluster0MoreElecktirki', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB подключен');
    } catch (error) {
        console.error('Ошибка подключения к MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
