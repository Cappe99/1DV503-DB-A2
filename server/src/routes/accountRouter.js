import express from 'express'
// import { AccountController } from '../controllers/accountController.js'
import { AccountController } from '../controllers/accountController.js'

export const router = express.Router()

const controller = new AccountController()

router.get('/register', (req, res, next) => controller.signup(req, res, next))
router.post('/register', (req, res, next) => controller.register(req, res, next))
