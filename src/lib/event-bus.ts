import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { ChangeNotificationEvent, EventBridgeEvent, ResourceType } from './types';

export function createEventBridgeEvent({
  notificationType: changeType,
  resource,
  resource: { id },
  version,
}: ChangeNotificationEvent): EventBridgeEvent {
  return {
    source: 'data-update-processor',
    target: 'all',
    changeType,
    resourceType: <ResourceType>resource.typeId,
    id,
    version,
  };
}

export async function publishEvents(results: EventBridgeEvent[]): Promise<void> {
  for (const batch of splitResultToBatches(results)) {
    console.log({ data: batch }, 'Events in batch');

    const eventBus = new EventBridgeClient({
      maxAttempts: 3,
    });
    const data = await eventBus.send(
      new PutEventsCommand({
        Entries: batch.map((event) => ({
          Source: event.source,
          EventBusName: process.env.EVENT_BUS_NAME,
          DetailType: event.resourceType,
          Detail: JSON.stringify(event),
        })),
      }),
    );
    console.log({ data }, 'Results of publishing of events');
    console.log('After calling send to queue');
  }
}

function splitResultToBatches(results: EventBridgeEvent[]): Array<EventBridgeEvent[]> {
  const chunkedArr: EventBridgeEvent[][] = [];
  const batchSize = 10;
  if (results) {
    let index = 0;
    while (index < results.length) {
      chunkedArr.push(results.slice(index, batchSize + index));
      index += batchSize;
    }
  }
  return chunkedArr;
}
