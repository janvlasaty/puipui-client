import { useState } from 'react'
import { useNavigate, useNavigationType } from 'react-router-dom'
import {
  UserIcon, ArrowClockwiseIcon, SunIcon, MoonIcon, MonitorIcon,
  PencilSimpleIcon, UserPlusIcon, CaretRightIcon, TranslateIcon,
} from '@phosphor-icons/react'
import { PageHeader } from '../components/PageHeader'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { decodeAvatar } from '../lib/utils'
import { EditProfileSheet } from '../components/settings/EditProfileSheet'
import { InviteCodeSheet } from '../components/settings/InviteCodeSheet'
import { AcceptCodeSheet } from '../components/settings/AcceptCodeSheet'

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

export const SettingsPage = () => {
  const navigate = useNavigate()
  const navType = useNavigationType()
  const { profile } = useProfile()
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()

  const [isExiting, setIsExiting] = useState(false)
  const [showEditPopup, setShowEditPopup] = useState(false)
  const [showInvitePopup, setShowInvitePopup] = useState(false)
  const [showAcceptPopup, setShowAcceptPopup] = useState(false)

  const handleBack = async () => {
    setIsExiting(true)
    await new Promise((r) => setTimeout(r, 280))
    navigate(-1)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <motion.div
      className="h-screen bg-background flex flex-col"
      initial={{ x: navType === 'POP' ? 0 : '100%' }}
      animate={{ x: isExiting ? '100%' : 0 }}
      transition={slideTransition}
    >
      <PageHeader onBack={handleBack} />

      <div className="flex-1 overflow-y-scroll overscroll-contain touch-pan-y pt-16">
        <div className="px-4 py-6 max-w-sm mx-auto space-y-8">

          {/* Make friend */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserPlusIcon size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.makeFriend')}</h2>
            </div>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              <button
                onClick={() => setShowInvitePopup(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <span>{t('settings.shareInviteCode')}</span>
                <CaretRightIcon size={14} className="text-muted-foreground shrink-0" />
              </button>
              <button
                onClick={() => setShowAcceptPopup(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <span>{t('settings.enterFriendCode')}</span>
                <CaretRightIcon size={14} className="text-muted-foreground shrink-0" />
              </button>
            </div>
          </section>

          {/* Profile */}
          <section className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.profile')}</h2>
            </div>
            <div className="flex items-center gap-3 py-2">
              {decodeAvatar(profile?.avatar ?? null) ? (
                <img src={decodeAvatar(profile?.avatar ?? null)!} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <UserIcon size={18} className="text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium flex-1">
                {profile ? `${profile.name} ${profile.surname}` : '—'}
              </span>
              <button
                onClick={() => setShowEditPopup(true)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Edit profile"
              >
                <PencilSimpleIcon size={16} />
              </button>
            </div>
          </section>

          {/* Appearance */}
          <section className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
              <SunIcon size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.appearance')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light', label: t('settings.light'), icon: SunIcon },
                { value: 'dark',  label: t('settings.dark'),  icon: MoonIcon },
                { value: 'system', label: t('settings.system'), icon: MonitorIcon },
              ] as { value: ReturnType<typeof useTheme>['theme'], label: string, icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-sm transition-colors ${
                    theme === value
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
              <TranslateIcon size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.language')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'en', label: 'English' },
                { value: 'cs', label: 'Čeština' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => i18n.changeLanguage(value)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm transition-colors ${
                    i18n.language === value
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Actions */}
          <section className="border-t border-border pt-6 space-y-3">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              <ArrowClockwiseIcon size={14} />
              {t('settings.reloadApp')}
            </Button>
            <Button onClick={handleSignOut} variant="destructive" className="w-full">
              {t('settings.signOut')}
            </Button>
          </section>

          {/* Build */}
          <section className="pt-2">
            <p className="text-xs text-muted-foreground text-center">
              Build <span className="font-mono">{import.meta.env.VITE_COMMIT_HASH}</span>
            </p>
          </section>

        </div>
      </div>

      <EditProfileSheet open={showEditPopup} onClose={() => setShowEditPopup(false)} />
      <InviteCodeSheet open={showInvitePopup} onClose={() => setShowInvitePopup(false)} />
      <AcceptCodeSheet open={showAcceptPopup} onClose={() => setShowAcceptPopup(false)} />
    </motion.div>
  )
}
