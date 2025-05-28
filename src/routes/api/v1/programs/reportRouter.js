/**
 * @file Defines the api report router.
 * @module routes/api/v1/reportRouter
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { ReportController } from '../../../../controllers/api/ReportController.js'
import { checkAuthorization, checkLogin } from '../../../../middleware/auth.js'

export const router = express.Router()

const controller = new ReportController()

// Provide req.doc to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadReport(req, res, next, id))

// Map HTTP verbs and route paths to controller action methods.
router.get('/',
  checkLogin,
  controller.findAllReportsForUser
)

router.get('/:id',
  checkLogin,
  checkAuthorization,
  controller.findReport
)

router.post('/',
  checkLogin,
  controller.createReport
)

router.patch('/:id',
  checkLogin,
  checkAuthorization,
  controller.updateReport
)

router.delete('/:id',
  checkLogin,
  checkAuthorization,
  controller.deleteReport
)
