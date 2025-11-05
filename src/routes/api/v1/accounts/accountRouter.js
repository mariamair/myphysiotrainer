/**
 * @file Defines the api account router.
 * @module routes/api/v1/accounts/accountRouter
 * @author Maria Mair <mm225mz@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import { isAdmin, checkLogin } from '../../../../middleware/auth.js'
import { AccountController } from '../../../../controllers/api/AccountController.js'

export const router = express.Router()

const controller = new AccountController()

// Provide req.task to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadAccount(req, res, next, id))

// Map HTTP verbs and route paths to controller action methods.
router.post('/register',
  controller.createAccount
)

router.post('/login',
  controller.login
)

router.get('/check-session',
  controller.checkSession
)

router.post('/logout',
  controller.logout
)

router.get('/',
  checkLogin,
  isAdmin,
  controller.findAllAccounts
)

router.get('/:id',
  checkLogin,
  isAdmin,
  controller.findAccount
)

router.patch('/:id',
  checkLogin,
  isAdmin,
  controller.updateAccount
)

router.delete('/:id',
  checkLogin,
  isAdmin,
  controller.deleteAccount
)
