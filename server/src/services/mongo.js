const mongoose = require('mongoose');

const MONGO_URL = `mongodb+srv://nasa-api:tb8K7VYUSiiNgP0S@nasacluster.9t0qwpb.mongodb.net/?retryWrites=true&w=majority`;

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