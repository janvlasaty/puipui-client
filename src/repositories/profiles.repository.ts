import { supabase } from '../lib/supabase'

export const getProfileByUserId = (userId: string) =>
  supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

export const getAllProfilesByUserId = (userId: string) =>
  supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)

export const getProfileById = (id: string) =>
  supabase
    .from('profiles')
    .select('id, name, avatar')
    .eq('id', id)
    .single()

export const createProfile = (userId: string, name: string, surname: string) =>
  supabase
    .from('profiles')
    .insert([{ user_id: userId, name, surname }])
    .select()
    .single()

export const updateProfile = (userId: string, name: string, surname: string) =>
  supabase
    .from('profiles')
    .update({ name, surname })
    .eq('user_id', userId)
