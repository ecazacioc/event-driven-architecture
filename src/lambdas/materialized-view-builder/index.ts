import { Context, Handler, SQSEvent } from "aws-lambda";
import {
  publishEvents,
  invalidateChanges,
  createEventBridgeEvent,
} from "../../lib";

export const handler: Handler = async (event: SQSEvent, context: Context) => {
  console.log("Function input event: \n" + JSON.stringify(event, null, 2));

  // Getting body from SQS event
  const updates = event.Records.map((record) => JSON.parse(record.body));

  // Enriching and sorting events
  const invalidatedChanges = await invalidateChanges(updates);

  // Creating EventBridge events
  const results = invalidatedChanges.map(createEventBridgeEvent);

  // Publishing events to EventBridge
  console.log({ data: results }, "Result of enrichment and sorting of events");

  if (results.length > 0) {
    await publishEvents(results);
  }
};
