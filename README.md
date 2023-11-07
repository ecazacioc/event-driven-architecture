# Welcome to E-commerce Event Driver Architecture in AWS Repo

This repository hosts example of event driven architecture in AWS using SQS, EventBridge, Lambda, DynamoDB and AWS CDK. As an E-Commerce platform we are using commercetools

## Project Structure

```text
.
└── src
    └── cdk // contains Infrastructure as Code (IaC) resources using AWS CDK. Typescript is being used as language of choice for CDK constructs and stacks.
    └── lambdas
        └── data-update-processor // process updates received from commercetools, validates and sends events to AWS EventBridge
        └── materialized-view-builder // receives EventBridge events, process it and fetch all needed information and builds Materialized View Item in AWS DynamoDB
        └── results-processor // receives DynamoDB Stream event, process it and saves results in other DynamoDB table
    └── lib // contains helper functions for lambdas
└── esbuild.js // contains customization of build script to bundle lambda code
```

## Prerequisites

- NodeJS version: 18.16.1, You could use [NVM](https://github.com/nvm-sh/nvm) to manage multiple versions locally

Please make sure you familiarize yourself with Typescript v5.2.2 as it is being used in this project.

## Install dependencies

From your project's root run

```bash
npm run install
```

## Building code

Running `build` script from project's root will build code for all the packages

```bash
npm run build
```

## Packaging Lambdas

`.esbuild.js` contains a lambda build script. It accepts entry-point files and bundle them with pre-defined build options

All options conform with the ESBuild Javascript API - [documentation can be found here](https://esbuild.github.io/api/)

## CDK

The AWS Cloud Development Kit (AWS CDK) lets you define your cloud infrastructure as code in one of its supported programming languages.

In order to run AWS CDK, the CDK CLI has to be installed on your local. Please familiarize with [Getting Started with AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

After the installation of AWS CDK and configuration of AWS Credentials on your local, your stacks must be created into src/cdk folder. Then you need to create `.env` file with mandatory environment variables, see `.env.example` for more details.

Finally it is time to run your stacks. These CDK CLI commands are useful for your work:

- `npm run cdk list` Lists all available stacks in your application.
- `npm run cdk diff "*"` Shows diffs for each stack. (If you change "\*" to stack name, you can run just one stack.)
- `npm run cdk deploy "*"` Deploys changes to the your AWS account for each stack. (If you change "\*" to stack name, you can run just one stack.)
