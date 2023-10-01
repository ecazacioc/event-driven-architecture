import {
  QueryCommandInput,
  paginateQuery,
  BatchWriteItemCommand,
  WriteRequest,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import _ from "lodash";
import { EventBridgeEvent, NotificationType, ResourceType } from "./types";

const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || "integration-state-demo";

export type IntegrationStateItem = {
  id: string;
  version: number;
  resourceType: ResourceType;
  changeDate?: string;
  changeType?: NotificationType;
  target?: "all";
};

export const client = new DynamoDBClient({
  credentials: defaultProvider(),
  maxAttempts: 3,
  region: "eu-west-1",
});

export async function saveIntegrationStateInBatches(
  batches: EventBridgeEvent[][]
): Promise<void> {
  for (const batch of batches) {
    const batchNoDuplicates = _.uniqBy(batch, (event) =>
      [event.target, event.id].join()
    );
    const putRequests: WriteRequest[] = batchNoDuplicates.map((event) => ({
      PutRequest: { Item: marshall(event) },
    }));

    await client.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [TABLE_NAME]: putRequests,
        },
      })
    );
  }
}

export async function getIntegrationStatesById(
  id: string
): Promise<IntegrationStateItem[]> {
  const query: QueryCommandInput = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": {
        S: id,
      },
    },
  };

  const result: IntegrationStateItem[] = [];

  for await (const integrationStates of paginateQuery({ client }, query)) {
    result.push(
      ...(<IntegrationStateItem[]>(
        integrationStates.Items?.filter(
          (item) => item.changeType.S !== "ResourceDeleted"
        ).map((item) => unmarshall(item))
      ))
    );
  }

  console.log({ data: result }, `Get integration state for id: ${id}`);

  return result;
}
