import { supabase } from '@/lib/supabase'
import type { Group, GroupMember, GroupType } from './types'

export async function fetchMyGroups(): Promise<Group[]> {
  // RLS ya filtra a "grupos de los que soy miembro", no hace falta un where extra.
  const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single()
  if (error) throw error
  return data
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (membersError) throw membersError
  if (members.length === 0) return []

  const userIds = members.map((m) => m.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', userIds)
  if (profilesError) throw profilesError

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  return members.map((m) => ({ ...m, profile: profileById.get(m.user_id) ?? null }))
}

export async function createGroup(name: string, type: GroupType): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', { p_name: name, p_type: type })
  if (error) throw error
  return data
}

export async function joinGroupByCode(inviteCode: string): Promise<Group> {
  const { data, error } = await supabase.rpc('join_group_by_code', { p_invite_code: inviteCode })
  if (error) throw error
  return data
}
