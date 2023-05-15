import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserSchema = z.object({
      user: z.string(),
      name: z.string(),
      email: z.string(),
      password: z.string(),
    })

    const { user, name, email, password } = createUserSchema.parse(request.body)

    await knex('users').insert({
      id: randomUUID(),
      user,
      name,
      email,
      password,
    })

    return reply.status(201).send('Usuário criado!')
  })
}
