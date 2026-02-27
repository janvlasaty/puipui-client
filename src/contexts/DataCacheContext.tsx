import React, { createContext, useContext, useState, useCallback } from 'react'

interface CacheEntry<T> {
  data: T | null
  loading: boolean
  error: Error | null
  lastFetched: number | null
}

interface DataCacheContextType {
  // Rooms cache
  roomsCache: CacheEntry<any[]>
  setRoomsCache: (data: any[], error?: Error | null) => void
  setRoomsLoading: (loading: boolean) => void
  
  // POIs cache
  poisCache: CacheEntry<any[]>
  setPoisCache: (data: any[], error?: Error | null) => void
  setPoisLoading: (loading: boolean) => void
  
  // Utility functions
  isCacheStale: (lastFetched: number | null, maxAge?: number) => boolean
  clearCache: (cacheKey: string) => void
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

const CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

export const DataCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomsCache, setRoomsCacheState] = useState<CacheEntry<any[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  })

  const [poisCache, setPoisCacheState] = useState<CacheEntry<any[]>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  })

  const setRoomsCache = useCallback((data: any[], error: Error | null = null) => {
    setRoomsCacheState((prev) => ({
      ...prev,
      data,
      error,
      lastFetched: Date.now(),
      loading: false,
    }))
  }, [])

  const setRoomsLoading = useCallback((loading: boolean) => {
    setRoomsCacheState((prev) => ({
      ...prev,
      loading,
    }))
  }, [])

  const setPoisCache = useCallback((data: any[], error: Error | null = null) => {
    setPoisCacheState((prev) => ({
      ...prev,
      data,
      error,
      lastFetched: Date.now(),
      loading: false,
    }))
  }, [])

  const setPoisLoading = useCallback((loading: boolean) => {
    setPoisCacheState((prev) => ({
      ...prev,
      loading,
    }))
  }, [])

  const isCacheStale = useCallback((lastFetched: number | null, maxAge = CACHE_MAX_AGE) => {
    if (!lastFetched) return true
    return Date.now() - lastFetched > maxAge
  }, [])

  const clearCache = useCallback((cacheKey: string) => {
    if (cacheKey === 'rooms') {
      setRoomsCacheState({
        data: null,
        loading: false,
        error: null,
        lastFetched: null,
      })
    } else if (cacheKey === 'pois') {
      setPoisCacheState({
        data: null,
        loading: false,
        error: null,
        lastFetched: null,
      })
    }
  }, [])

  return (
    <DataCacheContext.Provider
      value={{
        roomsCache,
        setRoomsCache,
        setRoomsLoading,
        poisCache,
        setPoisCache,
        setPoisLoading,
        isCacheStale,
        clearCache,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  )
}

export const useDataCache = () => {
  const context = useContext(DataCacheContext)
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider')
  }
  return context
}
