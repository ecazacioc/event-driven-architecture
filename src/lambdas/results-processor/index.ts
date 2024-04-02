import type { Handler, DynamoDBStreamEvent } from 'aws-lambda';
import type {
  EnrichedNotificationEvent,
  ProductMaterializedViewItem,
  ResultsDBItem,
  StreamNotificationEvent,
} from '../../lib';
import { parseBatchItemFailures, parseDynamoDBRecord } from '../../lib';
import { saveIntegrationState } from '../../lib/dynamodb';
import { saveResults } from '../../lib/dynamodb/results-db';

export const handler: Handler = async (event: DynamoDBStreamEvent) => {
  console.log('Function input event: \n' + JSON.stringify(event, null, 2));

  const records: StreamNotificationEvent<ProductMaterializedViewItem>[] = event.Records.map(
    parseDynamoDBRecord<ProductMaterializedViewItem>,
  );

  // Filtering out deleted resources
  const allChanged = records.filter((record) => record.notificationType !== 'ResourceDeleted');

  const failedMessageIds: string[] = [];

  for (const { newRecord, sequenceNumber, notificationType } of allChanged) {
    try {
      const results: ResultsDBItem[] = [];
      const eventsToSaveIntState: EnrichedNotificationEvent[] = [];

      if (newRecord) {
        results.push({
          targetIdentifier: newRecord.id,
          targetName: newRecord.name,
          targetDescription: newRecord.description,
          targetPrice: newRecord.price,
        });

        eventsToSaveIntState.push({
          id: newRecord.id,
          version: newRecord.version,
          source: 'materialized-view-stream',
          target: 'all',
          changeType: notificationType,
          resourceType: 'product',
        });
      }

      if (results.length > 0) {
        await saveResults(results);
      }

      await saveIntegrationState(eventsToSaveIntState);
    } catch (error) {
      failedMessageIds.push(sequenceNumber);
      console.error({ error }, 'Error during indexing feed processor');
    }
  }

  return parseBatchItemFailures(failedMessageIds);
};
