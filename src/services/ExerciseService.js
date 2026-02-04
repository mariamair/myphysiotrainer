/**
 * @file This module handles the exercise business logic.
 * @module services/ExerciseService
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import http from 'node:http'
import { logger } from '../config/winston.js'
import { isAuthorized } from '../middleware/auth.js'
import { ExerciseModel } from '../models/ExerciseModel.js'

/**
 * Encapsulates an ExerciseService.
 */
export class ExerciseService {
  /**
   * Get all exercises belonging to a certain program.
   *
   * @param {string} programId - The id of the program.
   * @param {string} userId - The id of the user.
   * @returns {string[]} - An array of exercise ids.
   */
  async getAllExercisesForProgram (programId, userId) {
    try {
      logger.silly('ExerciseService: Fetching all documents')

      // If userId is missing, throw an error.
      if (!userId) {
        const httpStatusCode = 403
        const error = new Error(http.STATUS_CODES[httpStatusCode])
        error.status = httpStatusCode
        error.statusMessage = http.STATUS_CODES[httpStatusCode]
        throw error
      }

      const query = { userId, programId }

      const exercises = (await ExerciseModel.search(query))
        .map(programDocument => programDocument.toObject())

      logger.silly('ExerciseService: Fetched all documents')

      return exercises
    } catch (error) {
      logger.error('ExerciseService: Error in fetching exercise documents')
      throw error
    }
  }

  /**
   * Delete an exercise from the database.
   *
   * @param {string} exerciseId - The id of the exercise.
   * @param {string} userId - The id of the user.
   */
  async deleteExercise (exerciseId, userId) {
    try {
      logger.silly('ExerciseService: Deleting document')

      const exerciseDocument = await ExerciseModel.findById(exerciseId)

      isAuthorized(exerciseDocument.creator, userId)

      await exerciseDocument.deleteOne()

      logger.silly('ExerciseService: Deleted document')
    } catch (error) {
      logger.error('ExerciseService: Error in deleting document', { error })
      throw error
    }
  }
}
