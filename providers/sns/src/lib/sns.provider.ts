import {
  ChannelTypeEnum,
  ISendMessageSuccessResponse,
  ISmsOptions,
  ISmsProvider,
  IPushOptions,
  IPushProvider,
} from '@novu/stateless';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

import { SNSConfig } from './sns.config';

export class SNSSmsProvider implements ISmsProvider {
  id = 'sns';
  channelType = ChannelTypeEnum.SMS as ChannelTypeEnum.SMS;
  private client: SNSClient;

  constructor(private readonly config: SNSConfig) {
    this.client = new SNSClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async sendMessage(
    options: ISmsOptions
  ): Promise<ISendMessageSuccessResponse> {
    const { to, content } = options;

    const publish = new PublishCommand({
      PhoneNumber: to,
      Message: content,
    });

    const snsResponse = await this.client.send(publish);

    return {
      id: snsResponse.MessageId,
      date: new Date().toISOString(),
    };
  }
}

export class SNSPushProvider implements IPushProvider {
  id = 'sns-push';
  channelType = ChannelTypeEnum.PUSH as ChannelTypeEnum.PUSH;
  private client: SNSClient;

  constructor(private readonly config: SNSConfig) {
    this.client = new SNSClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async sendMessage(
    options: IPushOptions
  ): Promise<ISendMessageSuccessResponse> {
    const publish = new PublishCommand({
      Message: options.content,
      TopicArn: options.target[0],
    });

    const snsResponse = await this.client.send(publish);

    return {
      id: snsResponse.MessageId,
      date: new Date().toISOString(),
    };
  }
}
