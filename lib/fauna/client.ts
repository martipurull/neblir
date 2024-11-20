import faunadb from 'faunadb'

const faunaSecret = process.env.FAUNADB_SECRET;

if (!faunaSecret) {
    throw new Error("FAUNADB_SECRET environment variable is not defined")
}

const client = new faunadb.Client({
    secret: faunaSecret
})

export { client }