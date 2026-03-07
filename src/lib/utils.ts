import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// PostgREST returns bytea columns as \xhexstring.
// Decode the hex back to the original data URL string.
export const decodeAvatar = (avatar: string | null | undefined): string | null => {
  if (!avatar) return null
  if (avatar.startsWith('data:') || avatar.startsWith('http')) return avatar
  // PostgREST bytea hex format: \xhexchars
  if (avatar.startsWith('\\x')) {
    try {
      const hex = avatar.slice(2)
      const bytes = new Uint8Array(hex.length / 2)
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
      }
      const decoded = new TextDecoder().decode(bytes)
      if (decoded.startsWith('data:') || decoded.startsWith('http')) return decoded
    } catch {}
    return null
  }
  // Fallback: try base64
  try {
    const decoded = atob(avatar.replace(/\s/g, ''))
    if (decoded.startsWith('data:') || decoded.startsWith('http')) return decoded
  } catch {}
  return null
}

// Encode a data URL as a PostgreSQL bytea hex literal (\xhexstring)
// for use with PostgREST INSERT/UPDATE on bytea columns.
export const encodeAvatarForStorage = (dataUrl: string): string => {
  const bytes = new TextEncoder().encode(dataUrl)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `\\x${hex}`
}
