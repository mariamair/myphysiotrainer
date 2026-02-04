/**
 * @file This module handles errors.
 * @module errorHandler
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import { logger } from '../config/winston.js'
import '@lnu/json-js-cycle'

export const errorHandler = {}

/**
 * Handle 404 / Resource not found errors and pass them to the global error handler.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
errorHandler.notFound = (req, res, next) => {
  const httpStatusCode = 404
  const error = new Error(http.STATUS_CODES[httpStatusCode])
  error.status = httpStatusCode
  error.statusMessage = http.STATUS_CODES[httpStatusCode]
  next(error)
}

/**
 * Global error handler for all types of errors.
 *
 * @param {object} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */

// eslint-disable-next-line no-unused-vars
errorHandler.globalError = (err, req, res, next) => {
  // Log the error for debugging
  logger.error(err.message, { error: err })

  const statusCode = err.status || 500
  const statusMessage = err.statusMessage || 'Unknown error'

  // Send predefined message in production environment
  if (process.env.NODE_ENV === 'production') {
    res
      .status(statusCode)
      .json({
        statusCode,
        statusMessage,
        message: setErrorMessage(statusCode)
      })
  } else {
    // ⚠️ Send detailed error information in development environment ⚠️

    // Deep copy the error object and return a new object with
    // enumerable and non-enumerable properties (cyclical structures are handled).
    const copy = JSON.decycle(err, { includeNonEnumerableProperties: true })

    res
      .status(statusCode)
      .json({ copy })
  }
}

/**
 * Set an error message depending on the status code.
 *
 * @param {number} statusCode - The http status code.
 * @returns {string} - The error message to be sent to the client.
 */
function setErrorMessage (statusCode) {
  if (statusCode === 400) {
    return 'Invalid information.'
  } else if (statusCode === 401) {
    return 'You do not have a user account or entered invalid login credentials.'
  } else if (statusCode === 403) {
    return 'You are not authorized to view this information.'
  } else if (statusCode === 404) {
    return 'The requested resource was not found.'
  } else if (statusCode === 409) {
    return 'Username already taken.'
  } else {
    return 'An unexpected condition was encountered.'
  }
}
