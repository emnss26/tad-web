import {
  PutCommand,
  GetCommand,
  BatchWriteCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDbClient } from "./dynamo.client";

type BatchWriteResult = {
  unprocessed: number;
  processed: number;
};

const isBatchWriteAccessDenied = (error: any): boolean => {
  const name = String(error?.name || error?.__type || "");
  const message = String(error?.message || "");
  return (
    (name.includes("AccessDenied") || message.toLowerCase().includes("not authorized")) &&
    message.includes("BatchWriteItem")
  );
};

export const DynamoLib = {
  saveItem: async (tableName: string, item: any) => {
    await dynamoDbClient.send(
      new PutCommand({ TableName: tableName, Item: item })
    );
    return true;
  },

  getItem: async (tableName: string, key: Record<string, any>) => {
    const result = await dynamoDbClient.send(
      new GetCommand({ TableName: tableName, Key: key })
    );
    return result.Item;
  },

  deleteItem: async (tableName: string, key: Record<string, any>) => {
    await dynamoDbClient.send(
      new DeleteCommand({ TableName: tableName, Key: key })
    );
    return true;
  },

  // ✅ Query por PK (paginado)
  queryByPK: async ({
    tableName,
    pkName,
    pkValue,
  }: {
    tableName: string;
    pkName: string;
    pkValue: string;
  }) => {
    const out: any[] = [];
    let ExclusiveStartKey: any = undefined;

    do {
      const res = await dynamoDbClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "#pk = :pk",
          ExpressionAttributeNames: { "#pk": pkName },
          ExpressionAttributeValues: { ":pk": pkValue },
          ExclusiveStartKey,
        })
      );

      out.push(...(res.Items || []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return out;
  },

  queryByPKBeginsWithSK: async ({
    tableName,
    pkName,
    pkValue,
    skName,
    skBeginsWith,
    scanIndexForward = true,
    limit,
  }: {
    tableName: string;
    pkName: string;
    pkValue: string;
    skName: string;
    skBeginsWith: string;
    scanIndexForward?: boolean;
    limit?: number;
  }) => {
    const out: any[] = [];
    let ExclusiveStartKey: any = undefined;

    do {
      const res = await dynamoDbClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
          ExpressionAttributeNames: { "#pk": pkName, "#sk": skName },
          ExpressionAttributeValues: { ":pk": pkValue, ":sk": skBeginsWith },
          ExclusiveStartKey,
          ScanIndexForward: scanIndexForward,
          Limit: limit,
        })
      );

      out.push(...(res.Items || []));
      if (limit && out.length >= limit) break;
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return limit ? out.slice(0, limit) : out;
  },

  // ✅ Query por GSI con begins_with (paginado)
  queryByGSI: async ({
    tableName,
    indexName,
    pkName,
    pkValue,
    skName,
    skBeginsWith,
  }: {
    tableName: string;
    indexName: string;
    pkName: string;
    pkValue: string;
    skName: string;
    skBeginsWith: string;
  }) => {
    const out: any[] = [];
    let ExclusiveStartKey: any = undefined;

    do {
      const res = await dynamoDbClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: indexName,
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
          ExpressionAttributeNames: { "#pk": pkName, "#sk": skName },
          ExpressionAttributeValues: { ":pk": pkValue, ":sk": skBeginsWith },
          ExclusiveStartKey,
        })
      );

      out.push(...(res.Items || []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return out;
  },

  // ✅ Update de un campo (seguro y simple)
  updateField: async (
    tableName: string,
    key: Record<string, any>,
    field: string,
    value: any
  ) => {
    await dynamoDbClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: "SET #f = :v, #u = :u",
        ExpressionAttributeNames: { "#f": field, "#u": "updatedAt" },
        ExpressionAttributeValues: { ":v": value, ":u": new Date().toISOString() },
      })
    );
    return true;
  },

  updateItem: async ({
    tableName,
    key,
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
    conditionExpression,
  }: {
    tableName: string;
    key: Record<string, any>;
    updateExpression: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, any>;
    conditionExpression?: string;
  }) => {
    await dynamoDbClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: conditionExpression,
      })
    );

    return true;
  },

  /**
   * ✅ batchWrite (API LEGACY)
   * Tus controllers viejos llaman DynamoLib.batchWrite(...)
   * Lo mantenemos y por debajo usamos el retry nuevo.
   */
  batchWrite: async (tableName: string, items: any[]): Promise<BatchWriteResult> => {
    return DynamoLib.batchWriteWithRetry(tableName, items);
  },

  /**
   * ✅ BatchWrite con retry por UnprocessedItems (API NUEVA)
   * Útil para modeldata (y en general para todo).
   */
  batchWriteWithRetry: async (
    tableName: string,
    items: any[],
    opts?: { maxRetries?: number; backoffMs?: number; chunkSize?: number }
  ): Promise<BatchWriteResult> => {
    const chunkSize = opts?.chunkSize ?? 25;
    const maxRetries = opts?.maxRetries ?? 3;
    const backoffMs = opts?.backoffMs ?? 200;

    if (!Array.isArray(items) || items.length === 0) {
      return { unprocessed: 0, processed: 0 };
    }

    const chunks: any[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    let totalUnprocessed = 0;
    let processed = 0;

    for (const chunk of chunks) {
      let pending: any[] = chunk.map((Item) => ({ PutRequest: { Item } }));
      let completedByFallback = false;

      for (let attempt = 0; attempt < maxRetries && pending.length > 0; attempt++) {
        try {
          const res = await dynamoDbClient.send(
            new BatchWriteCommand({ RequestItems: { [tableName]: pending } })
          );

          const unprocessed = res.UnprocessedItems?.[tableName] || [];
          const successCount = pending.length - unprocessed.length;
          processed += successCount;
          pending = unprocessed;

          if (pending.length > 0 && attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
          }
        } catch (error: any) {
          if (!isBatchWriteAccessDenied(error)) throw error;

          for (const req of pending) {
            const item = req?.PutRequest?.Item;
            try {
              await dynamoDbClient.send(
                new PutCommand({ TableName: tableName, Item: item })
              );
              processed += 1;
            } catch {
              totalUnprocessed += 1;
            }
          }

          pending = [];
          completedByFallback = true;
          break;
        }
      }

      if (!completedByFallback && pending.length > 0) {
        totalUnprocessed += pending.length;
      }
    }

    return { unprocessed: totalUnprocessed, processed };
  },
};
