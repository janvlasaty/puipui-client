import { supabase } from '../lib/supabase'

export const getRoomsWithProfiles = () =>
  supabase
    .from('rooms')
    .select(`
      id,
      label,
      is_direct,
      rooms_users (
        user_id,
        profiles (
          name,
          avatar
        )
      )
    `)

export const getRoomUsers = (roomId: string) =>
  supabase
    .from('rooms_users')
    .select('user_id')
    .eq('room_id', roomId)

export const getRoomUsersWithProfiles = (roomId: string) =>
  supabase
    .from('rooms_users')
    .select(`
      user_id,
      profiles (
        name,
        avatar
      )
    `)
    .eq('room_id', roomId)
