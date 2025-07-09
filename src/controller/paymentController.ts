import type { Request, Response } from 'express'

import api, { api_fallback } from '../service/api'

const create = async (req: Request, res: Response): Promise<any> => {
  console.log(req.body)

  const { data } = await api.post('/payments', req.body)
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
  create,
  purge
}