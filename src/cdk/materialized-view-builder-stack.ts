import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import path from 'path';
import type { AwsAccountStackProps } from '../lib/types';
import { PROJECT_ROOT } from '../lib/types';

interface MaterializedViewBuilderStackProps extends AwsAccountStackProps {
  eventBus: events.EventBus;
  materializedViewTable: dynamodb.Table;
}

const lambdaTimeout = Duration.minutes(2);
const maxBatchingWindow = Duration.seconds(5);
const visibilityTimeout = Duration.seconds(725);
const reportBatchItemFailures = true; // lambda supports partial failures (e.g. in case only 5 out 50 messages failed returned back only failed back for processing)

export class MaterializedViewBuilderStack extends cdk.Stack {
  viewBuilderLambda: lambda.Function;

  viewBuilderQueue: sqs.Queue;

  eventBusRule: events.Rule;

  constructor(scope: Construct, id: string, props: MaterializedViewBuilderStackProps) {
    super(scope, id, props);

    this.viewBuilderQueue = new sqs.Queue(this, 'Materialized-View-Builder-SQS', {
      queueName: `materialized-view-builder-${props.envName}`,
      visibilityTimeout,
      receiveMessageWaitTime: Duration.seconds(10),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'Materialized-View-Builder-SQS-DLQ', {
          queueName: `materialized-view-builder-${props.envName}-dlq`,
        }),
        maxReceiveCount: 5,
      },
    });

    this.viewBuilderLambda = new lambda.Function(this, 'Materialized-View-Builder-Lambda', {
      code: lambda.Code.fromAsset(path.join(PROJECT_ROOT, 'dist/materialized-view-builder')),
      functionName: `materialized-view-builder-${props.envName}`,
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      description: 'Function to build materialized view items',
      timeout: lambdaTimeout,
      memorySize: 512,
      environment: {
        CTP_PROJECT_KEY: <string>process.env.CTP_PROJECT_KEY,
        CTP_CLIENT_ID: <string>process.env.CTP_CLIENT_ID,
        CTP_CLIENT_SECRET: <string>process.env.CTP_CLIENT_SECRET,
        CTP_AUTH_URL: <string>process.env.CTP_AUTH_URL,
        CTP_API_URL: <string>process.env.CTP_API_URL,
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        MATERIALIZED_VIEW_TABLE_NAME: props.materializedViewTable.tableName,
      },
    });

    // allow lambda to update integration state and materialized view tables
    props.materializedViewTable.grantReadWriteData(this.viewBuilderLambda);

    this.viewBuilderQueue.grantSendMessages(this.viewBuilderLambda);
    this.viewBuilderLambda.addEventSource(
      new SqsEventSource(this.viewBuilderQueue, {
        batchSize: 1,
        maxBatchingWindow,
        reportBatchItemFailures,
      }),
    );

    // event bus rule with SQS queue as a target
    this.eventBusRule = new events.Rule(this, 'Materialized-View-Builder-Rule', {
      ruleName: `materialized-view-builder-rule-${props.envName}`,
      enabled: true,
      description: 'Rule matching events targeting View Builder lambda for products and standalone prices',
      eventBus: props.eventBus,
      eventPattern: {
        detail: {
          resourceType: ['product', 'standalone-price'],
          target: ['all'],
        },
      },
    });

    this.eventBusRule.addTarget(new targets.SqsQueue(this.viewBuilderQueue));
  }
}
