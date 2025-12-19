import { db } from '../config/db.js'

/**
 *
 */
export class BookController {
  /**
   *
   * @param req
   * @param res
   * @param next
   */
  async listBooks (req, res, next) {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 5
      const offset = (page - 1) * limit

      const { author, title, subject } = req.query

      const where = []
      const params = []

      if (subject) {
        where.push('LOWER(subject) = ?')
        params.push(subject.toLowerCase())
      }

      if (author) {
        where.push('LOWER(author) LIKE ?')
        params.push(author.toLowerCase() + '%')
      }

      if (title) {
        where.push('LOWER(title) LIKE ?')
        params.push('%' + title.toLowerCase() + '%')
      }

      const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''

      const [books] = await db.execute(
        `SELECT * FROM books
         ${whereSQL}
         LIMIT ${limit} OFFSET ${offset}`,
        params
      )

      const [countRows] = await db.execute(
        `SELECT COUNT(*) AS total FROM books ${whereSQL}`,
        params
      )

      const total = countRows[0].total
      const totalPages = Math.ceil(total / limit)

      const windowSize = 5
      let startPage = Math.max(1, page - Math.floor(windowSize / 2))
      let endPage = startPage + windowSize - 1

      if (endPage > totalPages) {
        endPage = totalPages
        startPage = Math.max(1, endPage - windowSize + 1)
      }

      const [subjects] = await db.execute(
        'SELECT DISTINCT subject FROM books ORDER BY subject'
      )

      const queryParams = { ...req.query }
      delete queryParams.page

      const queryString = new URLSearchParams(queryParams).toString()

      res.render('books/list', {
        books,
        subjects,
        currentPage: page,
        totalPages,
        startPage,
        endPage,
        limit,
        query: req.query,
        queryString,
        baseURL: '/'
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  async addToCart (req, res) {
    if (!req.session.user) {
      req.session.flash = { type: 'info', text: 'Login to add books to cart.' }

      return res.redirect('/account/login')
    }
    const userId = req.session.user?.userid
    const { isbn, qty } = req.body

    if (!userId || !isbn || !qty) {
      console.log({ userId, isbn, qty })
      return res.status(400).send('Missing data')
    }

    const [rows] = await db.execute(
      'SELECT qty FROM cart WHERE userid = ? AND isbn = ?',
      [userId, isbn]
    )

    if (rows.length > 0) {
      await db.execute(
        'UPDATE cart SET qty = qty + ? WHERE userid = ? AND isbn = ?',
        [qty, userId, isbn]
      )
    } else {
      await db.execute(
        'INSERT INTO cart (userid, isbn, qty) VALUES (?, ?, ?)',
        [userId, isbn, qty]
      )
    }

    req.session.flash = { type: 'success', text: 'Successfully addad book to cart.' }

    res.redirect('/books')
  }

  /**
   *
   * @param req
   * @param res
   */
  async viewCart (req, res) {
    if (!req.session.user) {
      return res.redirect('/account/login')
    }

    const userId = req.session.user.userid

    const [items] = await db.execute(`
      SELECT
      c.isbn,
      b.title,
      b.price,
      c.qty,
      COALESCE(b.price * c.qty, 0) AS rowTotal
      FROM cart c
      JOIN books b ON c.isbn = b.isbn
      WHERE c.userid = ?
      AND c.qty > 0 
    `, [userId])

    const total = items.reduce((sum, item) => {
      const rowTotal = Number(item.rowTotal)
      return sum + (isNaN(rowTotal) ? 0 : rowTotal)
    }, 0)
    res.render('books/cart', {
      items,
      total,
      user: req.session.user
    })
  }

  /**
   *
   * @param req
   * @param res
   */
  async checkout (req, res) {
    const userId = req.session.user.userid

    const [[member]] = await db.execute(
      'SELECT address, city, zip FROM members WHERE userid = ?',
      [userId]
    )

    const [cart] = await db.execute(`
      SELECT c.isbn, c.qty, b.price
      FROM cart c
      JOIN books b ON b.isbn = c.isbn
      WHERE c.userid = ?
    `, [userId])

    if (cart.length === 0) {
      return res.redirect('/cart')
    }

    const [order] = await db.execute(`
      INSERT INTO orders (userid, created, shipAddress, shipCity, shipZip)
      VALUES (?, NOW(), ?, ?, ?)
    `, [userId, member.address, member.city, member.zip])

    const orderNo = order.insertId

    for (const item of cart) {
      await db.execute(`
        INSERT INTO odetails (ono, isbn, qty, amount)
        VALUES (?, ?, ?, ?)
      `, [orderNo, item.isbn, item.qty, item.qty * item.price])
    }

    await db.execute('DELETE FROM cart WHERE userid = ?', [userId])

    res.redirect('/orders/success')
  }
}
