import type {
  ResourceCreatedDeliveryPayload,
  ResourceDeletedDeliveryPayload,
  ResourceUpdatedDeliveryPayload,
} from '@commercetools/platform-sdk';
import type * as cdk from 'aws-cdk-lib';
import path from 'path';

// Data Update Processor Types
export const resourceTypeAsArray = ['product', 'inventory-entry', 'standalone-price'] as const;

export type ResourceType = (typeof resourceTypeAsArray)[number];

export type ChangeNotificationEvent =
  | ResourceCreatedDeliveryPayload
  | ResourceUpdatedDeliveryPayload
  | ResourceDeletedDeliveryPayload;

export const NOTIFICATION_TYPE_CREATED = 'ResourceCreated';
export const NOTIFICATION_TYPE_UPDATED = 'ResourceUpdated';
export const NOTIFICATION_TYPE_DELETED = 'ResourceDeleted';

export type NotificationType =
  | typeof NOTIFICATION_TYPE_CREATED
  | typeof NOTIFICATION_TYPE_UPDATED
  | typeof NOTIFICATION_TYPE_DELETED;

export interface EnrichedNotificationEvent {
  id: string;
  version: number;
  source: string;
  target: string;
  changeType: NotificationType;
  resourceType: ResourceType;
  messageId?: string;
}

// CDK Types
export enum Environment {
  DEMO = 'demo',
}

export interface AwsAccountStackProps extends cdk.StackProps {
  envName: Environment;
}

export const PROJECT_ROOT = path.join(__dirname, '../..');

// Materialized View Types
export const EVENT_NAME_INSERT = 'INSERT';
export const EVENT_NAME_MODIFY = 'MODIFY';
export const EVENT_NAME_REMOVE = 'REMOVE';

export type StreamEventName = typeof EVENT_NAME_INSERT | typeof EVENT_NAME_MODIFY | typeof EVENT_NAME_REMOVE;

// Composed from ${target}-${resourceType}
export const streamResourceTypeAsArray = ['product'] as const;

export type StreamResourceType = (typeof streamResourceTypeAsArray)[number];

export interface MaterializedViewItem {
  id: string;
  version: number;
  changeDate: string;
  createdAt: string;
}

export interface ProductMaterializedViewItem extends MaterializedViewItem {
  name: string;
  description?: string;
  price: number;
}

export interface StreamNotificationEvent<T = unknown> {
  newRecord?: T;
  oldRecord?: T;
  resourceType: StreamResourceType;
  sequenceNumber: string;
  notificationType: NotificationType;
}

interface ItemIdentifier {
  itemIdentifier: string;
}

export interface BatchItemFailures {
  batchItemFailures: ItemIdentifier[];
}

// Results DB Types
export interface ResultsDBItem {
  targetIdentifier: string;
  targetName: string;
  targetDescription?: string;
  targetPrice: number;
}
