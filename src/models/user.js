const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    watchlist: [{ type: String }],
    anilistUsername: { type: String, unique: true } // Ensure this is a string
});

module.exports = mongoose.model('User', userSchema);