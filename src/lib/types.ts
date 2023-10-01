import type {
  ResourceCreatedDeliveryPayload,
  ResourceDeletedDeliveryPayload,
  ResourceUpdatedDeliveryPayload,
} from "@commercetools/platform-sdk";
import * as cdk from "aws-cdk-lib";
import path from "path";

// Data Update Processor Types
export const resourceTypeAsArray = [
  "product",
  "inventory-entry",
  "standalone-price",
] as const;

export type ResourceType = (typeof resourceTypeAsArray)[number];

export type ChangeNotificationEvent =
  | ResourceCreatedDeliveryPayload
  | ResourceUpdatedDeliveryPayload
  | ResourceDeletedDeliveryPayload;

export const NOTIFICATION_TYPE_CREATED = "ResourceCreated";
export const NOTIFICATION_TYPE_UPDATED = "ResourceUpdated";
export const NOTIFICATION_TYPE_DELETED = "ResourceDeleted";

export type NotificationType =
  | typeof NOTIFICATION_TYPE_CREATED
  | typeof NOTIFICATION_TYPE_UPDATED
  | typeof NOTIFICATION_TYPE_DELETED;

export interface EventBridgeEvent {
  id: string;
  version: number;
  source: string;
  target: string;
  changeType: NotificationType;
  resourceType: ResourceType;
}

// CDK Types
export enum Environment {
  DEMO = "demo",
}

export interface AwsAccountStackProps extends cdk.StackProps {
  envName: Environment;
}

export const PROJECT_ROOT = path.join(__dirname, "../..");
