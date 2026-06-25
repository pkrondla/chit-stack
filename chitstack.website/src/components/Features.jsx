import { Link } from 'react-router-dom'
import {
  Users, Gavel, CreditCard, BarChart3, Smartphone, ShieldCheck, ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Chit Group Management',
    desc: 'Create and manage unlimited chit groups. Track subscriptions, installment schedules, prize amounts, and foreman charges with full audit trails.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: Gavel,
    title: 'Live Auction Console',
    desc: 'Conduct real-time online auctions with automated bid validation, tie-breaker rules, and instant notifications to all participants.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: CreditCard,
    title: 'Collections & Payments',
    desc: 'Route-based field collections, digital receipts, demand notes, and automated reconciliation. Reduce cash handling and manual errors.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Smartphone,
    title: 'Member & Agent Portals',
    desc: 'Members view their passbook and statements online. Field agents submit collections from the field. Foremen manage their groups independently.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Reporting & Finance',
    desc: 'P&L statements, GST returns, statutory forms, collection arrears, and journal entries — all generated automatically from your operational data.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Built-In',
    desc: 'Statutory compliance forms, KYC for members, nominee and guarantor management. Stay audit-ready at all times.',
    color: 'bg-rose-100 text-rose-600',
  },
]

export default function Features() {
  return (
    <section className="py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to run a modern chit fund
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            From day-to-day operations to year-end compliance, ChitStack handles it all.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
          >
            Explore all features <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
