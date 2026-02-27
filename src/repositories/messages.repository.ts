import { supabase } from '../lib/supabase'

export const getLastMessagesByRoomIds = (roomIds: string[]) =>
  supabase
    .from('messages')
    .select('*')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

export const getMessagesByRoom = (roomId: string) =>
  supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

export const insertMessage = (roomId: string, userId: string, content: string) =>
  supabase
    .from('messages')
    .insert({ room_id: roomId, user_id: userId, content })
    .select()
