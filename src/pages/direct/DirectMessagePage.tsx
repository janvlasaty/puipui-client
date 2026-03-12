import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ChatConversation } from '../../components/chat/ChatConversation'
import type { Enums } from '../../types/database'
import { useAuth } from '../../hooks/useAuth'
import { getMessagesByRoom, getMessagesAfter, insertMessage, archiveMessage } from '../../repositories/messages.repository'
import { getTopicsByRoom, createTopic } from '../../repositories/topics.repository'
import { getRoomUsersWithProfiles } from '../../repositories/rooms.repository'
import { decodeAvatar } from '../../lib/utils'

const PAGE_SIZE = 20

type DbMessage = {
  id: string
  user_id: string
  content: string
  created_at: string
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  avatar?: string
  createdAt?: Date
  isNew?: boolean
}

function formatMessages(
  msgs: DbMessage[],
  userId: string,
  friendName: string,
  friendAvatar: string,
  newIds?: Set<string>,
): Message[] {
  return msgs.map((msg, index) => {
    const isSender = msg.user_id === userId
    const createdAt = new Date(msg.created_at)

    let showTimestamp = true
    let showSenderName = true

    if (index < msgs.length - 1) {
      const nextMsg = msgs[index + 1]
      const timeDiffMinutes = (new Date(nextMsg.created_at).getTime() - createdAt.getTime()) / (1000 * 60)
      if (isSender === (nextMsg.user_id === userId) && timeDiffMinutes < 15) showTimestamp = false
    }

    if (index > 0) {
      const prevMsg = msgs[index - 1]
      const timeDiffMinutes = (createdAt.getTime() - new Date(prevMsg.created_at).getTime()) / (1000 * 60)
      if (isSender === (prevMsg.user_id === userId) && timeDiffMinutes < 15) showSenderName = false
    }

    return {
      id: msg.id,
      text: msg.content,
      sender: isSender ? 'user' : 'other',
      timestamp: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      showTimestamp,
      showSenderName,
      senderName: isSender ? undefined : friendName,
      avatar: isSender ? undefined : friendAvatar,
      createdAt,
      isNew: newIds?.has(msg.id) ?? false,
    }
  })
}

interface DirectMessagePageProps {
  roomId: string
  onBack: () => void
}

type Topic = { id: string; label: string }

export const DirectMessagePage: React.FC<DirectMessagePageProps> = ({ roomId, onBack }) => {
  const { session } = useAuth()
  const [rawMessages, setRawMessages] = useState<DbMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [friendName, setFriendName] = useState('')
  const [friendAvatar, setFriendAvatar] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(() => {
    return sessionStorage.getItem(`puipui_topic_${roomId}`) ?? null
  })
  const loadingMoreRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const rawMessagesRef = useRef<DbMessage[]>([])
  rawMessagesRef.current = rawMessages
  const newMessageIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const loadFriendData = async () => {
      if (!session?.user?.id) return
      const { data: roomUsers, error } = await getRoomUsersWithProfiles(roomId)
      if (error) return
      const otherUser = (roomUsers || []).find((ru) => ru.user_id !== session.user.id)
      setFriendName(otherUser?.profiles?.name || 'Unknown')
      setFriendAvatar(decodeAvatar(otherUser?.profiles?.avatar) || '')
    }
    loadFriendData()
  }, [roomId, session?.user?.id])

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await getTopicsByRoom(roomId)
      if (data) setTopics(data)
    }
    fetchTopics()
  }, [roomId])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId || !session?.user?.id) return
      if (isInitialLoadRef.current) setLoading(true)
      try {
        const { data, error } = await getMessagesByRoom(roomId, selectedTopicId, PAGE_SIZE)
        if (error) throw error
        const msgs = [...(data ?? [])].reverse() // DESC → ASC
        setRawMessages(msgs as DbMessage[])
        setHasMore((data?.length ?? 0) >= PAGE_SIZE)
      } catch (err) {
        console.error('Error fetching messages:', err)
      } finally {
        setLoading(false)
        isInitialLoadRef.current = false
      }
    }
    fetchMessages()
  }, [roomId, session?.user?.id, selectedTopicId])

  const POLL_INTERVAL = 5_000

  useEffect(() => {
    if (!roomId || !session?.user?.id) return
    const poll = async () => {
      const msgs = rawMessagesRef.current
      if (msgs.length === 0) return
      const latest = msgs[msgs.length - 1].created_at
      const { data } = await getMessagesAfter(roomId, selectedTopicId, latest)
      if (data && data.length > 0) {
        setRawMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const incoming = (data as DbMessage[]).filter((m) => !existingIds.has(m.id))
          if (incoming.length === 0) return prev
          incoming.forEach((m) => newMessageIdsRef.current.add(m.id))
          return [...prev, ...incoming]
        })
      }
    }
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [roomId, session?.user?.id, selectedTopicId])

  const conversationMessages = useMemo(
    () => formatMessages(rawMessages, session?.user?.id ?? '', friendName, friendAvatar, newMessageIdsRef.current),
    [rawMessages, session?.user?.id, friendName, friendAvatar],
  )

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || rawMessages.length === 0) return
    loadingMoreRef.current = true
    setIsLoadingMore(true)
    try {
      const oldest = rawMessages[0].created_at
      const { data, error } = await getMessagesByRoom(roomId, selectedTopicId, PAGE_SIZE, oldest)
      if (error) throw error
      const older = [...(data ?? [])].reverse() // DESC → ASC
      setRawMessages((prev) => [...(older as DbMessage[]), ...prev])
      setHasMore((data?.length ?? 0) >= PAGE_SIZE)
    } catch (err) {
      console.error('Error loading more messages:', err)
    } finally {
      loadingMoreRef.current = false
      setIsLoadingMore(false)
    }
  }, [roomId, hasMore, rawMessages, selectedTopicId])

  const handleSendMessage = async (message: string, type?: Enums<'type_message_type'>) => {
    if (!session?.user?.id) return
    try {
      const { data, error } = await insertMessage(roomId, session.user.id, message, type, selectedTopicId)
      if (error) throw error
      if (data?.[0]) {
        newMessageIdsRef.current.add(data[0].id)
        setRawMessages((prev) => [...prev, data[0] as DbMessage])
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const handleAddTopic = async (label: string) => {
    const { data } = await createTopic(roomId, label)
    if (data) setTopics((prev) => [...prev, data])
  }

  const handleDeleteMessage = async (id: string) => {
    setRawMessages((prev) => prev.filter((m) => m.id !== id))
    await archiveMessage(id)
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <div className="fixed top-0 left-0 right-0 z-10 px-4 py-4">
          <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-muted animate-pulse flex-shrink-0" />
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pt-16">
          <div className="max-w-2xl mx-auto w-full py-6 px-4 space-y-3">
            {([
              { sender: 'other', width: 'w-48' },
              { sender: 'other', width: 'w-36' },
              { sender: 'user',  width: 'w-52' },
              { sender: 'user',  width: 'w-28' },
              { sender: 'other', width: 'w-44' },
              { sender: 'user',  width: 'w-40' },
            ] as const).map((item, i) => (
              <div key={i} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-9 rounded-2xl bg-muted animate-pulse ${item.width}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          <div className="max-w-2xl mx-auto w-full px-4 py-4 flex gap-2">
            <div className="flex-1 h-10 rounded-full bg-muted animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ChatConversation
      roomId={roomId}
      friendName={friendName}
      friendAvatar={friendAvatar}
      messages={conversationMessages}
      onBack={onBack}
      onSendMessage={handleSendMessage}
      onDeleteMessage={handleDeleteMessage}
      onLoadMore={loadMoreMessages}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      topics={topics}
      selectedTopicId={selectedTopicId}
      onTopicSelect={(id) => {
        setSelectedTopicId(id)
        if (id) sessionStorage.setItem(`puipui_topic_${roomId}`, id)
        else sessionStorage.removeItem(`puipui_topic_${roomId}`)
      }}
      onAddTopic={handleAddTopic}
    />
  )
}

import * as React from 'react'
