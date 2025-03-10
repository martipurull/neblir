import { client } from './client'
import { Document, DocumentData, Player } from './types'
import { FaunaError, fql, QueryArgument } from 'fauna'

export async function getDocumentById(collection: string, id: string): Promise<Document> {
    const query = fql`Collection(${collection}).byId(${id})`
    const { data } = await client.query(query, { format: 'simple' })

    return data
}

export async function getAllDocumentsInCollection(collection: string): Promise<DocumentData[]> {
    const query = fql`Collection(${collection}).all()`
    const { data: { data } } = await client.query(query, { format: 'simple' })

    return data
}

export async function createDocument(collection: string, data: QueryArgument) {
    try {
        const query = fql`Collection(${collection}).create(${data}) {id, ts, email, name}`
        const { data: responseData } = await client.query(query, { format: 'simple' })

        return responseData
    } catch (error) {
        if (error instanceof FaunaError) {
            console.error('FaunaError: ', error)
        }
    }
}

export async function updateDocument(collection: string, id: string, data: Record<string, any>): Promise<any> {
    const query = fql`Collection(${collection}).byId(${id})!.update(${data})`
    const { data: updatedData } = await client.query(query, { format: 'simple' })

    return updatedData
}

export async function getPlayerByEmail(email: string): Promise<Player> {
    const query = fql`players.byEmail(${email})`
    const { data } = await client.query(query, { format: 'simple' });

    return data[0]
}