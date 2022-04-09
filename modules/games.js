const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    gameName: String,
    gameImage: String,
    gameThumbnail: String,
    gameRelease: String,
    gameDescription: String,
    gameId: String
})

module.exports = mongoose.model('Games', gameSchema, 'Games')