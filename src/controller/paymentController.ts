import type { Request, Response } from 'express'

import { api_fallback, api } from '../service/api'

type PaymentItem = { amount: number; data: string }

let totalRequestsDefault = 0
let totalAmountCentsDefault = 0
let defaultList: PaymentItem[] = []

let totalRequestsFallback = 0
let totalAmountCentsFallback = 0
let fallbackList: PaymentItem[] = []

let requestsPending = 0

const ExecuteTransactionFallback = (amount: number, correlationId: string, requestedAt: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      await api_fallback.post('/payments', {
        amount,
        correlationId,
        requestedAt
      })
      totalRequestsFallback++
      totalAmountCentsFallback += Math.round(Number(amount) * 100)
      fallbackList.push({
        amount,
        data: requestedAt,
      })
      // totalFeeFallback += Math.round(Number(feePerTransactionCentsFallback) * 100)
      return resolve({ status: 'success', server: 'fallback' })
    } catch (error) {
      setTimeout(() => {
        return ExecuteTransaction(amount, correlationId, requestedAt)
      }, 250) // Simulate a delay before retrying
    }
  })
}

const ExecuteTransaction = (amount: number, correlationId: string, requestedAt: string, retryCount = 0): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      await api.post('/payments', {
        amount,
        correlationId,
        requestedAt
      })
      totalRequestsDefault++
      totalAmountCentsDefault += Math.round(Number(amount) * 100)
      defaultList.push({
        amount,
        data: requestedAt,
      })
      return resolve({ status: 'success', server: 'default' })
    } catch (error) {
      if (retryCount < 3) {
        setTimeout(() => {
          return ExecuteTransaction(amount, correlationId, requestedAt, retryCount + 1).then(resolve).catch(reject)
        }, 250)
      } else {
        setTimeout(() => {
          return ExecuteTransactionFallback(amount, correlationId, requestedAt).then(resolve).catch(reject)
        }, 250)
      }
    }
  })
}

const summary = async (req: Request, res: Response): Promise<any> => {
  const { from, to } = req.query

  return res.status(200).json({
    default: {
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
  requestsPending++

  const requestedAt = new Date().toISOString()
  const { correlationId, amount } = req.body
  ExecuteTransaction(amount, correlationId, requestedAt).then(() => {
    requestsPending--
  })

  // if (requestsPending > 15) {
  //   await new Promise(resolve => setTimeout(resolve, 1250)) // Simulate a delay for the transaction to be processed
  // }
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

  requestsPending = 0

  totalRequestsDefault = 0
  totalAmountCentsDefault = 0
  defaultList = []

  totalRequestsFallback = 0
  totalAmountCentsFallback = 0
  fallbackList = []

  return res.status(200).json(data)
}

export default {
  summary,
  create,
  purge
}