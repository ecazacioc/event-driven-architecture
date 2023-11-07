import type { WriteRequest } from '@aws-sdk/client-dynamodb';
import { BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type {
  MaterializedViewItem,
  NotificationType,
  StreamEventName,
  StreamNotificationEvent,
  StreamResourceType,
} from '../types';
import {
  EVENT_NAME_INSERT,
  EVENT_NAME_MODIFY,
  EVENT_NAME_REMOVE,
  NOTIFICATION_TYPE_CREATED,
  NOTIFICATION_TYPE_DELETED,
  NOTIFICATION_TYPE_UPDATED,
} from '../types';
import type { DynamoDBRecord } from 'aws-lambda';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { client } from './common';

const MV_TABLE_NAME = process.env.MV_TABLE_NAME || 'materialized-view-demo';

export async function saveMaterializedViewItems<T extends MaterializedViewItem>(items: T[]): Promise<void> {
  const putRequests: WriteRequest[] = items.map((item) => ({
    PutRequest: { Item: marshall(item, { removeUndefinedValues: true }) },
  }));

  await client.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [MV_TABLE_NAME]: putRequests,
      },
    }),
  );
}

type StreamRecord = { [key: string]: AttributeValue };

const eventNameToNotificationType: Record<StreamEventName, NotificationType> = {
  [EVENT_NAME_INSERT]: NOTIFICATION_TYPE_CREATED,
  [EVENT_NAME_MODIFY]: NOTIFICATION_TYPE_UPDATED,
  [EVENT_NAME_REMOVE]: NOTIFICATION_TYPE_DELETED,
};

function getResourceType(eventSourceARN: string): StreamResourceType {
  return <StreamResourceType>eventSourceARN?.split('/')[1].split('-').slice(2, -1).join('-');
}

export function parseDynamoDBRecord<T>({
  dynamodb,
  eventName,
  eventSourceARN,
}: DynamoDBRecord): StreamNotificationEvent<T> {
  const newRecord = dynamodb && dynamodb.NewImage ? <T>unmarshall(<StreamRecord>dynamodb.NewImage) : undefined;
  const oldRecord = dynamodb && dynamodb.OldImage ? <T>unmarshall(<StreamRecord>dynamodb.OldImage) : undefined;

  return {
    newRecord,
    oldRecord,
    // Contains ARN of materialized-view tableName, assuming table name will always have format ial-view-${target}-${resourceType}-${envName}
    resourceType: getResourceType(<string>eventSourceARN),
    sequenceNumber: <string>dynamodb?.SequenceNumber,
    notificationType: eventNameToNotificationType[<StreamEventName>eventName],
  };
}
