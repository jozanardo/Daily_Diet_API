import fastify from 'fastify'
import { usersRoutes } from './routes/users'

const app = fastify()

app.register(usersRoutes, {
  prefix: 'users',
})

app
  .listen({
    port: 3030,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
