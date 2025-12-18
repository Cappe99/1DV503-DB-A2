import express from 'express'
import http from 'node:http'
import { router as homeRouter } from './homeRouter.js'
// import { router as accounttRouter } from './accountRouter.js'
import { router as accountRouter } from './accountRouter.js'
import { router as bookRouter } from './bookRouter.js'

export const router = express.Router()

router.use((req, res, next) => {
  console.log('REQUEST:', req.method, req.originalUrl)
  next()
})

router.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end()
})

router.use('/', homeRouter)
router.use('/account', accountRouter)
router.use('/books', bookRouter)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => {
  const statusCode = 404
  const error = new Error(http.STATUS_CODES[statusCode])
  error.status = statusCode
  next(error)
})
