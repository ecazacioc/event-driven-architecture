#!/usr/bin/env node
import 'source-map-support/register';
import dotenv from 'dotenv';
import * as cdk from 'aws-cdk-lib';
import { stackProps } from '../src/cdk/stack-props';
import { provideStacks } from '../src/cdk';

// Load environment variables from .env file
dotenv.config();

// Create CDK app
const app = new cdk.App();

provideStacks(app, stackProps);
