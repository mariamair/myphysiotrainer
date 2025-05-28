/**
 * @file Defines the ExerciseController class.
 * @module ExerciseController
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import { logger } from '../../config/winston.js'
import { ExerciseModel } from '../../models/ExerciseModel.js'

/**
 * Encapsulates a controller.
 */
export class ExerciseController {
  /**
   * Load an item and provide req.doc to the route if :id is present.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The id of the item to load.
   */
  async loadExercise (req, res, next, id) {
    try {
      logger.silly(`Loading exercise document: ${id}`)

      // Get the document.
      const exerciseDocument = await ExerciseModel.findById(id)

      // If the document is not found, throw an error.
      if (!exerciseDocument) {
        const httpStatusCode = 404
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      // Provide the document to req.
      req.doc = exerciseDocument

      logger.silly(`Loaded exercise document: ${id}`)

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
  async findAllExercisesForUser (req, res, next) {
    try {
      logger.silly('Loading all exercise documents')
      // If userId is missing, throw an error.
      if (!req.session.user.id) {
        const httpStatusCode = 403
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      const programId = req.originalUrl.split('/')[4]

      const query = { userId: req.session.user.id, programId }

      const exercises = (await ExerciseModel.search(query))
        .map(programDocument => programDocument.toObject())

      logger.silly(`Loaded all exercise documents for program: ${programId}`)

      res.json(exercises)
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
  async findExercise (req, res, next) {
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
  async createExercise (req, res, next) {
    try {
      logger.silly('Creating new exercise document')

      const programId = req.originalUrl.split('/')[4]

      if (!['title', 'startingPosition', 'steps'].every(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = 'Incomplete information.'
        throw error
      }

      // Destructure request object
      const { title, startingPosition, steps, repetitions, repetitionMethod } = req.body

      // Create the exercise document and save it to the database.
      // Add description only if it exists in the request body.
      const exerciseDocument = await ExerciseModel.create({
        programId,
        title,
        startingPosition,
        steps,
        repetitions,
        repetitionMethod: { type: repetitionMethod.type, number: repetitionMethod.number },
        creator: req.session.user.id
      })

      logger.silly(`Created new exercise document: ${exerciseDocument.id}`)

      const url = new URL(
        `${req.protocol}://${req.get('host')}${req.baseUrl}/${exerciseDocument.id}`
      )

      res
        .location(url.href)
        .status(201)
        .json({ id: exerciseDocument.id })
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
  async updateExercise (req, res, next) {
    try {
      logger.silly(`Updating exercise document: ${req.doc.exerciseId}`)

      if ('title' in req.body) req.doc.title = req.body.title
      if ('startingPosition' in req.body) req.doc.startingPosition = req.body.startingPosition
      if ('steps' in req.body) req.doc.steps = req.body.steps
      if ('repetitions' in req.body) req.doc.repetitions = req.body.repetitions
      if ('repetitionMethod' in req.body) req.doc.repetitionMethod = req.body.repetitionMethod

      if (!['title', 'startingPosition', 'steps', 'repetitions', 'repetitionMethod'].some(prop => prop in req.body)) {
        const httpStatusCode = 400
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      if (req.doc.isModified()) {
        await req.doc.save()
        logger.silly(`Updated exercise document: ${req.doc.exerciseId}`)
      } else {
        logger.silly(`Not updated because there were no changes to document: ${req.doc.exerciseId}`)
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
  async deleteExercise (req, res, next) {
    try {
      logger.silly(`Deleting exercise document: ${req.doc.id}`)

      await req.doc.deleteOne()

      logger.silly(`Deleted exercise document: ${req.doc.id}`)

      res
        .status(204)
        .end()
    } catch (error) {
      next(error)
    }
  }
}
