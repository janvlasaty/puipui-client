import { CoffeeIcon, ForkKnifeIcon, PintGlassIcon, BreadIcon, BedIcon, StarIcon } from '@phosphor-icons/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Database } from '../../types/database'

export type PoiCategory = Database['public']['Enums']['type_poi_category']

export enum EnumMapCategory {
  Coffee = 'Coffee',
  Food = 'Food',
  Drink = 'Drink',
  Bakery = 'Bakery',
  Stay = 'Stay',
  Gem = 'Gem',
}

export const MAP_CATEGORIES = [
  { id: EnumMapCategory.Coffee as PoiCategory, label: 'Coffee',  Icon: CoffeeIcon,    color: '#A16207' },
  { id: EnumMapCategory.Food   as PoiCategory, label: 'Food',    Icon: ForkKnifeIcon, color: '#8B5CF6' },
  { id: EnumMapCategory.Drink  as PoiCategory, label: 'Drink',   Icon: PintGlassIcon, color: '#EF4444' },
  { id: EnumMapCategory.Bakery as PoiCategory, label: 'Bakery',  Icon: BreadIcon,     color: '#F97316' },
  { id: EnumMapCategory.Stay   as PoiCategory, label: 'Stay',    Icon: BedIcon,       color: '#3B82F6' },
  { id: EnumMapCategory.Gem    as PoiCategory, label: 'Gem',     Icon: StarIcon,      color: '#10B981' },
]

export type MapCategory = typeof MAP_CATEGORIES[number]

export function makeCategoryMarkerSvg(cat: MapCategory): string {
  // Render Phosphor icon to SVG string and extract inner paths
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconMarkup = renderToStaticMarkup(createElement(cat.Icon as any, { size: 256, weight: 'fill', color: cat.color }))
  const innerMatch = iconMarkup.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
  const iconInner = innerMatch ? innerMatch[1] : ''

  // Scale 256×256 icon to 16px, centered in the pin bulb at (14, 13)
  const iconPx = 16
  const scale = iconPx / 256
  const tx = 14 - iconPx / 2
  const ty = 13 - iconPx / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="72" viewBox="0 0 28 36">
    <defs>
      <filter id="ds" x="-60%" y="-50%" width="220%" height="220%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.22)"/>
      </filter>
    </defs>
    <path d="M14 1C7.373 1 2 6.373 2 13c0 8.5 12 22 12 22S26 21.5 26 13C26 6.373 20.627 1 14 1z"
          fill="${cat.color}" filter="url(#ds)"/>
    <g transform="translate(${tx}, ${ty}) scale(${scale})" fill="white">
      ${iconInner}
    </g>
  </svg>`
}
