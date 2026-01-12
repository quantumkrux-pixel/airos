import { supabase } from '../../utils/supabase';

/**
 * Join a presence channel for chat (global or per-team).
 * presenceId can be 'global', a team id, or a channel id.
 */
export function joinPresenceChannel(presenceId, userState) {
  const channel = supabase.channel(`presence-${presenceId}`, {
    config: {
      presence: {
        key: userState.userId
      }
    }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      // You can inspect channel.presenceState() here in the caller.
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userState);
      }
    });

  return channel;
}

/**
 * Update presence state (e.g., typing, active window).
 */
export async function updatePresence(channel, userState) {
  try {
    await channel.track(userState);
  } catch (e) {
    console.error('Presence update failed:', e);
  }
}

/**
 * Helper to read presence state from a channel.
 */
export function getPresenceState(channel) {
  return channel.presenceState ? channel.presenceState() : {};
}