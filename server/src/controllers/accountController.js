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
        req.session.flash = { type: 'error', text: 'User Alreday exist' }

        return res.render('account/register', { flash: req.session.flash })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await db.execute(
        `INSERT INTO members (fname, lname, address, city, zip, phone, email, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fname, lname, address, city, zip, phone, email, hashedPassword]
      )

      req.session.flash = { type: 'success', text: 'Account created successfully.' }

      res.redirect('/account/register')
    } catch (err) {
      console.error(err)
      res.render('account/register', { error: 'Something went wrong', baseURL: '/' })
    }
  }
}
