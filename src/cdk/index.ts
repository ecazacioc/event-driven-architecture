import * as cdk from "aws-cdk-lib";

import { AwsAccountStackProps, Environment } from "../lib/types";
import { UpdateProcessorStack } from "./data-update-processor-stack";
import { EventBridgeStack } from "./event-bridge-stack";
import { DynamoStorageStack } from "./dynamo-storage-stack";

export function getEnvName(): Environment {
  return <Environment>process.env.AWS_ENVIRONMENT_NAME || Environment.DEMO;
}

export function getAWSAccountId() {
  return process.env.AWS_ACCOUNT_ID;
}

export function getAWSRegion() {
  return process.env.AWS_REGION || "eu-west-1";
}

export function getAWSEnv(): cdk.Environment {
  return {
    account: getAWSAccountId(),
    region: getAWSRegion(),
  };
}

// Providing stacks to the CDK app
export function provideStacks(
  app: cdk.App,
  stackProps: AwsAccountStackProps
): void {
  const { eventBus } = new EventBridgeStack(
    app,
    `Event-Bridge-${stackProps.envName}`,
    stackProps
  );

  const { integrationStateTable } = new DynamoStorageStack(
    app,
    `Integration-State-${stackProps.envName}`,
    stackProps
  );

  new UpdateProcessorStack(
    app,
    `Data-Update-Processor-${stackProps.envName}`,
    {
      ...stackProps,
      eventBus,
      integrationStateTable,
    }
  );
}
