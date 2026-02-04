/**
 * @file The starting point of the application.
 * @module src/server
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import httpContext from 'express-http-context' // Must be first!
import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session'
import helmet from 'helmet'
import cors from 'cors'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectToDatabase } from './config/mongoose.js'
import { sessionOptions } from './config/sessionOptions.js'
import { middleware } from './middleware/middleware.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './config/winston.js'
import { router } from './routes/router.js'

try {
  // Connect to MongoDB.
  await connectToDatabase(process.env.DB_CONNECTION_STRING)

  // Create an Express application.
  const app = express()

  // Secure app by setting HTTP response headers.
  app.use(helmet())
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // eslint-disable-next-line quotes
        'script-src': ["'self'", 'cdnjs.cloudflare.com']
      }
    })
  )

  // Enable Cross Origin Resource Sharing (CORS)
  app.use(cors())

  // Parse requests of the content type application/x-www-form-urlencoded.
  // Populate the request object with a body object (req.body).
  app.use(express.urlencoded({ extended: false }))

  // Parse incoming requests of content type: application/json (JSON payloads).
  // Populate the request object with a body object (req.body).
  // Extend payload size to 500kb.
  app.use(express.json({ limit: '500kb' }))

  // Get the directory name of this module's path.
  const directoryFullName = dirname(fileURLToPath(import.meta.url))

  // Set the base URL to use for all relative URLs in a document.
  const baseURL = process.env.BASE_URL || '/'

  // View engine setup.
  app.set('view engine', 'ejs')
  app.set('views', join(directoryFullName, 'views'))
  app.set('layout', join(directoryFullName, 'views', 'layouts', 'default'))
  app.set('layout extractScripts', true)
  app.set('layout extractStyles', true)
  app.use(expressLayouts)

  // Setup session middleware
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1) // trust first proxy
  }
  app.use(session(sessionOptions))

  // Add the request-scoped context.
  // Must be placed before any middleware that needs access to the context!
  app.use(httpContext.middleware)

  // Middleware to be executed before the routes.
  app.use(middleware.requestDetails)

  app.use((req, res, next) => {
    // Pass the base URL to the views.
    res.locals.baseURL = baseURL

    next()
  })

  // Register routes.
  app.use('/', router)

  // Serve static files for SSR pages.
  app.use(express.static(join(directoryFullName, '..', 'public')))

  // Serve static files for CSR pages.
  app.use('/app', express.static(join(directoryFullName, '..', 'public')))

  // Catch-all: return index.html for all non-API routes
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(join(directoryFullName, '..', 'public', 'index.html'))
  })

  // Error handlers for 404 and global errors
  app.use(errorHandler.notFound)
  app.use(errorHandler.globalError)

  // Starts the HTTP server listening for connections.
  const server = app.listen(process.env.PORT, () => {
    logger.info(`Server running at http://localhost:${server.address().port}`)
    logger.info('Press Ctrl-C to terminate...')
  })
  // --------------------------------------------------------------------------
} catch (error) {
  logger.error(error.message, { error })
  process.exitCode = 1
}
