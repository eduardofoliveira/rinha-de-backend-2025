import type { Request, Response } from 'express'

import { api_fallback, api } from '../service/api'

let totalRequestsDefault = 0
let totalAmountCentsDefault = 0
// let totalFeeDefault = 0
// let feePerTransactionCentsDefault = 0.01

let totalRequestsFallback = 0
let totalAmountCentsFallback = 0
// let totalFeeFallback = 0
// let feePerTransactionCentsFallback = 0.01

const ExecuteTransactionFallback = (amount: number, correlationId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      await api_fallback.post('/payments', {
        amount,
        correlationId,
      })
      totalRequestsFallback++
      totalAmountCentsFallback += Math.round(Number(amount) * 100)
      // totalFeeFallback += Math.round(Number(feePerTransactionCentsFallback) * 100)
      return resolve({ status: 'success', server: 'fallback' })
    } catch (error) {
      setTimeout(() => {
        return ExecuteTransaction(amount, correlationId)
      }, 1000) // Simulate a delay before retrying
    }
  })
}

const ExecuteTransaction = (amount: number, correlationId: string, retryCount = 0): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      await api.post('/payments', {
        amount,
        correlationId,
      })
      totalRequestsDefault++
      totalAmountCentsDefault += Math.round(Number(amount) * 100)
      return resolve({ status: 'success', server: 'default' })
    } catch (error) {
      if (retryCount < 15) {
        setTimeout(() => {
          ExecuteTransaction(amount, correlationId, retryCount + 1).then(resolve).catch(reject)
        }, 1000)
      } else {
        setTimeout(() => {
          ExecuteTransactionFallback(amount, correlationId).then(resolve).catch(reject)
        }, 1000)
      }
    }
  })
}

const summary = async (req: Request, res: Response): Promise<any> => {
  const { from, to } = req.query

  return res.status(200).json({
    // totalRequests,
    // totalAmount: parseFloat((totalAmountCents / 100).toFixed(2)),
    // totalFee: parseFloat((totalFee / 100).toFixed(2)),
    // feePerTransaction: feePerTransactionCents,
    default: {
      totalRequests: totalRequestsDefault,
      totalAmount: parseFloat((totalAmountCentsDefault / 100).toFixed(2)),
      // totalFee: parseFloat((totalFeeDefault / 100).toFixed(2)),
      // feePerTransaction: feePerTransactionCentsDefault,
    },
    fallback: {
      totalRequests: totalRequestsFallback,
      totalAmount: parseFloat((totalAmountCentsFallback / 100).toFixed(2)),
      // totalFee: parseFloat((totalFeeFallback / 100).toFixed(2)),
      // feePerTransaction: feePerTransactionCentsFallback,
    }
  })
}

const create = async (req: Request, res: Response): Promise<any> => {
  res.status(201).json({ message: 'payment processed successfully' })
  const { correlationId, amount } = req.body
  ExecuteTransaction(amount, correlationId)
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