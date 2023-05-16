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

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      await knex('meal').where({ id, session_id: sessionId }).delete()

      return reply.status(200).send('Refeição deletada!')
    },
  )

  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const meals = await knex('meal').where({ session_id: sessionId }).select()

      return reply.status(200).send({ meals })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const meal = await knex('meal')
        .where({ id, session_id: sessionId })
        .first()

      return reply.status(200).send({ meal })
    },
  )

  app.get(
    '/metrics',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meal').where({ session_id: sessionId }).select()

      const registeredMeals = meals.length

      const mealsWithinTheDiet = meals.filter(
        // eslint-disable-next-line eqeqeq
        (item) => item.isOnTheDiet == true,
      ).length

      const mealsOffTheDiet = registeredMeals - mealsWithinTheDiet

      const createdDates = meals.map((meal) => meal.created_at.split(' ')[0])

      const counts = createdDates.reduce((acc: any, date) => {
        acc[date] = acc[date] ? acc[date] + 1 : 1
        return acc
      }, [])

      const [bestDayWithinDiet, bestSequenceWithinDiet] = Object.entries(
        counts,
      ).reduce(
        (max: [string, number], [item, count]: any) => {
          return count > max[1] ? [item, count] : max
        },
        ['', 0],
      )

      return {
        registeredMeals,
        mealsWithinTheDiet,
        mealsOffTheDiet,
        bestDayWithinDiet,
        bestSequenceWithinDiet,
      }
    },
  )
}
