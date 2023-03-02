import { ChannelTypeEnum } from '@novu/shared';
import { SNSPushProvider } from '@novu/sns';
import { SNSConfig } from '@novu/sns/build/main/lib/sns.config';
import { BasePushHandler } from './base.handler';
import { ICredentials } from '@novu/dal';

export class SNSPushHandler extends BasePushHandler {
  constructor() {
    super('sns', ChannelTypeEnum.PUSH);
  }

  buildProvider(credentials: ICredentials) {
    const config: SNSConfig = {
      accessKeyId: credentials.apiKey || '',
      secretAccessKey: credentials.secretKey || '',
      region: credentials.region || '',
    };

    this.provider = new SNSPushProvider(config);
  }
}
