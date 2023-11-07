import type * as cdk from 'aws-cdk-lib';

import type { AwsAccountStackProps } from '../lib/types';
import { UpdateProcessorStack } from './data-update-processor-stack';
import { EventBridgeStack } from './event-bridge-stack';
import { DynamoStorageStack } from './dynamo-storage-stack';
import { MaterializedViewBuilderStack } from './materialized-view-builder-stack';
import { DynamoStorageMaterializedViewStack } from './dynamo-storage-mv-stack';
import { ResultsProcessorStack } from './results-processor-stack';

// Providing stacks to the CDK app
export function provideStacks(app: cdk.App, stackProps: AwsAccountStackProps): void {
  const { eventBus } = new EventBridgeStack(app, `Event-Bridge-${stackProps.envName}`, stackProps);

  const { integrationStateTable } = new DynamoStorageStack(
    app,
    `Integration-State-DB-${stackProps.envName}`,
    stackProps,
  );

  new UpdateProcessorStack(app, `Data-Update-Processor-${stackProps.envName}`, {
    ...stackProps,
    eventBus,
    integrationStateTable,
  });

  const { materializedViewTable } = new DynamoStorageMaterializedViewStack(
    app,
    `Materialized-View-DB-${stackProps.envName}`,
    stackProps,
  );

  new MaterializedViewBuilderStack(app, `Materialized-View-Builder-${stackProps.envName}`, {
    ...stackProps,
    eventBus,
    materializedViewTable,
  });

  new ResultsProcessorStack(app, `Results-Processor-${stackProps.envName}`, {
    ...stackProps,
    materializedViewTable,
    integrationStateTable,
  });
}
