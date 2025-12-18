import dontenv from 'dotenv'

dontenv.config({ path: './.env ' })
// Options object for the session middleware.
export const sessionOptions = {
  name: process.env.SESSION_NAME, // Don't use default session cookie name.
  secret: process.env.SESSION_SECRET, // Change it!!! The secret is used to hash the session with HMAC.
  resave: false, // Resave even if a request is not changing the session.
  saveUninitialized: false, // Don't save a created but not modified session.
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
    sameSite: 'strict'
  }
}

if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true // serve secure cookies
} else {
  sessionOptions.cookie.secure = false
}
