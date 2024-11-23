export interface DocumentData {
    [key: string]: unknown
}

export interface Document {
    ref: {
        '@ref': {
            id: string;
            collection: {
                '@ref': {
                    id: string
                    collection: {
                        '@ref': {
                            id: string
                        }
                    }
                }
            }
        }
    }
    ts: number
    data: DocumentData
}

export interface FaunaResponse<T> {
    data: T[];
}