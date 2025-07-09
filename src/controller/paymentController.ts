import type { Request, Response } from 'express'

import { api_fallback, api } from '../service/api'

let totalRequestsDefault = 0
let totalAmountCentsDefault = 0
type PaymentItem = { amount: number; data: string }

const defaultList: PaymentItem[] = []
// let totalFeeDefault = 0
// let feePerTransactionCentsDefault = 0.01

let totalRequestsFallback = 0
let totalAmountCentsFallback = 0
const fallbackList: PaymentItem[] = []
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
      fallbackList.push({
        amount,
        data: new Date().toISOString(),
      })
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
      defaultList.push({
        amount,
        data: new Date().toISOString(),
      })
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
    default: {
      // totalRequests: totalRequestsDefault,
      // totalAmount: parseFloat((totalAmountCentsDefault / 100).toFixed(2)),
      totalRequests: defaultList.filter(item => {
        const itemDate = new Date(item.data)
        return itemDate >= new Date(from as string) && itemDate <= new Date(to as string)
      }).length,
      totalAmount: parseFloat((defaultList.filter(item => {
        const itemDate = new Date(item.data)
        return itemDate >= new Date(from as string) && itemDate <= new Date(to as string)
      }).reduce((acc, item) => acc + item.amount, 0)).toFixed(2)),
    },
    fallback: {
      // totalRequests: totalRequestsFallback,
      // totalAmount: parseFloat((totalAmountCentsFallback / 100).toFixed(2)),
      totalRequests: fallbackList.filter(item => {
        const itemDate = new Date(item.data)
        return itemDate >= new Date(from as string) && itemDate <= new Date(to as string)
      }).length,
      totalAmount: parseFloat((fallbackList.filter(item => {
        const itemDate = new Date(item.data)
        return itemDate >= new Date(from as string) && itemDate <= new Date(to as string)
      }).reduce((acc, item) => acc + item.amount, 0)).toFixed(2)),
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

  totalRequestsDefault = 0
  totalAmountCentsDefault = 0

  totalRequestsFallback = 0
  totalAmountCentsFallback = 0

  return res.status(200).json(data)
}

export default {
  summary,
  create,
  purge
}