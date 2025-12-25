import { PutCommand, GetCommand, BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbClient } from "./dynamo.client";

export const DynamoLib = {
  
  /**
   * Guardar o Actualizar un solo item
   */
  saveItem: async (tableName: string, item: any) => {
    try {
      await dynamoDbClient.send(new PutCommand({
        TableName: tableName,
        Item: item
      }));
      return true;
    } catch (error) {
      console.error(`[DynamoLib] Error saving item to ${tableName}:`, error);
      throw error;
    }
  },

  /**
   * Obtener un item por su llave primaria (PK y opcional SK)
   */
  getItem: async (tableName: string, key: Record<string, any>) => {
    try {
      const result = await dynamoDbClient.send(new GetCommand({
        TableName: tableName,
        Key: key
      }));
      return result.Item;
    } catch (error) {
      console.error(`[DynamoLib] Error getting item from ${tableName}:`, error);
      throw error;
    }
  },

  /**
   * Escritura Masiva (Batch Write) - Maneja chunks de 25 items (Límite de AWS)
   * Ideal para guardar listas de Usuarios, Issues o Proyectos.
   */
  batchWrite: async (tableName: string, items: any[]) => {
    if (items.length === 0) return;

    // DynamoDB permite máximo 25 operaciones por batch
    const chunkSize = 25;
    const chunks = [];

    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    console.log(`[DynamoLib] Saving ${items.length} items to ${tableName} in ${chunks.length} batches...`);

    for (const chunk of chunks) {
      const putRequests = chunk.map(item => ({
        PutRequest: { Item: item }
      }));

      try {
        await dynamoDbClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: putRequests
          }
        }));
      } catch (error) {
        console.error(`[DynamoLib] Error in batch write to ${tableName}:`, error);
        // Podrías lanzar error o continuar con el siguiente chunk
      }
    }
  }
};