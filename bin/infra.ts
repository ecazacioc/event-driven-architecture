#!/usr/bin/env node
import "source-map-support/register";
import dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import { getAWSEnv, getEnvName, provideStacks } from "../src/cdk";
import { AwsAccountStackProps } from "../src/lib";

// Load environment variables from .env file
dotenv.config();

// Create CDK app
const app = new cdk.App();

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const stackProps: AwsAccountStackProps = {
  envName: getEnvName(),
  env: getAWSEnv(),
};

provideStacks(app, stackProps);
