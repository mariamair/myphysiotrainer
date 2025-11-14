/**
 * @file Defines the AccountController class.
 * @module AccountController
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import { logger } from '../../config/winston.js'
import { AccountModel } from '../../models/AccountModel.js'

/**
 * Encapsulates a controller.
 */
export class AccountController {
  /**
   * Provide req.doc to the route if :id is present.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The value of the id for the item to load.
   */
  async loadAccount (req, res, next, id) {
    try {
      logger.silly(`Loading account document: ${id}`)

      // Get the document.
      const accountDocument = await AccountModel.findById(id)

      // If the document is not found, throw an error.
      if (!accountDocument) {
        const httpStatusCode = 404
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      // Provide the document to req.
      req.doc = accountDocument

      logger.silly(`Loaded acccount document: ${id}`)

      // Next middleware.
      next()
    } catch (error) {
      next(error)
    }
  }


  /**
   * Send a JSON response containing all items.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAllAccounts (req, res, next) {
    try {
      logger.silly('Loading all account documents')

      const accounts = (await AccountModel.find())
        .map(accountDocument => accountDocument.toObject())

      logger.silly('Loaded all account documents')

      res.json(accounts)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Send a JSON response containing a single item.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAccount(req, res, next) {
    try {
      // Process the document and send relevant data to the client.
      res.json(req.doc)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new user account.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async createAccount (req, res, next) {
    try {
      logger.silly('Creating new account document')

      if (!['firstName', 'lastName', 'email', 'username', 'password'].every(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = 'Incomplete information.'
        throw error
      }

      // Destructure request object.
      const { firstName, lastName, email, username, password } = req.body

      // Validate email address.
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      re.test(email)

      if (!re.test(email)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = 'Invalid e-mail address.'
        throw error
      }

      // Create user account.
      const accountDocument = await AccountModel.create({
        username,
        password,
        firstName,
        lastName,
        email
      })

      logger.silly(`Created new account document: ${accountDocument.id}`)

      res
        .status(201)
        .json({ id: accountDocument.id })
    } catch (error) {
      let httpStatusCode = 500

      if (error.code === 11_000) {
        // Duplicated keys.
        httpStatusCode = 409
      } else if (error.status === 400) {
        // Validation error(s).
        httpStatusCode = 400
      }

      const err = new Error(http.STATUS_CODES[httpStatusCode])
      err.status = httpStatusCode
      err.statusMessage = http.STATUS_CODES[httpStatusCode]

      next(err)
    }
  }

  /**
   * Authenticate a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async login (req, res, next) {
    try {
      logger.silly('Authenticating user')

      const { username, password } = req.body
      const accountDocument = await AccountModel.authenticate(username, password)
      req.session.regenerate((error) => {
        if (error) {
          throw new Error('Failed to re-generate session.')
        }
      })

      // Store the authenticated user in the session store.
      req.session.user = { username: accountDocument.username, id: accountDocument.id, isAdmin: accountDocument.isAdmin }

      logger.silly(`Authenticated user: ${accountDocument.id}`)

      res
        .status(200)
        .json({
          firstName: accountDocument.firstName,
          userId: accountDocument.id,
          isAdmin: accountDocument.isAdmin
        })
    } catch (error) {
      // Authentication failed.
      const httpStatusCode = 401
      const err = new Error(http.STATUS_CODES[httpStatusCode])
      err.status = httpStatusCode
      err.statusMessage = http.STATUS_CODES[httpStatusCode]

      next(err)
    }
  }

  /**
   * Log out a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async logout (req, res) {
    try {
      if (req.session && req.session.user.id) {
        req.session.destroy()
        res
          .status(200)
          .json({ message: 'Logged out' })
      } else {
        throw new Error('Not logged in')
      }
    } catch (error) {
      res
        .status(200)
        .json({ message: 'Logged out' })
    }
  }

  /**
   * Check if the session is valid.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async checkSession (req, res, next) {
    try {
      if (req.session && req.session.user.id) {
        res.json({
          validSession: true,
          userId: req.session.user.id
        })
      } else {
        res
          .status(401)
          .json({ validSession: false })
      }
    } catch (error) {
      const httpStatusCode = 401
      const err = new Error(http.STATUS_CODES[httpStatusCode])
      err.status = httpStatusCode
      err.statusMessage = http.STATUS_CODES[httpStatusCode]
      throw err
    }
  }

  /**
   * Update an item using a PATCH request.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async updateAccount (req, res, next) {
    try {
      logger.silly(`Updating account document: ${req.doc.id}`)

      if ('username' in req.body) req.doc.username = req.body.username
      if ('password' in req.body) req.doc.password = req.body.password
      if ('firstName' in req.body) req.doc.firstName = req.body.firstName
      if ('lastName' in req.body) req.doc.lastName = req.body.lastName
      if ('email' in req.body) req.doc.email = req.body.email

      if (!['username', 'password', 'firstName', 'lastName', 'email'].some(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      if (req.doc.isModified()) {
        await req.doc.save()
        logger.silly(`Updated account document: ${req.doc.id}`)
      } else {
        logger.silly(`Not updated because there were no changes to document: ${req.doc.id}`)
      }

      res
        .status(204)
        .end()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete an item.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async deleteAccount (req, res, next) {
    try {
      logger.silly(`Deleting account document: ${req.doc.id}`)

      await req.doc.deleteOne()

      logger.silly(`Deleted account document: ${req.doc.id}`)

      res
        .status(204)
        .end()
    } catch (error) {
      next(error)
    }
  }
}
