import msql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

export const db = msql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.PASSWORD,
  database: 'book_store',
  port: 3306
})
