import { PublisherAdapter } from './types';
import { MetaFacebookAdapter } from './meta-facebook';
import { MetaInstagramAdapter } from './meta-instagram';
import { GoogleBusinessProfileAdapter } from './google-business';

const adapters: Record<string, PublisherAdapter> = {
  facebook: new MetaFacebookAdapter(),
  instagram: new MetaInstagramAdapter(),
  google_business: new GoogleBusinessProfileAdapter(),
};

export function getPublisher(platform: string): PublisherAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported publishing platform: ${platform}`);
  }
  return adapter;
}
