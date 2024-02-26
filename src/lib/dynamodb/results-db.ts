import _ from 'lodash';
import type { ResultsDBItem } from '../types';
import type { WriteRequest } from '@aws-sdk/client-dynamodb';
import { BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { client } from './common';

const RESULTS_TABLE_NAME = process.env.RESULTS_TABLE_NAME || 'results-state-demo';

export async function saveResults(batch: ResultsDBItem[]): Promise<void> {
  const batchNoDuplicates = _.uniqBy(batch, 'targetIdentifier');
  const putRequests: WriteRequest[] = batchNoDuplicates.map((event) => ({
    PutRequest: { Item: marshall(event, { removeUndefinedValues: true }) },
  }));

  await client.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [RESULTS_TABLE_NAME]: putRequests,
      },
    }),
  );
}
