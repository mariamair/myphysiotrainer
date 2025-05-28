/**
 * @file Defines the main api version 1 router.
 * @module routes/api/v1/router
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { router as accountRouter } from './accounts/accountRouter.js'
import { router as programRouter } from './programs/programRouter.js'
import { router as exerciseRouter } from './programs/exerciseRouter.js'
import { router as reportRouter } from './programs/reportRouter.js'

export const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Welcome to version 1 of this RESTful API!' }))
router.use('/accounts', accountRouter)
router.use('/programs', programRouter)
router.use('/programs/:id/exercises', exerciseRouter)
router.use('/reports', reportRouter)
