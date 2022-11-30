const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

const PORT = process.env.PORT || 8000;

mongoose.connection.once('open', () => console.log('MongoDB connection Ready'));
mongoose.connection.on('error', err => console.error(err));

async function mongoConnect() {
    return await mongoose.connect(MONGO_URL);
}

async function mongoDisconnect(){
    return await mongoose.disconnect();
}

module.exports = {mongoConnect, mongoDisconnect}