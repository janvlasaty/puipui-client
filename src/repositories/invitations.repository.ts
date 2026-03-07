import { supabase } from '../lib/supabase'

export const deleteExpiredInvitations = (userId: string) =>
  supabase
    .from('invitations')
    .delete()
    .eq('user_id', userId)
    .lt('expire_at', new Date().toISOString())

export const getMyActiveInvitation = (userId: string) =>
  supabase
    .from('invitations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

const checkCodeExists = (code: string) =>
  supabase
    .from('invitations')
    .select('id')
    .eq('code', code)
    .maybeSingle()

const createInvitation = (userId: string, code: string) => {
  const expireAt = new Date()
  expireAt.setMinutes(expireAt.getMinutes() + 15)
  return supabase
    .from('invitations')
    .insert({ user_id: userId, code, expire_at: expireAt.toISOString() })
    .select()
    .single()
}

export const generateUniqueCode = async (userId: string): Promise<{ code: string; expire_at: string } | null> => {
  for (let i = 0; i < 10; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const { data: existing } = await checkCodeExists(code)
    if (!existing) {
      const { data: inv } = await createInvitation(userId, code)
      if (inv) return { code: inv.code, expire_at: inv.expire_at }
    }
  }
  return null
}

export const deleteInvitationByCode = (code: string) =>
  supabase
    .from('invitations')
    .delete()
    .eq('code', code)

export const getInvitationByCode = (code: string) =>
  supabase.rpc('fn_accept_invitation', { p_code: code })
