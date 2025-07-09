import 'dotenv/config'
import express from 'express'
import 'express-async-errors'
import morgan from 'morgan'
import cors from 'cors'

import paymentRoutes from './routes/paymentRoutes'

const port = process.env.PORT || 9999
const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(paymentRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})