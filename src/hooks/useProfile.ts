import { useState, createContext, useContext, ReactNode } from 'react'
import React from 'react'
import { Database } from '../types/database'
import {
  getProfileByUserId,
  getAllProfilesByUserId,
  createProfile as createProfileQuery,
} from '../repositories/profiles.repository'

export type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  error: string | null
  fetchProfile: (userId: string) => Promise<Profile | null>
  fetchAllProfiles: (userId: string) => Promise<Profile[] | null>
  selectProfile: (profileId: string) => void
  createProfile: (name: string, surname: string, userId: string) => Promise<Profile | null>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}

interface ProfileProviderProps {
  children: ReactNode
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getProfileByUserId(userId)

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setProfile(null)
          return null
        }
        throw fetchError
      }

      setProfile(data as Profile)
      return data as Profile
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile'
      setError(message)
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProfiles = async (userId: string): Promise<Profile[] | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getAllProfilesByUserId(userId)

      if (fetchError) throw fetchError

      return data as Profile[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profiles'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const selectProfile = (_profileId: string) => {
    // This should be called after the profile is already loaded
    // The profile context will already have the selected profile via fetchProfile
    // This is a placeholder for any additional logic needed on selection
  }

  const createProfile = async (
    name: string,
    surname: string,
    userId: string
  ): Promise<Profile | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await createProfileQuery(userId, name, surname)

      if (insertError) throw insertError

      setProfile(data as Profile)
      return data as Profile
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile'
      setError(message)
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    fetchProfile,
    fetchAllProfiles,
    selectProfile,
    createProfile,
  }

  return React.createElement(ProfileContext.Provider, { value }, children)
}
