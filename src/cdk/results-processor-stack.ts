import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import path from 'path';
import type { AwsAccountStackProps } from '../lib/types';
import { PROJECT_ROOT } from '../lib/types';

interface ResultsProcessorStackProps extends AwsAccountStackProps {
  materializedViewTable: dynamodb.Table;
  integrationStateTable: dynamodb.Table;
}

const lambdaTimeout = Duration.minutes(2);

// Event source configuration
const batchSize = 20; // The number of records to send to the function in each batch
const maxBatchingWindow = Duration.seconds(50); // Specify the maximum amount of time to gather records before invoking the function
const reportBatchItemFailures = true; // lambda supports partial failures (e.g. in case only 5 out 50 messages failed returned back only failed back for processing)
const bisectBatchOnError = true; // when both bisectBatchOnError and reportBatchItemFailures are turned on, the batch is bisected at the returned sequence number and Lambda retries only the remaining records.
const retryAttempts = 3; // The maximum number of times that Lambda retries when the function returns an error.
const maxRecordAge = Duration.seconds(60); // The maximum age of a record that Lambda sends to your function
const parallelizationFactor = 1; // Concurrently process multiple batches from the same shard
const startingPosition = lambda.StartingPosition.LATEST; // Process only new records, or all existing records

export class ResultsProcessorStack extends cdk.Stack {
  resultsTable: dynamodb.Table;

  resultsProcessorLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ResultsProcessorStackProps) {
    super(scope, id, props);

    this.resultsTable = new dynamodb.Table(this, 'ResultsTable', {
      partitionKey: {
        name: 'targetIdentifier',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `results-${props.envName}`,
      pointInTimeRecovery: true,
    });

    this.resultsProcessorLambda = new lambda.Function(this, 'Results-Processor-Lambda', {
      code: lambda.Code.fromAsset(path.join(PROJECT_ROOT, 'dist/results-processor')),
      functionName: `results-processor-${props.envName}`,
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
        RESULTS_TABLE_NAME: this.resultsTable.tableName,
      },
    });

    // allow lambda to update tables
    this.resultsTable.grantReadWriteData(this.resultsProcessorLambda);
    props.integrationStateTable.grantReadWriteData(this.resultsProcessorLambda);
    props.materializedViewTable.grantReadData(this.resultsProcessorLambda);

    this.resultsProcessorLambda.addEventSource(
      new DynamoEventSource(props.materializedViewTable, {
        batchSize,
        bisectBatchOnError,
        maxRecordAge,
        reportBatchItemFailures,
        maxBatchingWindow,
        startingPosition,
        retryAttempts,
        parallelizationFactor,
      }),
    );
  }
}
