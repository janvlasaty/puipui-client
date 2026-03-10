import { supabase } from '../lib/supabase'

export const getTopicsByRoom = (roomId: string) =>
  supabase
    .from('topics')
    .select('id, label, created_at')
    .eq('room_id', roomId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

export const createTopic = (roomId: string, label: string) =>
  supabase
    .from('topics')
    .insert({ room_id: roomId, label })
    .select('id, label, created_at')
    .single()
