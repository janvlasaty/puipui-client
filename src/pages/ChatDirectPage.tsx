import { useState } from 'react'
import { ChatConversation } from '../components/ChatConversation'

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: string
  senderName?: string
  avatar?: string
}

interface ChatDirectPageProps {
  friendName: string
  friendAvatar: string
  onBack: () => void
}

export const ChatDirectPage: React.FC<ChatDirectPageProps> = ({
  friendName,
  friendAvatar,
  onBack,
}) => {
  const [conversationMessages, setConversationMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! How are you doing?',
      sender: 'other',
      timestamp: '10:30 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '2',
      text: 'I\'m doing great! Just working on some new features 😊',
      sender: 'user',
      timestamp: '10:31 AM',
    },
    {
      id: '3',
      text: 'That sounds awesome! What kind of features?',
      sender: 'other',
      timestamp: '10:32 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '4',
      text: 'Building a real-time chat system with profile integration',
      sender: 'user',
      timestamp: '10:33 AM',
    },
    {
      id: '5',
      text: 'That\'s really cool! I\'d love to hear more about it',
      sender: 'other',
      timestamp: '10:34 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '6',
      text: 'Sure! We can chat about it later today',
      sender: 'user',
      timestamp: '10:35 AM',
    },
    {
      id: '7',
      text: 'Sounds perfect! I have some ideas too',
      sender: 'other',
      timestamp: '10:36 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '8',
      text: 'Let me know what they are! I\'m always open to suggestions',
      sender: 'user',
      timestamp: '10:37 AM',
    },
    {
      id: '9',
      text: 'Well, I think we could add more interactive features',
      sender: 'other',
      timestamp: '10:38 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '10',
      text: 'Like what exactly?',
      sender: 'user',
      timestamp: '10:39 AM',
    },
    {
      id: '11',
      text: 'Maybe voice messages, file sharing, and reactions to messages',
      sender: 'other',
      timestamp: '10:40 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '12',
      text: 'Those are great ideas! Voice messages would be especially useful',
      sender: 'user',
      timestamp: '10:41 AM',
    },
    {
      id: '13',
      text: 'Right? And reactions would make conversations more fun',
      sender: 'other',
      timestamp: '10:42 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '14',
      text: 'Absolutely! Let me add these to the roadmap',
      sender: 'user',
      timestamp: '10:43 AM',
    },
    {
      id: '15',
      text: 'Great! How long do you think it will take?',
      sender: 'other',
      timestamp: '10:44 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '16',
      text: 'Probably 2-3 weeks for the basic implementation',
      sender: 'user',
      timestamp: '10:45 AM',
    },
    {
      id: '17',
      text: 'That\'s awesome! Looking forward to it',
      sender: 'other',
      timestamp: '10:46 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '18',
      text: 'By the way, how\'s your project coming along?',
      sender: 'user',
      timestamp: '10:47 AM',
    },
    {
      id: '19',
      text: 'It\'s progressing well! We just finished the design phase',
      sender: 'other',
      timestamp: '10:48 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '20',
      text: 'That\'s great! When can I see the designs?',
      sender: 'user',
      timestamp: '10:49 AM',
    },
    {
      id: '21',
      text: 'I\'ll send them over tomorrow. Need to finalize a few things',
      sender: 'other',
      timestamp: '10:50 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '22',
      text: 'Perfect! Looking forward to seeing them',
      sender: 'user',
      timestamp: '10:51 AM',
    },
    {
      id: '23',
      text: 'Thanks! I\'m really excited about this project',
      sender: 'other',
      timestamp: '10:52 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '24',
      text: 'It sounds like it\'s going to be amazing! Keep me posted',
      sender: 'user',
      timestamp: '10:53 AM',
    },
    {
      id: '25',
      text: 'Will do! Let\'s catch up later this week',
      sender: 'other',
      timestamp: '10:54 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
    {
      id: '26',
      text: 'Sounds good! How about Friday?',
      sender: 'user',
      timestamp: '10:55 AM',
    },
    {
      id: '27',
      text: 'Friday works perfectly for me!',
      sender: 'other',
      timestamp: '10:56 AM',
      senderName: friendName,
      avatar: friendAvatar,
    },
  ])

  const handleSendMessage = (message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setConversationMessages([...conversationMessages, newMessage])
  }

  return (
    <ChatConversation
      friendName={friendName}
      friendAvatar={friendAvatar}
      messages={conversationMessages}
      onBack={onBack}
      onSendMessage={handleSendMessage}
    />
  )
}
