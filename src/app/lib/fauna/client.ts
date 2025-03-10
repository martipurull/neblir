import { Client } from 'fauna'

const faunaSecret = process.env.FAUNADB_SECRET;

const client = new Client({
    secret: faunaSecret
})

export { client }