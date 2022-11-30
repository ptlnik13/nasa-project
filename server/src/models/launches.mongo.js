const mongoose = require('mongoose');

//launchesSchema which stores schema
const launchesSchema = new mongoose.Schema({
    // flightNumber: {type: Number, required: true, default: 100, min: 100, max: 999}, // You can also tell explicitly.
    flightNumber: {type: Number, required: true},
    launchDate: {type: Date, required: true},
    mission: {type: String, required: true},
    rocket: {type: String, required: true},
    target: {type: String, /*required: true*/ }, // because spaceX has no target property, and we don't need it too.
    customers: [String],
    upcoming: {type: Boolean, required: true, default: true},
    success: {type: Boolean, required: true, default: true}
});

//now let's create a Model, so we can connect to "Launch" Collection.
//NOTE: - we use singular name as "Launch", behind scene it will convert into Plural.
module.exports = mongoose.model('Launch', launchesSchema);
