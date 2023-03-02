import { SNSClient } from '@aws-sdk/client-sns';

import { SNSSmsProvider, SNSPushProvider } from './sns.provider';

test('should trigger sns sms library correctly', async () => {
  const mockResponse = { MessageId: 'mock-message-id' };
  const spy = jest
    .spyOn(SNSClient.prototype, 'send')
    .mockImplementation(async () => mockResponse);

  const mockConfig = {
    accessKeyId: 'TEST',
    secretAccessKey: 'TEST',
    region: 'test-1',
  };
  const provider = new SNSSmsProvider(mockConfig);

  const mockNovuMessage = {
    to: '0123456789',
    content: 'hello',
  };
  const response = await provider.sendMessage(mockNovuMessage);

  const publishInput = {
    input: {
      PhoneNumber: mockNovuMessage.to,
      Message: mockNovuMessage.content,
    },
  };

  expect(spy).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith(expect.objectContaining(publishInput));
  expect(response.id).toBe(mockResponse.MessageId);
});

test('should trigger sns push library correctly', async () => {
  const mockResponse = { MessageId: 'mock-message-id' };
  const spy = jest
    .spyOn(SNSClient.prototype, 'send')
    .mockImplementation(async () => mockResponse);

  const mockConfig = {
    accessKeyId: 'TEST',
    secretAccessKey: 'TEST',
    region: 'test-1',
  };
  const provider = new SNSPushProvider(mockConfig);

  const mockNovuMessage = {
    title: 'title',
    target: ['topicArn'],
    payload: { stuff: 'payload data' },
    content: 'hello',
  };
  const response = await provider.sendMessage(mockNovuMessage);

  const publishInput = {
    input: {
      TopicArn: mockNovuMessage.target[0],
      Message: mockNovuMessage.content,
    },
  };

  expect(spy).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith(expect.objectContaining(publishInput));
  expect(response.id).toBe(mockResponse.MessageId);
});
