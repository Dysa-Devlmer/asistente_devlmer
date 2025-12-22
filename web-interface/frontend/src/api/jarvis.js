import client from './client';

export const sendJarvisChat = (message) =>
  client.post('/jarvis/chat', { message });
