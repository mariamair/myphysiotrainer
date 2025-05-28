/**
 * @file This module handles the program business logic.
 * @module services/ProgramService
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import { logger } from '../config/winston.js'
import { ExerciseService } from './ExerciseService.js'

/**
 * Encapsulates a ProgramService.
 */
export class ProgramService {
  /**
   * Delete all exercises belonging to program.
   *
   * @param {string} programId - The id of the program.
   * @param {string} userId - The id of the user.
   */
  async deleteProgramExercises (programId, userId) {
    try {
      logger.silly('ProgramService: Deleting all exercise documents for program')

      const exerciseService = new ExerciseService()

      const exerciseIds = (await exerciseService.getAllExercisesForProgram(programId, userId))
        .map(exercise => exercise.id)

      for (const exerciseId of exerciseIds) {
        exerciseService.deleteExercise(exerciseId, userId)
      }

      logger.silly('ProgramService: Deleted all exercise documents for program')
    } catch (error) {
      logger.error('ProgramService: Error in deleting exercise documents for program', { error })
      throw error
    }
  }
}
