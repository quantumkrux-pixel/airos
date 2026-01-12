import { supabase } from '../../utils/supabase';

/**
 * Fetch all friend relationships for a user.
 */
export async function fetchFriends(userId) {
  const { data, error } = await supabase
    .from('friends')
    .select('id, requester_id, addressee_id, status, created_at')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
  return data || [];
}

/**
 * Send a friend request from currentUserId to targetUserId.
 */
export async function sendFriendRequest(currentUserId, targetUserId) {
  const { data, error } = await supabase
    .from('friends')
    .insert({
      requester_id: currentUserId,
      addressee_id: targetUserId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Accept a friend request (only addressee can accept).
 */
export async function acceptFriendRequest(friendRowId, currentUserId) {
  const { data, error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', friendRowId)
    .eq('addressee_id', currentUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject / remove friend relationship (either side).
 */
export async function removeFriend(friendRowId, currentUserId) {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', friendRowId)
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

  if (error) throw error;
  return true;
}

/**
 * Get or create a DM channel between two users.
 * This assumes dm_channels(user_a, user_b, id) exists.
 */
export async function getOrCreateDmChannel(userA, userB) {
  const [minId, maxId] = [userA, userB].sort();

  const { data: existing, error: existingError } = await supabase
    .from('dm_channels')
    .select('*')
    .or(
      `and(user_a.eq.${minId},user_b.eq.${maxId}),and(user_a.eq.${maxId},user_b.eq.${minId})`
    )
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('dm_channels')
    .insert({ user_a: minId, user_b: maxId })
    .select()
    .single();

  if (error) throw error;
  return data;
}