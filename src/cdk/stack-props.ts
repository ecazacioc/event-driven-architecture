import type * as cdk from 'aws-cdk-lib';

import type { AwsAccountStackProps } from '../lib';
import { Environment } from '../lib';

function getEnvName(): Environment {
  return <Environment>process.env.AWS_ENVIRONMENT_NAME || Environment.DEMO;
}

function getAWSAccountId() {
  return process.env.AWS_ACCOUNT_ID;
}

function getAWSRegion() {
  return process.env.AWS_REGION || 'eu-west-1';
}

function getAWSEnv(): cdk.Environment {
  return {
    account: getAWSAccountId(),
    region: getAWSRegion(),
  };
}

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
export const stackProps: AwsAccountStackProps = {
  envName: getEnvName(),
  env: getAWSEnv(),
};
