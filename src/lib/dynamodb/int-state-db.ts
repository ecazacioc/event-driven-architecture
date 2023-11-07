import type { ResourceType } from 'aws-cdk-lib/aws-config';
import type { EnrichedNotificationEvent, NotificationType } from '../types';
import type { QueryCommandInput, WriteRequest } from '@aws-sdk/client-dynamodb';
import { BatchWriteItemCommand, paginateQuery } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from './common';
import _ from 'lodash';

const INT_STATE_TABLE_NAME = process.env.INT_STATE_TABLE_NAME || 'integration-state-demo';

export type IntegrationStateItem = {
  id: string;
  version: number;
  resourceType: ResourceType;
  changeDate?: string;
  changeType?: NotificationType;
  target?: 'all';
};

export async function saveIntegrationState(batch: EnrichedNotificationEvent[]): Promise<void> {
  const batchNoDuplicates = _.uniqBy(batch, (event) => [event.target, event.id].join());
  const putRequests: WriteRequest[] = batchNoDuplicates.map((event) => ({
    PutRequest: { Item: marshall(event) },
  }));

  await client.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [INT_STATE_TABLE_NAME]: putRequests,
      },
    }),
  );
}

export async function getIntegrationStatesById(id: string): Promise<IntegrationStateItem[]> {
  const query: QueryCommandInput = {
    TableName: INT_STATE_TABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': {
        S: id,
      },
    },
  };

  const result: IntegrationStateItem[] = [];

  for await (const integrationStates of paginateQuery({ client }, query)) {
    result.push(
      ...(<IntegrationStateItem[]>(
        integrationStates.Items?.filter((item) => item.changeType.S !== 'ResourceDeleted').map((item) =>
          unmarshall(item),
        )
      )),
    );
  }

  console.log({ data: result }, `Get integration state for id: ${id}`);

  return result;
}
