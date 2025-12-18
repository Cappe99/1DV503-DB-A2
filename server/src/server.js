import express from 'express'
import { dirname, join } from 'node:path'
import expressLayouts from 'express-ejs-layouts'
import { fileURLToPath } from 'node:url'
import { router } from './routes/router.js'
import dotenv from 'dotenv'

try {
  dotenv.config({ path: './.env' })

  const app = express()

  const directoryFullName = dirname(fileURLToPath(import.meta.url))

  const baseURL = process.env.BASE_URL || '/'

  app.set('view engine', 'ejs')
  app.set('views', join(directoryFullName, 'views'))
  app.set('layout', join(directoryFullName, 'views', 'layouts', 'default'))
  app.set('layout extractScripts', true)
  app.set('layout extractStyles', true)
  app.use(expressLayouts)

  app.use(express.json())

  app.use(express.urlencoded({ extended: false }))

  app.use(express.static(join(directoryFullName, '..', 'public')))

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1) // trust first proxy
  }

  app.use((req, res, next) => {
    // Pass the base URL to the views.
    res.locals.baseURL = baseURL

    next()
  })

  app.use(baseURL, router)

  app.use((err, req, res, next) => {
    console.error(err)

    // 404 Not Found.
    if (err.status === 404) {
      res
        .status(404)
        .sendFile(join(directoryFullName, 'views', 'errors', '404.html'))
      return
    }

    // 500 Internal Server Error (in production, all other errors send this response).
    if (process.env.NODE_ENV === 'production') {
      res
        .status(500)
        .sendFile(join(directoryFullName, 'views', 'errors', '500.html'))
      return
    }

    // ---------------------------------------------------
    // ⚠️ WARNING: Development Environment Only!
    //             Detailed error information is provided.
    // ---------------------------------------------------

    // Render the error page.
    res
      .status(err.status || 500)
      .render('errors/error', { error: err })
  })

  const server = app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${server.address().port}`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
