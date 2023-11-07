import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export const client = new DynamoDBClient({
  credentials: defaultProvider(),
  maxAttempts: 3,
  region: 'eu-west-1',
});
