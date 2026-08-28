import { ClientSubscription } from './types';
import { SubscriptionService } from '../services/SubscriptionService';

/** @deprecated Use SubscriptionService directly. Kept only for compatibility. */
export async function getSubscriptions(): Promise<ClientSubscription[]> {
  return SubscriptionService.list();
}
export async function addSubscription(sub: ClientSubscription): Promise<ClientSubscription[]> {
  await SubscriptionService.create(sub);
  return SubscriptionService.list();
}
export async function updateSubscription(sub: ClientSubscription): Promise<ClientSubscription[]> {
  await SubscriptionService.update(sub.id, sub);
  return SubscriptionService.list();
}
