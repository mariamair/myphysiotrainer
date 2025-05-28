/**
 * @file Defines the main router.
 * @module routes/router
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { router as homeRouter } from './homeRouter.js'
import { router as v1Router } from './api/v1/router.js'

export const router = express.Router()

router.use('/', homeRouter)
router.use('/api/v1', v1Router)
