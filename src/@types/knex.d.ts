// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      user: string
      name: string
      email: string
      password: string
      created_at: string
    }
    meal: {
      id: string
      name: string
      description: string
      isOnTheDiet: boolean
      creation_userId: string
      created_at: string
      session_id: string
    }
  }
}
