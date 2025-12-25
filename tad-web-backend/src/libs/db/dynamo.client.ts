import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { config } from "../../config";

// 1. Inicializar el cliente base de DynamoDB
const client = new DynamoDBClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId || '',
    secretAccessKey: config.aws.secretAccessKey || ''
  }
});

// 2. Crear el cliente "Document" (Simplifica trabajar con JSON)
// removeUndefinedValues: true ayuda a que Dynamo no falle si un campo es undefined
const dynamoDbClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true } 
});

export { dynamoDbClient };