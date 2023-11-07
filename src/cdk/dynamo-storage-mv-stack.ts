import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';
import type { AwsAccountStackProps } from '../lib';

type DynamoStorageStackProps = AwsAccountStackProps;

export class DynamoStorageMaterializedViewStack extends cdk.Stack {
  public materializedViewTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoStorageStackProps) {
    super(scope, id, props);

    // table to store materialized view items
    this.materializedViewTable = new dynamodb.Table(this, 'MaterializedViewTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `materialized-view-${props.envName}`,
      pointInTimeRecovery: true,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });
  }
}
