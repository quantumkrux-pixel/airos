import { supabase } from '../../utils/supabase';

export async function fetchChannelMessages(channelType, channelId, limit = 200) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_type', channelType)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}


export async function fetchFriends(userId) {
  const { data, error } = await supabase
    .from('friends')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
  return data;
}
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
export async function getOrCreateDmChannel(userA, userB) {
  const [minId, maxId] = [userA, userB].sort();

  const { data: existing, error: existingError } = await supabase
    .from('dm_channels')
    .select('*')
    .or(`and(user_a.eq.${minId},user_b.eq.${maxId}),and(user_a.eq.${maxId},user_b.eq.${minId})`)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('dm_channels')
    .insert({
      user_a: minId,
      user_b: maxId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function sendMessage({ senderId, channelType, channelId, content }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      channel_type: channelType,
      channel_id: channelId,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
export function subscribeToChannelMessages(channelType, channelId, onMessage) {
  const channel = supabase
    .channel(`messages-${channelType}-${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_type=eq.${channelType},channel_id=eq.${channelId}`
      },
      payload => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}