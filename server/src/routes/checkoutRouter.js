import express from 'express'
import { CheckoutController } from '../controllers/CheckoutController.js'

export const router = express.Router()
const controller = new CheckoutController()

router.post('/', (req, res) => controller.checkout(req, res))
router.get('/invoice/:ono', (req, res) => controller.invoice(req, res))
