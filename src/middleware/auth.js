/**
 * @file This module handles authentication and authorization.
 * @module auth
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'

/**
 * Check if the user is authorized to the requested resource.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export async function checkAuthorization (req, res, next) {
  try {
    await isAuthorized(req.doc.creator, req.session.user.id)

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Check if the user is authorized to the requested resource.
 *
 * @param {string} creator - The id of the document's creator.
 * @param {string} userId - The id of the current user.
 */
export async function isAuthorized (creator, userId) {
  if (creator !== userId) {
    const httpStatusCode = 403
    const error = new Error(http.STATUS_CODES[httpStatusCode])
    error.status = httpStatusCode
    error.statusMessage = http.STATUS_CODES[httpStatusCode]
    throw error
  }
}

/**
 * Check if the user is logged in.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export async function checkLogin (req, res, next) {
  try {
    if (!req.session || !req.session.user) {
      const httpStatusCode = 401
      const error = new Error(http.STATUS_CODES[httpStatusCode])
      error.status = httpStatusCode
      error.statusMessage = http.STATUS_CODES[httpStatusCode]
      throw error
    }
    next()
  } catch (error) {
    next(error)
  }
}
