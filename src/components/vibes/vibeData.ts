import { BookOpenIcon, FilmSlateIcon, TelevisionIcon, MaskHappyIcon, ColumnsIcon, GameControllerIcon } from '@phosphor-icons/react'
import type { VibeEntry } from './types'

export const CATEGORY_COLOR = new Map<React.ElementType, string>([
  [BookOpenIcon,       '#EAB308'],
  [FilmSlateIcon,      '#8B5CF6'],
  [TelevisionIcon,     '#3B82F6'],
  [MaskHappyIcon,      '#EF4444'],
  [ColumnsIcon,        '#10B981'],
  [GameControllerIcon, '#F97316'],
])

export const CATEGORIES = [
  { id: 'books',       label: 'Books',       Icon: BookOpenIcon,       color: '#EAB308' },
  { id: 'movies',      label: 'Movies',      Icon: FilmSlateIcon,      color: '#8B5CF6' },
  { id: 'tv',          label: 'TV Shows',    Icon: TelevisionIcon,     color: '#3B82F6' },
  { id: 'theatre',     label: 'Theatre',     Icon: MaskHappyIcon,      color: '#EF4444' },
  { id: 'exhibitions', label: 'Exhibitions', Icon: ColumnsIcon,        color: '#10B981' },
  { id: 'games',       label: 'Games',       Icon: GameControllerIcon, color: '#F97316' },
]

export const RECENT_VIBES: VibeEntry[] = [
  { id: 1, Icon: BookOpenIcon, title: 'The Brothers Karamazov', meta: 'Dostoevsky', reviews: [
    { emoji: '😭', user: 'Eva M.', note: 'Absolutely wrecked me. The Grand Inquisitor chapter hit different.' },
  ]},
  { id: 2, Icon: FilmSlateIcon, title: 'Anora', meta: 'Sean Baker', reviews: [
    { emoji: '🤩', user: 'Martin K.', note: 'Pure chaos energy. Yura Borisov is a total revelation.' },
    { emoji: '😍', user: 'Klara B.', note: 'Best film I have seen in years. Absolutely electric.' },
    { emoji: '🤔', user: 'Tomáš R.', note: 'Compelling but the third act lost me a bit.' },
  ]},
  { id: 3, Icon: TelevisionIcon, title: 'Severance S2', meta: 'Apple TV+', reviews: [
    { emoji: '😌', user: 'Klara B.', note: 'Finally got closure on the innie arc. Oddly peaceful after.' },
    { emoji: '🤯', user: 'Adéla N.', note: 'Every episode ends on a cliffhanger. My nerves are gone.' },
    { emoji: '😭', user: 'Eva M.', note: 'The Helly arc wrecked me completely.' },
    { emoji: '🔥', user: 'Martin K.', note: 'Peak television. Nothing comes close right now.' },
    { emoji: '🤩', user: 'Klara B.', note: 'Absolutely loved it. Every episode was a thrill.' },
    { emoji: '😤', user: 'Tomáš R.', note: 'Frustratingly good. Couldn’t stop watching.' },
    { emoji: '👏', user: 'Adéla N.', note: 'Brilliant performances all around. Truly captivating.' },
  ]},
  { id: 4, Icon: MaskHappyIcon, title: 'Waiting for Godot', meta: 'Beckett', reviews: [
    { emoji: '🥲', user: 'Tomáš R.', note: 'Laughed and cried at the same time. Minimal staging, devastating.' },
    { emoji: '🤯', user: 'Eva M.', note: 'Did not expect to feel this much about nothing happening.' },
  ]},
  { id: 5, Icon: ColumnsIcon, title: 'Miró at NGP', meta: 'National Gallery Prague', reviews: [
    { emoji: '✨', user: 'Adéla N.', note: 'So playful and free. I want to paint like a child again.' },
    { emoji: '😊', user: 'Klara B.', note: 'The colours are just joyful. Needed this.' },
    { emoji: '🤩', user: 'Martin K.', note: 'Incredible retrospective. Worth the queue.' },
  ]},
  { id: 6, Icon: GameControllerIcon, title: 'The Legend of Zelda: Breath of the Wild', meta: 'Nintendo', reviews: [
    { emoji: '🤯', user: 'Klara B.', note: 'An absolute masterpiece. The open world is breathtaking.' },
  ]},
  { id: 7, Icon: GameControllerIcon, title: 'Hades', meta: 'Supergiant Games', reviews: [
    { emoji: '😍', user: 'Me', note: 'The best roguelike I have ever played. The writing is phenomenal.' },
    { emoji: '🔥', user: 'Martin K.', note: 'Addictive gameplay and stunning art direction.' },
  ]},
]

export const MY_REVIEWS: VibeEntry[] = [
  { id: 1, Icon: BookOpenIcon, title: 'Crime and Punishment', meta: 'Dostoevsky', reviews: [
    { emoji: '🔥', user: 'Me', note: 'Reading this in winter was a mistake. Spiralled for a whole week.' },
  ]},
  { id: 2, Icon: FilmSlateIcon, title: 'Oppenheimer', meta: 'Christopher Nolan', reviews: [
    { emoji: '😤', user: 'Me', note: 'Important but left me angry at humanity. The Teller subplot deserved more.' },
  ]},
]
