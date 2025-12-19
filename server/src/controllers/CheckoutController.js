import { db } from '../config/db.js'

/**
 *
 */
export class CheckoutController {
  /**
   *
   * @param req
   * @param res
   */
  async checkout (req, res) {
    const user = req.session.user
    const userId = user.userid

    const [cartItems] = await db.execute(`
    SELECT c.isbn, c.qty, b.price, b.title
    FROM cart c
    JOIN books b ON c.isbn = b.isbn
    WHERE c.userid = ? AND c.qty > 0
  `, [userId])

    if (cartItems.length === 0) {
      return res.redirect('/cart')
    }

    const [orderResult] = await db.execute(`
    INSERT INTO orders (userid, created, shipAddress, shipCity, shipZip)
    VALUES (?, NOW(), ?, ?, ?)
  `, [
      userId,
      user.address,
      user.city,
      user.zip
    ])

    const orderNo = orderResult.insertId

    for (const item of cartItems) {
      const amount = item.price * item.qty
      await db.execute(`
      INSERT INTO odetails (ono, isbn, qty, amount)
      VALUES (?, ?, ?, ?)
    `, [
        orderNo,
        item.isbn,
        item.qty,
        amount
      ])
    }

    await db.execute('DELETE FROM cart WHERE userid = ?', [userId])

    res.redirect(`/checkout/invoice/${orderNo}`)
  }

  /**
   *
   * @param req
   * @param res
   */
  async invoice (req, res) {
    const orderNo = req.params.ono

    console.log('Order ID:', orderNo)

    if (!orderNo) {
      return res.status(400).render('error', { message: 'Order number is missing' })
    }

    try {
      const [orders] = await db.execute(`
      SELECT o.ono, o.created, o.shipAddress, o.shipCity, o.shipZip,
             m.fname, m.lname
      FROM orders o
      JOIN members m ON o.userid = m.userid
      WHERE o.ono = ?
    `, [Number(orderNo)])

      if (orders.length === 0) {
        return res.status(404).render('error', { message: 'Order not found' })
      }

      const order = orders[0]

      const [details] = await db.execute(`
      SELECT od.isbn, b.title, b.price, od.qty, od.amount
      FROM odetails od
      JOIN books b ON od.isbn = b.isbn
      WHERE od.ono = ?
    `, [Number(orderNo)])

      const total = details.reduce((sum, item) => sum + item.amount, 0)

      const orderDate = new Date(order.created)
      const deliveryDate = new Date(orderDate)
      deliveryDate.setDate(deliveryDate.getDate() + 7)

      res.render('books/invoice', {
        order,
        details,
        total,
        orderDate: orderDate.toLocaleDateString('sv-SE'),
        deliveryDate: deliveryDate.toLocaleDateString('sv-SE')
      })
    } catch (err) {
      console.error('Invoice error:', err)
      res.status(500).render('error', { message: 'Error loading invoice' })
    }
  }
}
