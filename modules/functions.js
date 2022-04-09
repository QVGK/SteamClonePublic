const crypto = require('crypto')
const MongooseUserData = require('./users')
const MongooseGameData = require('./games')

async function checkEmail(email) {
    return await MongooseUserData.exists({email: email})
}

async function checkToken(token) {
    return await MongooseUserData.exists({token: token})
}

async function getUserData(email) {
    return await MongooseUserData.findOne({email: email})
}

async function getUserDataFromToken(token) {
    return await MongooseUserData.findOne({token: token})
}

async function changeToken(email) {
    const newtoken = crypto.randomBytes(16).toString('hex')
    return await MongooseUserData.updateOne({email: email}, {token: newtoken})
}

async function changePassword(email, password) {
    await MongooseUserData.updateOne({email: email}, {password: password})
}

async function changeBanStatus(email, status) {
    if(status == true) {
        await MongooseUserData.updateOne({email: email}, {banned: true})
    } else if(status == false) {
        await MongooseUserData.updateOne({email: email}, {banned: false})
    }
}

async function createUser(email, password, country) {
    const token = crypto.randomBytes(16).toString('hex')
    password = crypto.createHash('sha256').update(password).digest('hex')
    userid = crypto.randomBytes(16).toString('hex')
    await MongooseUserData.create({
        email: email, 
        password: password,
        country: country,
        banned: false, 
        token: token
    })
}

async function createGame(name, description, release, id, image, thumbnail) {
    await MongooseGameData.create({
        gameName: name, 
        gameImage: image,
        gameThumbnail: thumbnail,
        gameDescription: description,
        gameRelease: release,
        gameId: id
    })
}

module.exports.checkEmail = checkEmail
module.exports.checkToken = checkToken
module.exports.getUserData = getUserData
module.exports.getUserDataFromToken = getUserDataFromToken
module.exports.changeToken = changeToken
module.exports.changePassword = changePassword
module.exports.changeBanStatus = changeBanStatus
module.exports.createUser = createUser
module.exports.createGame = createGame