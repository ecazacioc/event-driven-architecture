import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';

import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import path from 'path';
import type { AwsAccountStackProps } from '../lib/types';
import { PROJECT_ROOT } from '../lib/types';

export interface UpdateProcessorStackProps extends AwsAccountStackProps {
  eventBus: events.EventBus;
  integrationStateTable: dynamodb.Table;
}

const lambdaTimeout = Duration.minutes(2);
const maxBatchingWindow = Duration.seconds(5);
const visibilityTimeout = Duration.seconds(725);

export class UpdateProcessorStack extends cdk.Stack {
  dataUpdatesLambda: lambda.Function;

  dataUpdatesQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: UpdateProcessorStackProps) {
    super(scope, id, props);

    this.dataUpdatesLambda = new lambda.Function(this, 'Data-Update-Processor-Lambda', {
      code: lambda.Code.fromAsset(path.join(PROJECT_ROOT, 'dist/data-update-processor')),
      functionName: `data-updates-processor-${props.envName}`,
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      description: 'Function to handle data updates in commercetools',
      timeout: lambdaTimeout,
      memorySize: 512,
      environment: {
        INT_STATE_TABLE_NAME: props.integrationStateTable.tableName,
        EVENT_BUS_NAME: props.eventBus.eventBusName,
      },
    });

    // allow lambda to publish events to event bus
    props.eventBus.grantPutEventsTo(this.dataUpdatesLambda);

    // allow lambda to read from integration state
    props.integrationStateTable.grantReadData(this.dataUpdatesLambda);

    // allow read data including indexes
    // https://github.com/aws/aws-cdk/issues/13703
    this.dataUpdatesLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query'],
        resources: [`${props.integrationStateTable.tableArn}/index/*`],
      }),
    );

    // A Queue to receive all updates from CT
    this.dataUpdatesQueue = new sqs.Queue(this, 'Data-Updates-SQS', {
      queueName: `data-updates-${props.envName}`,
      visibilityTimeout,
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'Data-Updates-SQS-DLQ', {
          queueName: `data-updates-${props.envName}-dlq`,
        }),
        maxReceiveCount: 5,
      },
    });

    // Lambda as a consumer of the queue
    this.dataUpdatesLambda.addEventSource(
      new SqsEventSource(this.dataUpdatesQueue, {
        batchSize: 1,
        maxBatchingWindow,
      }),
    );

    // Creating a user for subscription
    const iamUser = new iam.User(this, 'Subscription-User', {
      userName: `subscription-${props.envName}`,
    });

    // allow IAM user to send messages to queue
    this.dataUpdatesQueue.grantSendMessages(iamUser);

    // allow IAM user to read messages from queue
    const accessKey = new iam.CfnAccessKey(this, 'CT-Subscription-AccessKey', {
      userName: iamUser.userName,
    });

    new cdk.CfnOutput(this, 'AccessKeySecret', {
      value: accessKey.attrSecretAccessKey,
      description: 'Access Key Secret',
    });
  }
}
