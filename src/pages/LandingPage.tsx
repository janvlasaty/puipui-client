import { useTranslation } from 'react-i18next'

const BASE = import.meta.env.BASE_URL

const gradients = {
  blue:   'linear-gradient(to right, #4F46E5, #3B82F6, #22D3EE)',
  purple: 'linear-gradient(to right, #7C3AED, #A855F7, #C084FC)',
  green:  'linear-gradient(to right, #065F46, #059669, #34D399)',
  pink:   'linear-gradient(to right, #BE185D, #EC4899, #F9A8D4)',
  amber:  'linear-gradient(to right, #92400E, #F59E0B, #FDE68A)',
  teal:   'linear-gradient(to right, #134E4A, #0D9488, #5EEAD4)',
  gold:   'linear-gradient(to bottom, #B8800A, #EDD020)',
} as const

const GradientTitle = ({
  children,
  className = '',
  color = 'blue',
}: {
  children: React.ReactNode
  className?: string
  color?: keyof typeof gradients
}) => (
  <h2
    className={`font-extrabold tracking-tight bg-clip-text text-transparent ${className}`}
    style={{ backgroundImage: gradients[color] }}
  >
    {children}
  </h2>
)

const PhoneMockup = ({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) => (
  <div className="relative shrink-0" style={{ width: 200 }}>
    <div className="bg-neutral-900 rounded-[2rem] p-[3px] shadow-2xl">
      <div className={`${bg} rounded-[1.8rem] overflow-hidden`} style={{ height: 400 }}>
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <span className="text-[9px] font-semibold text-neutral-800">9:41</span>
          <div className="w-14 h-3 bg-neutral-900 rounded-full" />
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-[7px] border border-neutral-800 rounded-[2px]">
              <div className="w-1.5 h-[5px] bg-neutral-800 rounded-[1px] m-px" />
            </div>
          </div>
        </div>
        <div className="h-full overflow-hidden">{children}</div>
      </div>
    </div>
  </div>
)

const avatarColors = ['#F4A261', '#E76F51', '#457B9D', '#2A9D8F', '#E9C46A', '#264653', '#A8DADC', '#F1FAEE']
const avatarEmojis = ['👩🏽', '👨🏻', '👩🏾', '👨🏿', '👩🏼', '👨🏽', '👩🏻', '👨🏾']

interface LandingPageProps {
  onSignIn: () => void
}

export const LandingPage = ({ onSignIn }: LandingPageProps) => {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-8 pt-12 pb-16 flex items-start justify-between gap-12">
        <div className="flex-1 pt-2">
          <div className="flex items-center gap-3 mb-6">
            <img src={`${BASE}puipui-192x192.png`} alt="PuiPui" className="w-14 h-14 rounded-2xl shadow-sm" />
            <span
              className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: gradients.gold }}
            >
              PuiPui
            </span>
          </div>
          <p className="text-base text-neutral-500 leading-relaxed max-w-xs">
            {t('landing.tagline')}
          </p>
        </div>

        <div className="shrink-0">
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-5 flex flex-col items-center gap-4 min-w-[220px]">
            <p className="text-sm text-neutral-500 text-center">{t('auth.inviteOnly')}</p>
            <button
              onClick={onSignIn}
              className="px-5 py-2.5 rounded-full text-sm font-semibold active:scale-95 transition-all w-full"
              style={{ background: '#DFAF07', color: '#fff' }}
            >
              {t('auth.signIn')}
            </button>
          </div>
        </div>
      </section>

      {/* ── New era of online friendship ── */}
      <section className="relative overflow-hidden py-20 px-8" style={{ background: '#FFFBEB' }}>
        {avatarEmojis.map((emoji, i) => (
          <div
            key={i}
            className="absolute rounded-full flex items-center justify-center text-2xl select-none pointer-events-none opacity-80"
            style={{
              background: avatarColors[i],
              width: 52 + (i % 3) * 8,
              height: 52 + (i % 3) * 8,
              top: `${10 + (i * 37) % 70}%`,
              left: i < 4 ? `${2 + i * 8}%` : `${62 + (i - 4) * 9}%`,
              filter: 'blur(0.5px)',
            }}
          >
            {emoji}
          </div>
        ))}

        <div className="relative max-w-5xl mx-auto">
          <GradientTitle color="blue" className="text-4xl md:text-5xl text-center mb-12">
            {t('landing.newEra')}
          </GradientTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: t('landing.maxFriendsTitle'),
                body: t('landing.maxFriendsBody'),
              },
              {
                title: t('landing.meaningfulChatTitle'),
                body: t('landing.meaningfulChatBody'),
              },
              {
                title: t('landing.shareExcitementTitle'),
                body: t('landing.shareExcitementBody'),
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white">
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Build friendship not fancy profile ── */}
      <section className="max-w-5xl mx-auto px-8 py-20 flex items-center gap-16">
        <div className="flex-1 space-y-6">
          <GradientTitle color="purple" className="text-4xl md:text-5xl leading-tight">
            {t('landing.buildFriendship').split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
          </GradientTitle>
          {[
            { lead: t('landing.dunbar'), body: t('landing.dunbarBody') },
            { lead: t('landing.focusFriends'), body: t('landing.focusFriendsBody') },
            { lead: t('landing.enjoyConversations'), body: t('landing.enjoyConversationsBody') },
            { lead: t('landing.notAboutProfile'), body: t('landing.notAboutProfileBody') },
          ].map(({ lead, body }) => (
            <p key={lead} className="text-sm text-neutral-600 leading-relaxed">
              <span className="font-semibold text-neutral-900">{lead}</span>{' '}{body}
            </p>
          ))}
        </div>

        <div className="shrink-0 hidden md:flex">
          <PhoneMockup>
            <div className="px-4 pb-4 h-full flex flex-col">
              <div className="flex items-center gap-2 py-2 border-b border-neutral-100 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm">👩🏽</div>
                <span className="font-semibold text-sm">Monica</span>
              </div>
              <div className="flex-1 space-y-2 overflow-hidden">
                {[
                  { me: false, text: 'Hey! Did you see the new café on Náměstí?' },
                  { me: true, text: 'Yes!! It was so good, I shared it in vibes 😍' },
                  { me: false, text: 'I know, saw it! Going tomorrow with Jana' },
                  { me: true, text: "Perfect, you'll love it" },
                  { me: false, text: '🙌' },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.me ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-2xl px-3 py-1.5 text-[10px] leading-snug max-w-[80%] ${msg.me ? 'bg-amber-400 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 bg-neutral-100 rounded-full px-3 py-1.5 flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 flex-1">Message...</span>
                <div className="w-4 h-4 rounded-full bg-amber-400" />
              </div>
            </div>
          </PhoneMockup>
        </div>
      </section>

      {/* ── Meaningful conversation ── */}
      <section className="bg-neutral-50 py-20 px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-16">
          <div className="shrink-0 hidden md:flex">
            <PhoneMockup bg="bg-emerald-50">
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b border-neutral-100 bg-white">
                  <div className="bg-neutral-100 rounded-full px-3 py-1">
                    <span className="text-[10px] text-neutral-400">Search places...</span>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-100">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <line x1="0" y1="60" x2="200" y2="60" stroke="#4ade8050" strokeWidth="12" />
                      <line x1="70" y1="0" x2="70" y2="300" stroke="#4ade8050" strokeWidth="8" />
                      <line x1="0" y1="140" x2="200" y2="140" stroke="#4ade8050" strokeWidth="20" />
                      <line x1="130" y1="0" x2="130" y2="300" stroke="#4ade8050" strokeWidth="14" />
                      <rect x="80" y="70" width="40" height="60" rx="4" fill="#86efac80" />
                      <rect x="20" y="20" width="35" height="30" rx="4" fill="#86efac80" />
                      <rect x="140" y="100" width="50" height="30" rx="4" fill="#86efac80" />
                    </svg>
                    {[{ x: 90, y: 55 }, { x: 50, y: 110 }, { x: 145, y: 85 }].map((p, i) => (
                      <div key={i} className="absolute flex flex-col items-center" style={{ left: p.x, top: p.y, transform: 'translate(-50%,-100%)' }}>
                        <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow flex items-center justify-center text-[9px]">
                          {i === 0 ? '☕' : i === 1 ? '🍕' : '🎬'}
                        </div>
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full -mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PhoneMockup>
          </div>

          <div className="flex-1 space-y-7">
            <GradientTitle color="green" className="text-4xl md:text-5xl leading-tight">
              {t('landing.meaningfulConversation').split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
            </GradientTitle>
            {[
              { title: t('landing.introducingTopics'), body: t('landing.introducingTopicsBody') },
              { title: t('landing.usefulNotices'), body: t('landing.usefulNoticesBody') },
              { title: t('landing.enhanceChat'), body: t('landing.enhanceChatBody') },
            ].map(({ title, body }) => (
              <div key={title}>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sharing interests ── */}
      <section className="max-w-5xl mx-auto px-8 py-20 flex items-center gap-16">
        <div className="shrink-0 hidden md:flex gap-3 items-end">
          <PhoneMockup>
            <div className="px-3 py-3 h-full flex flex-col gap-2 overflow-hidden">
              <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">Friends' vibes</p>
              {[
                { emoji: '📚', label: 'Dune Messiah', sub: 'Frank Herbert', color: 'bg-amber-50' },
                { emoji: '🍕', label: 'Manifesto', sub: 'Letná district', color: 'bg-orange-50' },
                { emoji: '🎬', label: 'Oppenheimer', sub: 'Christopher Nolan', color: 'bg-blue-50' },
                { emoji: '🎵', label: 'In Rainbows', sub: 'Radiohead', color: 'bg-purple-50' },
              ].map(({ emoji, label, sub, color }, i) => (
                <div key={i} className={`${color} rounded-xl p-2 flex items-center gap-2`}>
                  <span className="text-lg">{emoji}</span>
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-800">{label}</p>
                    <p className="text-[9px] text-neutral-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </PhoneMockup>
          <PhoneMockup>
            <div className="px-3 py-3 h-full flex flex-col gap-2 overflow-hidden">
              <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">My places</p>
              {[
                { emoji: '☕', label: 'EMA Espresso Bar', sub: 'Vinohrady', color: 'bg-amber-50' },
                { emoji: '🌿', label: 'Riegrovy sady', sub: 'Park · Vinohrady', color: 'bg-green-50' },
                { emoji: '🍺', label: 'Lokál Dlouhááá', sub: 'Staré Město', color: 'bg-yellow-50' },
              ].map(({ emoji, label, sub, color }, i) => (
                <div key={i} className={`${color} rounded-xl p-2 flex items-center gap-2`}>
                  <span className="text-lg">{emoji}</span>
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-800">{label}</p>
                    <p className="text-[9px] text-neutral-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </PhoneMockup>
        </div>

        <div className="flex-1 space-y-7">
          <GradientTitle color="pink" className="text-4xl md:text-5xl leading-tight">
            {t('landing.sharingInterests').split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
          </GradientTitle>
          {[
            { title: t('landing.bookmarkPlaces'), body: t('landing.bookmarkPlacesBody') },
            { title: t('landing.sawGreatMovie'), body: t('landing.sawGreatMovieBody') },
            { title: '', body: t('landing.tipFromFriend') },
          ].map(({ title, body }, i) => (
            <div key={i}>
              {title && <p className="font-semibold text-sm mb-1">{title}</p>}
              <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why PuiPui? ── */}
      <section className="py-20 px-8" style={{ background: '#FFFBEB' }}>
        <div className="max-w-5xl mx-auto flex items-start gap-16">
          <div className="flex-1">
            <GradientTitle color="teal" className="text-4xl md:text-5xl mb-6">{t('landing.whyPuiPui')}</GradientTitle>
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed max-w-lg">
              <p>
                <span className="font-semibold text-neutral-900">{t('landing.whyPuiPuiP1')}</span>{' '}
                {t('landing.whyPuiPuiP1Body')}
              </p>
              <p>
                <span className="font-semibold text-neutral-900">{t('landing.whyPuiPuiP2')}</span>{' '}
                {t('landing.whyPuiPuiP2Body')}
              </p>
            </div>
          </div>
          <div className="shrink-0 hidden md:flex items-center justify-center w-48 h-48">
            <div className="text-[80px] select-none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>
              🍯
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-lg mx-auto">
          <GradientTitle color="amber" className="text-4xl md:text-5xl mb-4">
            {t('landing.absolutePrivacy').split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
          </GradientTitle>
          <p className="text-neutral-500 text-sm leading-relaxed mb-10">
            {t('landing.pricingBody')}
          </p>
          <div className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: gradients.amber }}>
            3<span className="text-3xl font-normal ml-1 text-neutral-400">€ / mo</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-neutral-950 text-white py-10 px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={`${BASE}puipui-192x192.png`} alt="PuiPui" className="w-7 h-7 rounded-lg opacity-90" />
            <span className="font-semibold text-sm">PuiPui</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap justify-center">
            {[t('landing.footerBasedIn'), t('landing.footerCareers'), t('landing.footerSupport'), t('landing.footerPrivacy'), t('landing.footerTerms')].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-4">
                <span className="hover:text-white transition-colors cursor-pointer">{item}</span>
                {i < arr.length - 1 && <span className="text-neutral-700">·</span>}
              </span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
