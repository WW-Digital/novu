import { apnsConfig, fcmConfig, expoConfig, snsConfig } from '../credentials';
import { PushProviderIdEnum } from '../provider.enum';
import { IProviderConfig } from '../provider.interface';

import { ChannelTypeEnum } from '../../../types';

export const pushProviders: IProviderConfig[] = [
  {
    id: PushProviderIdEnum.FCM,
    displayName: 'Firebase Cloud Messaging',
    channel: ChannelTypeEnum.PUSH,
    credentials: fcmConfig,
    docReference: 'https://docs.novu.co/channels/push/fcm',
    logoFileName: { light: 'fcm.svg', dark: 'fcm.svg' },
  },
  {
    id: PushProviderIdEnum.EXPO,
    displayName: 'Expo Push',
    channel: ChannelTypeEnum.PUSH,
    credentials: expoConfig,
    docReference: 'https://docs.expo.dev/push-notifications/overview/',
    logoFileName: { light: 'expo.svg', dark: 'expo.svg' },
  },
  {
    id: PushProviderIdEnum.APNS,
    displayName: 'APNs',
    channel: ChannelTypeEnum.PUSH,
    credentials: apnsConfig,
    docReference: 'https://docs.novu.co/channels/push/apns',
    logoFileName: { light: 'apns.png', dark: 'apns.png' },
    betaVersion: true,
  },
  {
    id: PushProviderIdEnum.SNS,
    displayName: 'SNS',
    channel: ChannelTypeEnum.PUSH,
    credentials: snsConfig,
    docReference: 'https://docs.aws.amazon.com/sns/index.html',
    logoFileName: { light: 'sns.svg', dark: 'sns.svg' },
  },
];
