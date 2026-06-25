import { Link } from 'react-router-dom'
import { Handshake, UserPlus, Share2, IndianRupee, ArrowRight } from 'lucide-react'

const portalUrl = import.meta.env.VITE_GLOBAL_PORTAL_URL || ''

const steps = [
  {
    icon: UserPlus,
    title: 'Register',
    desc: 'Sign up as an affiliate and get your unique referral code.',
  },
  {
    icon: Share2,
    title: 'Refer',
    desc: 'Share your code with chit fund businesses looking for software.',
  },
  {
    icon: IndianRupee,
    title: 'Earn',
    desc: 'Earn a commission every time a referred business subscribes.',
  },
]

export default function AffiliateProgram() {
  return (
    <section className="py-24 bg-indigo-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-800/60 border border-indigo-600/40 text-indigo-200 text-xs font-medium mb-6">
              <Handshake size={14} />
              Affiliate Program
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Earn by referring chit fund businesses
            </h2>
            <p className="text-indigo-200 leading-relaxed mb-8">
              Know a chit fund company that could benefit from ChitStack? Join our affiliate program,
              refer them with your unique code, and earn a commission every time they subscribe.
              Track your referrals, commissions, and payouts from your affiliate dashboard.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={`${portalUrl}/affiliate/register`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors"
              >
                Join the Program <ArrowRight size={16} />
              </a>
              <Link
                to="/affiliates"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/50 text-indigo-200 font-semibold text-sm hover:bg-indigo-800/50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4 lg:max-w-md xl:max-w-none">
            {steps.map((s, i) => (
              <div key={s.title} className="relative p-5 rounded-2xl bg-indigo-900/50 border border-indigo-700/50">
                <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center mb-4">
                  <s.icon size={18} className="text-indigo-200" />
                </div>
                <div className="absolute top-4 right-4 text-4xl font-bold text-indigo-800/60">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-indigo-300 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
