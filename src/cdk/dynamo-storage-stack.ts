import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AwsAccountStackProps } from '../lib/types';

type DynamoStorageStackProps = AwsAccountStackProps;

export class DynamoStorageStack extends cdk.Stack {
  public integrationStateTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoStorageStackProps) {
    super(scope, id, props);

    // table to store integration's most recent data state
    this.integrationStateTable = new dynamodb.Table(this, 'IntegrationStateTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `integration-state-${props.envName}`,
      pointInTimeRecovery: true,
    });

    new cdk.CfnOutput(this, 'IntegrationStateTableName', {
      value: this.integrationStateTable.tableName,
      description: 'Table to store integration\'s most recent data state',
    });
  }
}
