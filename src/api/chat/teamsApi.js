import { supabase } from '../../utils/supabase';

/**
 * Create a new team.
 */
export async function createTeam({ name, ownerId }) {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name,
      owner_id: ownerId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch teams where user is a member.
 */
export async function fetchUserTeams(userId) {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name, owner_id, created_at)')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map(row => ({
    teamId: row.team_id,
    role: row.role,
    team: row.teams
  }));
}

/**
 * Add a member to a team (owner/admin only – enforce via RLS).
 */
export async function addTeamMember({ teamId, userId, role = 'member' }) {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a member from a team.
 */
export async function removeTeamMember({ teamId, userId }) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}