// Dependencies
const express = require('express')
const http = require('http')
const ejs = require('ejs')
const fs = require('fs')
const bodyparser = require('body-parser')
const cookieparser = require('cookie-parser')
const crypto = require('crypto')

// Validation
const emailvalidator = require('email-validator')
const passwordvalidator = require('password-validator')
const passwordvalidatorschema = new passwordvalidator()
passwordvalidatorschema
.is().min(6)
.is().max(100)
.has().uppercase()
.has().lowercase() 
.has().not().spaces()
.is().not().oneOf(['Password'])

// MongoDB
const mongoose = require('mongoose')
const userFunctions = require('./modules/functions')
const mongooseGames = require('./modules/games')
mongoose.connect('', () => {
    console.log('Connected to MongoDB.')
})

// Application Setup
const app = express()
const server = http.createServer(app)
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs')
app.use(bodyparser.urlencoded({extended: true}))
app.use(cookieparser())

// CONFIGURATION

const applicationAdministrators = ['']

// Main Application
app.get('/', async (req, res) => {
    const games = await mongooseGames.find()
    res.render('index', {games: games, requestData: req})
})

app.get('/join', (req, res) => {
    const error = req.query.error
    
    if(req.cookies.token) {
        res.redirect('/dashboard')
    } else {
        if(!error) {
            return res.render('join')
        } else {
            if(error == '1') {
                return res.render('join-error', {error: 'Please fill in all fields.'})
            }
            if(error == '2') {
                return res.render('join-error', {error: 'Please enter a valid email.'})
            }
            if(error == '3') {
                return res.render('join-error', {error: 'Please accept the terms of service.'})
            }
            if(error == '4') {
                return res.render('join-error', {error: 'Please choose a different, stronger password.'})
            }
            if(error == '5') {
                return res.render('join-error', {error: 'An account already exists with this email.'})
            }
            if(error != '1' || error != '2' || error != '3' || error != '4' || error != '5') {
                return res.redirect('/join')
            }
        }
    }
})

app.get('/login', (req, res) => {
    const error = req.query.error
    
    if(req.cookies.token) {
        res.redirect('/dashboard')
    } else {
        if(!error) {
            return res.render('login')
        } else {
            if(error == '1') {
                return res.render('login-error', {error: 'Please fill in all fields.'})
            }
            if(error == '2') {
                return res.render('login-error', {error: 'Please enter a valid email.'})
            }
            if(error == '3') {
                return res.render('login-error', {error: 'No account found with these credentials.'})
            }
            if(error == '4') {
                return res.render('login-error', {error: 'Please enter a valid password.'})
            }
            if(error != '1' || error != '2' || error != '3' || error != '4') {
                return res.redirect('/login')
            }
        }
    }
})

app.get('/dashboard', async (req, res) => {
    if(req.cookies.token) {
        if(await userFunctions.checkToken(req.cookies.token)) {
            const userData = await userFunctions.getUserDataFromToken(req.cookies.token)
            if(userData.banned == false) {
                const games = await mongooseGames.find()
                res.render('dashboard', {userData: userData, applicationAdministrators: applicationAdministrators, games: games})
            } else {
                res.redirect('/logout')
            }
        } else {
            res.redirect('/logout')
        }
    } else {
        res.redirect('/')
    }
})

app.get('/dashboard/account', async (req, res) => {
    if(req.cookies.token) {
        if(await userFunctions.checkToken(req.cookies.token)) {
            const userData = await userFunctions.getUserDataFromToken(req.cookies.token)
            if(userData.banned == false) {
                const games = await mongooseGames.find()
                res.render('account', {userData: userData, applicationAdministrators: applicationAdministrators, games: games})
            } else {
                res.redirect('/logout')
            }
        } else {
            res.redirect('/logout')
        }
    } else {
        res.redirect('/')
    }
})

app.get('/logout', async (req, res) => {
    if(req.cookies.token) {
        if(await userFunctions.checkToken(req.cookies.token)) {
            const userData = await userFunctions.getUserDataFromToken(req.cookies.token)
            await userFunctions.changeToken(userData.email)
            res.clearCookie('token').redirect('/')
        } else {
            res.clearCookie('token').redirect('/')
        }
    } else {
        res.redirect('/')
    }
})

app.get('/assets/:assetname/', (req, res) => {
    const assetname = req.params.assetname

    if(fs.existsSync(__dirname + `/assets/${assetname}`)) {
        res.sendFile(__dirname + `/assets/${assetname}`)
    } else {
        res.sendStatus(404)
    }
})

app.get('/dev/panel', async (req, res) => {
    const token = req.cookies.token

    if(token){
        if(await userFunctions.checkToken(token)) {
            const userData = await userFunctions.getUserDataFromToken(token)
            if(applicationAdministrators.indexOf(userData.email) > -1) {
                res.render('admin-panel')
            } else {
                res.redirect('/')
            }
        } else {
            res.redirect('/logout')
        }
    } else {
        res.redirect('/')
    }
})

app.get('/games/:gameid/', async (req, res) => {
    const gameid = req.params.gameid.toLowerCase()

    if(await mongooseGames.exists({gameId: gameid})) {
        const gameData = await mongooseGames.findOne({gameId: gameid})
        res.render('games', {gameData: gameData, requestData: req})
    } else {
        res.redirect('/')
    }
})

app.get('*', (req, res) => {
    res.redirect('/')
})

app.post('/join', async (req, res) => {
    const email = req.body.email.toLowerCase()
    const password = req.body.password
    const country = req.body.country
    const terms = req.body.terms

    if(email && password && country) {
        if(emailvalidator.validate(email)) {
            if(!await userFunctions.checkEmail(email)) {
                if(passwordvalidatorschema.validate(password)) {
                    if(terms == 'on') {
                        await userFunctions.createUser(email, password, country)
                        res.redirect('/login')
                    } else {
                        res.redirect('/join?error=3')
                    }
                } else {
                    res.redirect('/join?error=4')
                }
            } else {
                res.redirect('/join?error=5')
            }       
        } else {
            res.redirect('/join?error=2')
        }
    } else {
        res.redirect('/join?error=1')
    }
})

app.post('/login', async (req, res) => {
    const email = req.body.email.toLowerCase()
    const password = req.body.password
    const hashedpassword = crypto.createHash('sha256').update(password).digest('hex')

    if(email && password) {
        if(emailvalidator.validate(email)) {
            if(password.length >= 6) {
                if(await userFunctions.checkEmail(email)) {
                    const userData = await userFunctions.getUserData(email)
                    if(userData.password == hashedpassword) {
                        res.cookie('token', userData.token).redirect('/dashboard')
                    } else {
                        res.redirect('/login?error=3')
                    }
                } else {
                    res.redirect('/login?error=3')
                }
            } else {
                res.redirect('/login?error=4')
            }
        } else {
            res.redirect('/login?error=2')
        }
    } else {
        res.redirect('/login?error=1')
    }
})

app.post('/dev/games/upload', async (req, res) => {
    const name = req.body.name
    const description = req.body.description
    const release = req.body.release
    const id = req.body.id.toLowerCase()
    const image = req.body.image
    var thumbnail = req.body.thumbnail

    if(name && description && release && id && image) {
        if(await mongooseGames.exists({gameId: id})) {
            res.redirect('/dev/panel')
        } else {
            if(thumbnail) {
                await userFunctions.createGame(name, description, release, id, image, thumbnail)
                res.redirect(`/games/${id}`)
            } else {
                thumbnail = image
                await userFunctions.createGame(name, description, release, id, image, thumbnail)
                res.redirect(`/games/${id}`)
            }
        }
    } else {
        res.redirect('/dev/panel')
    }
})

server.listen(3000, () => {
    console.log('Listening on port 3000.')
})