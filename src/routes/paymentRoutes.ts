import { Router, Request, Response } from 'express'

import paymentController from '../controller/paymentController'

const router = Router()

router.get('/payments-summary', paymentController.summary)
router.post('/payments', paymentController.create)
router.post('/purge-payments', paymentController.purge)

export default router