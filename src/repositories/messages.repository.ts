import { supabase } from '../lib/supabase'
import type { Enums } from '../types/database'

export const getLastMessagesByRoomIds = (roomIds: string[]) =>
  supabase
    .from('messages')
    .select('*')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

export const getMessagesByRoom = (
  roomId: string,
  topicId: string | null = null,
  limit?: number,
  before?: string,
) => {
  const query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false }) // DESC — callers reverse for display

  const withTopic = topicId === null ? query.is('topic_id', null) : query.eq('topic_id', topicId)
  const withArchived = withTopic.is('archived_at', null)
  const withBefore = before !== undefined ? withArchived.lt('created_at', before) : withArchived
  return limit !== undefined ? withBefore.limit(limit) : withBefore
}

export const getMessagesAfter = (
  roomId: string,
  topicId: string | null = null,
  after: string,
) => {
  const query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .gt('created_at', after)
    .order('created_at', { ascending: true })

  const withTopic = topicId === null ? query.is('topic_id', null) : query.eq('topic_id', topicId)
  return withTopic.is('archived_at', null)
}

export const archiveMessage = (id: string) =>
  supabase
    .from('messages')
    .delete()
    .eq('id', id)

export const insertMessage = (
  roomId: string,
  userId: string,
  content: string,
  type?: Enums<'type_message_type'>,
  topicId?: string | null,
) =>
  supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      content,
      ...(type ? { type } : {}),
      ...(topicId !== undefined ? { topic_id: topicId } : {}),
    })
    .select()
