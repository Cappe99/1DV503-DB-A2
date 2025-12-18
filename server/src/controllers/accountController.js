import bcrypt from 'bcrypt'
import { db } from '../config/db.js'

/**
 *
 */
export class AccountController {
  /**
   *
   * @param req
   * @param res
   */
  signup (req, res) {
    res.render('account/register')
  }

  /**
   *
   * @param req
   * @param res
   */
  async register (req, res) {
    const { fname, lname, address, city, zip, phone, email, password } = req.body

    try {
      const [rows] = await db.execute('SELECT userid FROM members WHERE email = ?', [email])
      if (rows.length > 0) {
        return res.render('account/register', { error: 'Email already exists', baseURL: '/' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await db.execute(
        `INSERT INTO members (fname, lname, address, city, zip, phone, email, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fname, lname, address, city, zip, phone, email, hashedPassword]
      )

      res.redirect('/account/register')
    } catch (err) {
      console.error(err)
      res.render('account/register', { error: 'Something went wrong', baseURL: '/' })
    }
  }
}
