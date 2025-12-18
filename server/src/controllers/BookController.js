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
}
