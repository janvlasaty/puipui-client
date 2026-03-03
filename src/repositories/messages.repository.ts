import { supabase } from '../lib/supabase'

export const getLastMessagesByRoomIds = (roomIds: string[]) =>
  supabase
    .from('messages')
    .select('*')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

export const getMessagesByRoom = (roomId: string, topicId: string | null = null) => {
  const query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  const withTopic = topicId === null ? query.is('topic_id', null) : query.eq('topic_id', topicId)
  return withTopic.is('archived_at', null)
}

export const archiveMessage = (id: string) =>
  supabase
    .from('messages')
    .delete()
    .eq('id', id)

export const insertMessage = (roomId: string, userId: string, content: string) =>
  supabase
    .from('messages')
    .insert({ room_id: roomId, user_id: userId, content })
    .select()
