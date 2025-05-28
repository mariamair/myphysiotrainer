/**
 * @file Defines the api exercise router.
 * @module routes/api/v1/exerciseRouter
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { ExerciseController } from '../../../../controllers/api/ExerciseController.js'
import { checkAuthorization, checkLogin } from '../../../../middleware/auth.js'

export const router = express.Router()

const controller = new ExerciseController()

// Provide req.doc to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadExercise(req, res, next, id))

// Map HTTP verbs and route paths to controller action methods.
router.get('/',
  checkLogin,
  controller.findAllExercisesForUser
)

router.get('/:id',
  checkLogin,
  checkAuthorization,
  controller.findExercise
)

router.post('/',
  checkLogin,
  controller.createExercise)

router.patch('/:id',
  checkLogin,
  checkAuthorization,
  controller.updateExercise)

router.delete('/:id',
  checkLogin,
  checkAuthorization,
  controller.deleteExercise)
