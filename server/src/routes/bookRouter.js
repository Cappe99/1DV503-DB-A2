import express from 'express'
import { BookController } from '../controllers/BookController.js'

export const router = express.Router()

const controller = new BookController()

router.get('/', (req, res, next) => controller.listBooks(req, res, next))
