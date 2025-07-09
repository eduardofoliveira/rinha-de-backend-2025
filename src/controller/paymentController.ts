import type { Request, Response } from 'express'

import api from '../service/api'

const create = async (req: Request, res: Response): Promise<any> => {
  console.log(req.body)

  const { data } = await api.post('/payments', req.body)
  return res.status(201).json(data)
}

export default {
  create
}