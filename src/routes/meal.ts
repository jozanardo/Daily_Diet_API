import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      isOnTheDiet: z.boolean(),
      creationUserId: z.string().uuid(),
    })

    const { name, description, isOnTheDiet, creationUserId } =
      createMealSchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    console.log({ name, description, isOnTheDiet, creationUserId }, sessionId)

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 365, // 365 dias
      })
    }

    await knex('meal').insert({
      id: randomUUID(),
      name,
      description,
      isOnTheDiet,
      creation_userId: creationUserId,
      session_id: sessionId,
    })

    return reply.status(201).send('Refeição cadastrada!')
  })

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const createMealSchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnTheDiet: z.boolean(),
        creationUserId: z.string().uuid(),
      })

      const { sessionId } = request.cookies

      const { name, description, isOnTheDiet, creationUserId } =
        createMealSchema.parse(request.body)

      await knex('meal').where({ id, session_id: sessionId }).update({
        name,
        description,
        isOnTheDiet,
        creation_userId: creationUserId,
      })

      return reply.status(200).send('Refeição atualizada!')
    },
  )
}
