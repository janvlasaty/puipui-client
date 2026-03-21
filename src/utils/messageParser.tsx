import React from 'react'
import { MapPinIcon, ChartBarHorizontalIcon, CoinsIcon, LinkIcon, ImageIcon } from '@phosphor-icons/react'
import type { Enums } from '../types/database'

const CURRENCY_SUFFIX = new Set(['CZK', 'PLN', 'HUF'])
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', CZK: 'Kč', PLN: 'zł',
  HUF: 'Ft', CHF: 'Fr', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  CAD: 'CA$', AUD: 'A$', JPY: '¥', CNY: '¥', BRL: 'R$',
}

function PreviewRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <>
      {icon}
      <span className="truncate">{text}</span>
    </>
  )
}

const iconCls = 'text-primary flex-shrink-0'

export function formatMessagePreview(content: string, type: Enums<'type_message_type'>): React.ReactNode {
  switch (type) {
    case 'location':
      return <PreviewRow icon={<MapPinIcon size={13} className={iconCls} />} text="Location" />
    case 'image':
      return <PreviewRow icon={<ImageIcon size={13} className={iconCls} />} text="Image" />
    case 'link':
      return <PreviewRow icon={<LinkIcon size={13} className={iconCls} />} text={content} />
    case 'poll': {
      let question = 'Poll'
      try { question = JSON.parse(content).question } catch { /* ignore */ }
      return <PreviewRow icon={<ChartBarHorizontalIcon size={13} className={iconCls} />} text={question} />
    }
    case 'expense': {
      let label = 'Expense'
      try {
        const { description, amount, currency } = JSON.parse(content)
        const sym = CURRENCY_SYMBOL[currency]
        const formatted = amount % 1 === 0 ? Number(amount).toFixed(0) : Number(amount).toFixed(2)
        const amountStr = CURRENCY_SUFFIX.has(currency)
          ? `${formatted} ${sym}`
          : sym ? `${sym}${formatted}` : `${formatted} ${currency}`
        label = `${description} · ${amountStr}`
      } catch { /* ignore */ }
      return <PreviewRow icon={<CoinsIcon size={13} className={iconCls} />} text={label} />
    }
    default:
      return <span className="truncate">{content}</span>
  }
}

// Matches (in priority order):
//   1. https?://... full URLs
//   2. www.something.tld (with optional path/query/hash)
//   3. bare domain.tld — limited to a broad but finite TLD set to avoid false positives
//      (e.g. "1.5" or "v2.0" won't match)
const LINK_RE =
  /\b(https?:\/\/[^\s<>"'()\[\]]+|www\.[a-z0-9-]+\.[a-z]{2,}[^\s<>"'()\[\]]*|[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|dev|app|co|me|ai|xyz|tech|edu|gov|biz|info|tv|fm|gg|sh|gl|ly|to|be|is|so|pm|ru|de|fr|it|es|nl|jp|cn|br|au|ca|in|uk|us|eu|ch|se|no|dk|fi|pl|cz|sk|hu|ro|bg|hr|si|ee|lv|lt|pt|gr|tr|il|za|ng|ke|eg|mx|ar|cl|pe|co|ve|ua|by|kz|ge|am|az|uz|mn|th|vn|id|ph|sg|my|nz|hk|tw)(?:\/[^\s<>"'()\[\]]*)?)\b/gi

// Strip trailing sentence punctuation that was captured but isn't part of the URL
function cleanUrl(raw: string): string {
  return raw.replace(/[.,;:!?]+$/, '')
}

function toHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export function parseMessageLinks(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  LINK_RE.lastIndex = 0

  while ((match = LINK_RE.exec(text)) !== null) {
    const raw = cleanUrl(match[1])
    const start = match.index

    if (start > lastIndex) nodes.push(text.slice(lastIndex, start))

    nodes.push(
      <a
        key={start}
        href={toHref(raw)}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 break-all hover:opacity-80"
        onClick={(e) => e.stopPropagation()}
      >
        {raw}
      </a>
    )

    lastIndex = start + match[1].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return nodes.length > 0 ? nodes : [text]
}
