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

      res.redirect('/account/login')
    } catch (err) {
      console.error(err)
      res.render('account/register', { error: 'Something went wrong', baseURL: '/' })
    }
  }

  /**
   *
   * @param req
   * @param res
   */
  async logInPage (req, res) {
    res.render('account/login')
  }

  /**
   *
   * @param req
   * @param res
   */
  async loginUser (req, res) {
    const { email, password } = req.body

    if (!email || !password) {
      req.session.flash = { type: 'error', text: 'Email and password are required' }

      return res.render('account/login', { flash: req.session.flash })
    }

    try {
      const [rows] = await db.execute(
        'SELECT userid, fname, lname, address, city, zip, password FROM members WHERE email = ?',
        [email]
      )

      if (rows.length === 0) {
        req.session.flash = { type: 'error', text: 'Invalid email or password' }
        return res.render('account/login', { flash: req.session.flash })
      }

      const user = rows[0]

      const match = await bcrypt.compare(password, user.password)

      if (!match) {
        req.session.flash = { type: 'error', text: 'Invalid email or password' }

        return res.render('account/login', { flash: req.session.flash })
      }

      req.session.user = {
        userid: user.userid,
        fname: user.fname,
        lname: user.lname,
        address: user.address,
        city: user.city,
        zip: user.zip
      }

      req.session.flash = { type: 'success', text: 'loged in successfully.' }

      res.redirect('/')
    } catch (err) {
      console.error(err)
      req.session.flash = { type: 'error', text: 'Somting went wrong' }

      res.render('account/login', { flash: req.session.flash })
    }
  }

  /**
   *
   * @param req
   * @param res
   */
  logout (req, res) {
    req.session.destroy(() => {
      res.redirect('/')
    })
  }
}
