/**
 * @file Defines the ProgramController class.
 * @module ProgramController
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import { logger } from '../../config/winston.js'
import { ProgramModel } from '../../models/ProgramModel.js'
import { ProgramService } from '../../services/ProgramService.js'

/**
 * Encapsulates a controller.
 */
export class ProgramController {
  /**
   * Load an item and provide req.doc to the route if :id is present.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The id of the item to load.
   */
  async loadProgram (req, res, next, id) {
    try {
      logger.silly(`Loading program document: ${id}`)

      // Get the document.
      const programDocument = await ProgramModel.findById(id)

      // If the document is not found, throw an error.
      if (!programDocument) {
        const httpStatusCode = 404
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      // Provide the document to req.
      req.doc = programDocument

      logger.silly(`Loaded program document: ${id}`)

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
  async findAllProgramsForUser (req, res, next) {
    try {
      logger.silly('Loading all program documents')

      // If userId is missing, throw an error.
      if (!req.session.user.id) {
        const httpStatusCode = 403
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      const query = req.session.user.id
      const programs = (await ProgramModel.search(query))
        .map(programDocument => programDocument.toObject())

      logger.silly('Loaded all program documents')

      res.json(programs)
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
  async findProgram (req, res, next) {
    try {
      // Process the document and send relevant data to the client.
      res.json(req.doc)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new item.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async createProgram (req, res, next) {
    try {
      logger.silly('Creating new program document')

      if (!('title' in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = 'Incomplete information.'
        throw error
      }

      // Destructure request object
      const { title, description } = req.body

      // Create the program document and save it to the database.
      // Add description only if it exists in the request body.
      const programDocument = await ProgramModel.create({
        title,
        description: description === undefined ? '' : description,
        creator: req.session.user.id
      })

      logger.silly(`Created new program document: ${programDocument.id}`)

      const url = new URL(
        `${req.protocol}://${req.get('host')}${req.baseUrl}/${programDocument.id}`
      )

      res
        .location(url.href)
        .status(201)
        .json({ id: programDocument.id })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update an item using a PATCH request.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async updateProgram (req, res, next) {
    try {
      logger.silly(`Updating program document: ${req.doc.id}`)

      if ('title' in req.body) req.doc.title = req.body.title
      if ('description' in req.body) req.doc.description = req.body.description

      if (!['title', 'description'].some(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      if (req.doc.isModified()) {
        await req.doc.save()
        logger.silly(`Updated program document: ${req.doc.id}`)
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
  async deleteProgram (req, res, next) {
    try {
      logger.silly(`Deleting program document: ${req.doc.id}`)

      // Delete the exercises belonging to the program.
      const programService = new ProgramService()
      await programService.deleteProgramExercises(req.doc.id, req.session.user.id)

      await req.doc.deleteOne()

      logger.silly(`Deleted program document: ${req.doc.id}`)

      res
        .status(204)
        .end()
    } catch (error) {
      next(error)
    }
  }
}
