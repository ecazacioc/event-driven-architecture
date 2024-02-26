import type { Handler, SQSEvent } from 'aws-lambda';
import type { EnrichedNotificationEvent, ProductMaterializedViewItem } from '../../lib';
import { parseBatchItemFailures, saveMaterializedViewItems } from '../../lib';
import { parseSqsRecord } from '../../lib';
import { apiRoot } from '../../lib/ct-api';

export const handler: Handler = async (event: SQSEvent) => {
  console.log('Function input event: \n' + JSON.stringify(event, null, 2));

  // Getting body from SQS event
  const records: EnrichedNotificationEvent[] = event.Records.map(parseSqsRecord);

  const items: ProductMaterializedViewItem[] = [];
  const failedMessageIds: string[] = [];

  // Filtering out deleted resources
  const allChanged = records.filter((record) => record.changeType !== 'ResourceDeleted');

  console.log('Number of changed resources: ' + allChanged.length);

  for (const record of allChanged) {
    try {
      // Getting all changed products
      const [product] = await apiRoot
        .products()
        .get({
          queryArgs: {
            sort: 'id asc',
            withTotal: false,
            where: `id="${record.id}"`,
          },
        })
        .execute()
        .then((response) => response.body.results);

      if (!product) {
        throw new Error(`Product with id ${record.id} not found`);
      }

      // Getting price for product
      const [price] = await apiRoot
        .standalonePrices()
        .get({
          queryArgs: {
            where: `sku="${product.masterData.current.masterVariant.sku}"`,
          },
        })
        .execute()
        .then((response) => response.body.results);

      // Creating materialized view item
      items.push({
        id: product.id,
        version: product.version,
        changeDate: new Date().toISOString(),
        createdAt: product.createdAt,
        name: product.masterData.current.name['en-GB'],
        description: product.masterData.current.description?.['en-GB'],
        price: price?.value.centAmount / 100,
      });
    } catch (error) {
      failedMessageIds.push(<string>record.messageId);
      console.log({ error }, 'Error during service Materialized View Builder execution.');
    }
  }

  console.log('Number of items to save: ' + items.length);

  if (items.length) {
    await saveMaterializedViewItems(items);
    console.log({ data: items }, 'Materialized View Items has been processed.');
  }

  return parseBatchItemFailures(failedMessageIds);
};
