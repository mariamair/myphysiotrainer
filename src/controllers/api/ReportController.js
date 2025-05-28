/**
 * @file Defines the ReportController class.
 * @module ReportController
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import { logger } from '../../config/winston.js'
import { ReportModel } from '../../models/ReportModel.js'

/**
 * Encapsulates a controller.
 */
export class ReportController {
  /**
   * Load an item and provide req.doc to the route if :id is present.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The id of the item to load.
   */
  async loadReport (req, res, next, id) {
    try {
      logger.silly(`Loading report document: ${id}`)

      // Get the document.
      const reportDocument = await ReportModel.findById(id)

      // If the document is not found, throw an error.
      if (!reportDocument) {
        const httpStatusCode = 404
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      // Provide the document to req.
      req.doc = reportDocument

      logger.silly(`Loaded report document: ${id}`)

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
  async findAllReportsForUser (req, res, next) {
    try {
      logger.silly('Loading all report documents')
      // If userId is missing, throw an error.
      if (!req.session.user.id) {
        const httpStatusCode = 403
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      const query = req.session.user.id
      const reports = (await ReportModel.search(query))
        .map(reportDocument => reportDocument.toObject())

      logger.silly(`Loaded all report documents for user: ${req.session.user.id}`)

      res.json(reports)
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
  async findReport (req, res, next) {
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
  async createReport (req, res, next) {
    try {
      logger.silly('Creating new report document')

      if (!['programId', 'programTitle', 'exerciseId', 'exerciseTitle', 'executedRepetitions', 'repetitionMethod'].every(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = 'Incomplete information.'
        throw error
      }

      // Destructure request object
      const { programId, programTitle, exerciseId, exerciseTitle, executedRepetitions, repetitionMethod } = req.body

      // Create the report document and save it to the database.
      // Add description only if it exists in the request body.
      const reportDocument = await ReportModel.create({
        programId,
        programTitle,
        exerciseId,
        exerciseTitle,
        executedRepetitions,
        repetitionMethod: { type: repetitionMethod.type, number: repetitionMethod.number },
        user: req.session.user.id
      })

      logger.silly(`Created new report document: ${reportDocument.id}`)

      const url = new URL(
        `${req.protocol}://${req.get('host')}${req.baseUrl}/${reportDocument.id}`
      )

      res
        .location(url.href)
        .status(201)
        .json({ id: reportDocument.id })
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
  async updateReport (req, res, next) {
    try {
      logger.silly(`Updating report document: ${req.doc.reportId}`)

      if ('programTitle' in req.body) req.doc.programTitle = req.body.programTitle
      if ('exerciseTitle' in req.body) req.doc.exerciseTitle = req.body.exerciseTitle
      if ('repetitions' in req.body) req.doc.repetitions = req.body.repetitions
      if ('repetitionMethod' in req.body) req.doc.repetitionMethod = req.body.repetitionMethod

      if (!['repetitions', 'repetitionMethod'].some(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      if (req.doc.isModified()) {
        await req.doc.save()
        logger.silly(`Updated report document: ${req.doc.reportId}`)
      } else {
        logger.silly(`Not updated because there were no changes to document: ${req.doc.reportId}`)
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
  async deleteReport (req, res, next) {
    try {
      logger.silly(`Deleting report document: ${req.doc.reportId}`)

      await req.doc.deleteOne()

      logger.silly(`Deleted report document: ${req.doc.reportId}`)

      res
        .status(204)
        .end()
    } catch (error) {
      next(error)
    }
  }
}
