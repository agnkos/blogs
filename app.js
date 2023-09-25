const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const logger = require('./utils/logger')
const config = require('./utils/config')
const { userExtractor, tokenExtractor, errorHandler } = require('./utils/middleware')
const mongoose = require('mongoose')
// const unless = require('express-unless')

mongoose.connect(config.MONGODB_URI)

logger.info('connecting to', config.MONGODB_URI)

app.use(cors())
app.use(express.json())
app.use(tokenExtractor)
// app.use(userExtractor.unless({ method: "GET" }))
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use(errorHandler)

module.exports = app