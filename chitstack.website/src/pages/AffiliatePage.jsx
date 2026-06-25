import {
  Handshake, UserPlus, Share2, IndianRupee, BarChart3,
  CheckCircle, Clock, ArrowRight
} from 'lucide-react'

const portalUrl = import.meta.env.VITE_GLOBAL_PORTAL_URL || ''

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Register as an Affiliate',
    desc: 'Fill out a short application — your name, email, phone, and optionally your company. Submit and wait for approval from our team (usually within 24 hours). You\'ll receive your unique affiliate code by email.',
  },
  {
    icon: Share2,
    step: '02',
    title: 'Share Your Code',
    desc: 'Share your unique affiliate code (e.g. AFF-PK42) with chit fund businesses in your network. Use it in conversations, emails, social media, or your own marketing materials.',
  },
  {
    icon: IndianRupee,
    step: '03',
    title: 'Earn Commissions',
    desc: 'When a business you referred subscribes to ChitStack and their payment is confirmed, you automatically earn a commission on the order total. Commissions accumulate in your affiliate dashboard.',
  },
]

const dashboardCards = [
  {
    icon: Handshake,
    title: 'Total Referrals',
    desc: 'See how many businesses have signed up using your code.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: IndianRupee,
    title: 'Total Earned',
    desc: 'Cumulative commissions you\'ve earned across all referrals.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Clock,
    title: 'Pending Amount',
    desc: 'Commissions earned but not yet paid out to you.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: CheckCircle,
    title: 'Paid Out',
    desc: 'Total commissions already transferred to your account.',
    color: 'bg-indigo-50 text-indigo-600',
  },
]

const faqs = [
  {
    q: 'Who can become an affiliate?',
    a: 'Anyone can apply — consultants, accountants, fintech professionals, or anyone with a network in the chit fund industry. Applications are reviewed and approved by our team.',
  },
  {
    q: 'How much commission do I earn?',
    a: 'Commission rates are set by the ChitStack admin team and may vary. Your dashboard always shows your current rate. Some affiliates may receive custom rates based on volume.',
  },
  {
    q: 'When do I get paid?',
    a: 'Commissions are recorded automatically when a referred customer\'s payment is confirmed. Payouts are processed periodically by the ChitStack team and shown in your dashboard.',
  },
  {
    q: 'How do I track my referrals?',
    a: 'Your affiliate dashboard shows all referred companies, their order details, commission earned per order, payout status, and full commission history.',
  },
]

export default function AffiliatePage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-800/60 border border-indigo-600/40 text-indigo-200 text-xs font-medium mb-6">
            <Handshake size={14} />
            Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Earn by referring chit fund businesses
          </h1>
          <p className="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
            Know a chit fund company that needs modern software? Refer them with your unique code
            and earn a commission every time they subscribe. Track everything from your dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`${portalUrl}/affiliate/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Join the Program <ArrowRight size={18} />
            </a>
            <a
              href={`${portalUrl}/affiliate/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-indigo-400/50 text-white font-semibold hover:bg-indigo-800/50 transition-colors"
            >
              Affiliate Login
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500">Three simple steps to start earning.</p>
          </div>

          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {s.step}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard preview */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Your affiliate dashboard</h2>
            <p className="text-slate-500">
              Once approved, log in to your affiliate portal to track everything in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {dashboardCards.map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                  <card.icon size={18} />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{card.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Commission history</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-500">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-3 font-medium text-slate-400">Company</th>
                    <th className="pb-3 font-medium text-slate-400">Order Ref</th>
                    <th className="pb-3 font-medium text-slate-400">Order Amount</th>
                    <th className="pb-3 font-medium text-slate-400">Commission</th>
                    <th className="pb-3 font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { co: 'Sharma Chits', ref: 'ORD-00124', amt: '₹4,999', comm: '₹250', status: 'Paid', paid: true },
                    { co: 'Reddy Associates', ref: 'ORD-00131', amt: '₹4,999', comm: '₹250', status: 'Pending', paid: false },
                    { co: 'Nair Financiers', ref: 'ORD-00138', amt: '₹1,999', comm: '₹100', status: 'Pending', paid: false },
                  ].map((row) => (
                    <tr key={row.ref}>
                      <td className="py-3 text-slate-700 font-medium">{row.co}</td>
                      <td className="py-3 font-mono text-slate-400">{row.ref}</td>
                      <td className="py-3">{row.amt}</td>
                      <td className="py-3 text-green-600 font-semibold">{row.comm}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              Sample data shown for illustration. Your actual commissions appear after you join and refer customers.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">
            Affiliate program FAQ
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-slate-100 pb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-16 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">Ready to start earning?</h2>
          <p className="text-indigo-100 mb-8">
            Apply to join the ChitStack affiliate program. It&apos;s free and takes just a few minutes.
          </p>
          <a
            href={`${portalUrl}/affiliate/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Join the Program <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </div>
  )
}
