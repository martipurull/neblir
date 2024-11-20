import { query as q } from 'faunadb'
import { client } from './client'

export async function getDocumentById(collection: string, id: string) {
    return client.query(
        q.Get(q.Ref(q.Collection(collection), id))
    )
}

export async function getAllDocumentsInCollection(collection: string) {
    return client.query(
        q.Map(
            q.Paginate(q.Documents(q.Collection(collection))),
            q.Lambda("X", q.Get(q.Var("X")))
        )
    ).then(response => response.data.map(player => player.data))
}