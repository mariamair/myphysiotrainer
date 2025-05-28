/**
 * @file Defines the api program router.
 * @module routes/api/v1/programRouter
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { ProgramController } from '../../../../controllers/api/ProgramController.js'
import { checkAuthorization, checkLogin } from '../../../../middleware/auth.js'

export const router = express.Router()

const controller = new ProgramController()

// Provide req.doc to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadProgram(req, res, next, id))

// Map HTTP verbs and route paths to controller action methods.
router.get('/',
  checkLogin,
  controller.findAllProgramsForUser
)

router.get('/:id',
  checkLogin,
  checkAuthorization,
  controller.findProgram
)

router.post('/',
  checkLogin,
  controller.createProgram
)

router.patch('/:id',
  checkLogin,
  checkAuthorization,
  controller.updateProgram
)

router.delete('/:id',
  checkLogin,
  checkAuthorization,
  controller.deleteProgram
)
