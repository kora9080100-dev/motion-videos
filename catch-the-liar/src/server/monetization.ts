import type { RoomFeatures } from '../shared/types';
import type { AppConfig } from './config';
import type { RoomState } from './game/types';

/**
 * Single place that decides what a room gets. Today every room is free and ads are off
 * unless ADS_ENABLED=true. When Plus / no-ads / exclusive packs are introduced, look up
 * the `entitlements` table here (by room or device) and return the unlocked features —
 * the client and engine already read these flags.
 */
export function resolveFeatures(config: Pick<AppConfig, 'adsEnabled'>): (state: RoomState) => RoomFeatures {
  return () => ({ tier: 'free', adsEnabled: config.adsEnabled });
}
