import { query as q } from 'faunadb'
import { client } from './client'
import { Document, DocumentData, FaunaResponse } from './types'

export async function getDocumentById(collection: string, id: string): Promise<Document> {
    return client.query<Document>(
        q.Get(q.Ref(q.Collection(collection), id))
    )
}

export async function getAllDocumentsInCollection(collection: string): Promise<DocumentData[]> {
    const response = await client.query<FaunaResponse<Document>>(
        q.Map(
            q.Paginate(q.Documents(q.Collection(collection))),
            q.Lambda("ref", q.Let(
                {
                    doc: q.Get(q.Var("ref")),
                    id: q.Select(["ref", "id"], q.Var("doc")),
                },
                q.Merge(q.Select(["data"], q.Var("doc")), { id: q.Var("id") })
            ))
        )
    )

    return response.data.map((item: Document) => item.data)
}

export async function createDocument(collection: string, data: DocumentData): Promise<Document> {
    return client.query<Document>(
        q.Create(q.Collection(collection), { data })
    );
}

export async function updateDocument(collection: string, id: string, data: DocumentData): Promise<Document> {
    return client.query<Document>(
        q.Update(q.Ref(q.Collection(collection), id), { data })
    )
}