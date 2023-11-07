import type { SQSRecord } from 'aws-lambda';
import type { BatchItemFailures, EnrichedNotificationEvent } from './types';

export function parseSqsRecord({ messageId, body }: SQSRecord): EnrichedNotificationEvent {
  const eventBody = JSON.parse(body);
  // events sent by event-bridge and directly to queue have different structure
  const eventData = 'detail' in eventBody && 'detail-type' in eventBody ? eventBody.detail : eventBody;

  return {
    ...eventData,
    messageId,
  };
}

export function parseBatchItemFailures(failedMessageIds: string[]): BatchItemFailures {
  const batchItemFailures = failedMessageIds.map((id) => ({
    itemIdentifier: id,
  }));

  if (batchItemFailures.length > 0) {
    console.log(
      {
        data: {
          batchItemFailures,
        },
      },
      'Failed to process items. Return failed messages back to DynamoDb Stream queue',
    );
  }

  return {
    batchItemFailures,
  };
}
