const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    watchlist: [{ type: String }],
});

module.exports = mongoose.model('User', userSchema);