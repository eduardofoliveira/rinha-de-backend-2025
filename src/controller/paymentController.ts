import type { Request, Response } from 'express'

import api, { api_fallback } from '../service/api'

let totalRequests = 0
let totalAmountCents = 0
let totalFee = 0
let feePerTransaction = 0.01

const summary = async (req: Request, res: Response): Promise<any> => {
  const { from, to } = req.query

  return res.status(200).json({
    totalRequests,
    totalAmount: parseFloat((totalAmountCents / 100).toFixed(2)),
    totalFee,
    feePerTransaction
  })
}

const create = async (req: Request, res: Response): Promise<any> => {
  const { correlationId, amount } = req.body

  const { data } = await api.post('/payments', req.body)

  console.log(`Payment created with correlationId: ${correlationId}, amount: ${amount}`)
  console.log({
    data
  })

  totalRequests++
  totalAmountCents += Math.round(Number(amount) * 100)

  return res.status(201).json(data)
}

const purge = async (req: Request, res: Response): Promise<any> => {
  const result = await Promise.all([
    api.post('/admin/purge-payments', req.body, {
      headers: {
        'X-Rinha-Token': 123
      }
    }),
    api_fallback.post('/admin/purge-payments', req.body, {
      headers: {
        'X-Rinha-Token': 123
      }
    }),
  ])

  const data = result.map(r => r.data)

  return res.status(200).json(data)
}

export default {
  summary,
  create,
  purge
}