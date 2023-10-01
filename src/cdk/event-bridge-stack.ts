import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { AwsAccountStackProps } from '../lib/types';

export type EventBridgeStackProps = AwsAccountStackProps;

export class EventBridgeStack extends cdk.Stack {
  public eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
    super(scope, id, props);

    // event bus to send notification events through
    this.eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `event-bus-${props.envName}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'Event bus to send change notification events to integrate with third party systems',
    });
  }
}
