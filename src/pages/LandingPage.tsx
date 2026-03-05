import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BASE = import.meta.env.BASE_URL

const AppleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
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

// Floating avatar bubbles for the "New era" section
const avatarColors = ['#F4A261', '#E76F51', '#457B9D', '#2A9D8F', '#E9C46A', '#264653', '#A8DADC', '#F1FAEE']
const avatarEmojis = ['👩🏽', '👨🏻', '👩🏾', '👨🏿', '👩🏼', '👨🏽', '👩🏻', '👨🏾']

export const LandingPage = () => {
  const [_loading, setLoading] = useState(false)

  const handleAppleSignIn = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin + BASE },
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-8 pt-12 pb-16 flex items-start justify-between gap-12">
        <div className="flex-1 pt-2">
          <div className="flex items-center gap-3 mb-6">
            <img src={`${BASE}puipui-192x192.png`} alt="PuiPui" className="w-12 h-12 rounded-2xl shadow-sm" />
            <span className="text-2xl font-bold tracking-tight">PuiPui</span>
          </div>
          <p className="text-base text-neutral-500 leading-relaxed max-w-xs">
            Community based messaging and social app. Focused on building real friendship and sharing.
          </p>
        </div>

        <div className="shrink-0">
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-5 flex flex-col items-center gap-4 min-w-[220px]">
            <p className="text-sm text-neutral-500 text-center">This app is invite only.</p>
            <button
              onClick={handleAppleSignIn}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all w-full justify-center"
            >
              <AppleIcon />
              Log with Apple Account
            </button>
          </div>
        </div>
      </section>

      {/* ── New era of online friendship ── */}
      <section className="relative overflow-hidden py-20 px-8" style={{ background: '#FFFBEB' }}>
        {/* Floating avatar bubbles */}
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            New era of online friendship
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: '150 friends maximum',
                body: 'Every one of your friends is your influencer as you call it. Strengthen your relations with the closest 150 of your friends.',
              },
              {
                title: 'Meaningful chat',
                body: 'Differentiate spam chat from important discussion. Topics in chat will help you keep focus on meaningful things.',
              },
              {
                title: 'Share excitement',
                body: 'Share early your best places, stories and vibes. Inspire and get inspired by those you know best.',
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
          <h2 className="text-3xl font-bold tracking-tight leading-snug">
            Build friendship<br />not fancy profile
          </h2>
          {[
            {
              lead: "Dunbar's number is 150.",
              body: 'That is maximum of your friends in PuiPui.',
            },
            {
              lead: 'Focus on your closest friends.',
              body: 'Inspire and be inspired by the people you love.',
            },
            {
              lead: 'Enjoy meaningful conversations.',
              body: 'Feel free to create private rooms or even threads with your 150 most important people.',
            },
            {
              lead: "It's not about building a profile — it's about sharing.",
              body: 'Engage in discussions in rooms and threads, and share your experiences and excitement.',
            },
          ].map(({ lead, body }) => (
            <p key={lead} className="text-sm text-neutral-600 leading-relaxed">
              <span className="font-semibold text-neutral-900">{lead}</span>{' '}{body}
            </p>
          ))}
        </div>

        <div className="shrink-0 hidden md:flex">
          <PhoneMockup>
            {/* Chat screen: Monica */}
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
                  { me: true, text: 'Perfect, you\'ll love it' },
                  { me: false, text: '🙌' },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.me ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`rounded-2xl px-3 py-1.5 text-[10px] leading-snug max-w-[80%] ${msg.me ? 'bg-amber-400 text-white' : 'bg-neutral-100 text-neutral-800'}`}
                    >
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
              {/* Map screen */}
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b border-neutral-100 bg-white">
                  <div className="bg-neutral-100 rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400">Search places...</span>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  {/* Simplified map */}
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
                    {/* Map pins */}
                    {[{ x: 90, y: 55 }, { x: 50, y: 110 }, { x: 145, y: 85 }].map((p, i) => (
                      <div
                        key={i}
                        className="absolute flex flex-col items-center"
                        style={{ left: p.x, top: p.y, transform: 'translate(-50%,-100%)' }}
                      >
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
            <h2 className="text-3xl font-bold tracking-tight">Meaningful<br />conversation</h2>
            {[
              {
                title: 'Introducing Topics',
                body: 'Helps you distinguish between casual chatter and important discussion.',
              },
              {
                title: 'Useful Notices',
                body: 'Keep key messages and pinned messages front and center in every chat topic.',
              },
              {
                title: 'Enhance your chat with powerful tools',
                body: 'Create periodical polls, events and more...',
              },
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
            {/* Vibes screen */}
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
            {/* Map pins vibes */}
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
          <h2 className="text-3xl font-bold tracking-tight">Sharing<br />interests</h2>
          {[
            {
              title: 'Bookmark your favourite places',
              body: 'Save the places you\'ve visited and share them with friends (or keep them private).',
            },
            {
              title: 'Saw great movie? Read new book?',
              body: 'There is no public profiles for getting attention — just personal recommendations to share your excitement.',
            },
            {
              title: '',
              body: 'Tip from a friend you know is often the best one.',
            },
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
            <h2 className="text-3xl font-bold mb-6 tracking-tight">Why PuiPui?</h2>
            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed max-w-lg">
              <p>
                <span className="font-semibold text-neutral-900">PuiPui relates to honeycomb in Samoa.</span>{' '}
                It means strictly &ldquo;to protect, to guard&rdquo; in the Samoan language. Samoans are known for their strong communal values, and vibrant cultural traditions. Much like our vision...
              </p>
              <p>
                <span className="font-semibold text-neutral-900">PuiPui helps you focus on your closest friends.</span>{' '}
                Instead of building an ego-driven profile with hundreds of strangers and foreign influencers, we emphasize being present and fostering inspiration within your closest community.
              </p>
            </div>
          </div>
          <div className="shrink-0 hidden md:flex items-center justify-center w-48 h-48">
            <div
              className="text-[80px] select-none"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
            >
              🍯
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-lg mx-auto">
          <span className="inline-block text-xs font-semibold text-neutral-400 uppercase tracking-widest border border-neutral-200 rounded-full px-4 py-1 mb-6">
            Pricing
          </span>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Absolute privacy</h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-10">
            Nothing comes for free. We believe our users appreciate that.
          </p>
          <div className="text-6xl font-bold tracking-tight">
            3<span className="text-3xl text-neutral-400 font-normal ml-1">€ / mo</span>
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
            {['Based in Prague', 'Careers', 'Support / Help', 'Privacy', 'Terms of Use'].map((item, i, arr) => (
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
