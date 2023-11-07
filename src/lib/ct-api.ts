import { ClientBuilder } from '@commercetools/sdk-client-v2';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import fetch from 'node-fetch';
import { strict as assert } from 'assert';

assert(process.env.CTP_PROJECT_KEY, 'CTP_PROJECT_KEY must be provided');
assert(process.env.CTP_CLIENT_ID, 'CTP_CLIENT_ID must be provided');
assert(process.env.CTP_CLIENT_SECRET, 'CTP_CLIENT_SECRET must be provided');

const projectKey = process.env.CTP_PROJECT_KEY;

const authMiddlewareOptions = {
  host: 'https://auth.europe-west1.gcp.commercetools.com',
  projectKey,
  credentials: {
    clientId: <string>process.env.CTP_CLIENT_ID,
    clientSecret: process.env.CTP_CLIENT_SECRET,
  },
  oauthUri: '/oauth/token', // - optional: custom oauthUri
  scopes: [`manage_project:${projectKey}`],
  fetch,
};

const httpMiddlewareOptions = {
  host: 'https://api.europe-west1.gcp.commercetools.com',
  fetch,
};

const client = new ClientBuilder()
  .withProjectKey(projectKey)
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withUserAgentMiddleware()
  .build();

export const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({
  projectKey,
});
