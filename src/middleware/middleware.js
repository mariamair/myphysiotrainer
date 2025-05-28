/**
 * @file This module sets request options.
 * @module requestOptions
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import httpContext from 'express-http-context' // Must be first!
import { randomUUID } from 'node:crypto'

export const middleware = {}

/**
 * Add a request UUID to each request and store information about each request in the request-scoped context.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
middleware.requestDetails = (req, res, next) => {
  req.requestUuid = randomUUID()
  httpContext.set('request', req)

  next()
}
