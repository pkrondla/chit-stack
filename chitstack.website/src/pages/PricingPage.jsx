import { Check, X, ArrowRight } from 'lucide-react'
import { portalLinks } from '../config/portalLinks'

const plans = [
  { name: 'Starter', price: '₹1,999', period: '/month', highlight: false },
  { name: 'Growth', price: '₹4,999', period: '/month', highlight: true },
  { name: 'Enterprise', price: 'Custom', period: '', highlight: false },
]

const comparisonRows = [
  {
    category: 'Core',
    features: [
      { name: 'Chit groups', starter: 'Up to 5', growth: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Members', starter: 'Up to 100', growth: 'Up to 1,000', enterprise: 'Unlimited' },
      { name: 'Branch locations', starter: '2', growth: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Staff users', starter: '5', growth: '20', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'Operations',
    features: [
      { name: 'Live auction console', starter: false, growth: true, enterprise: true },
      { name: 'Agent mobile collections', starter: false, growth: true, enterprise: true },
      { name: 'Route management', starter: false, growth: true, enterprise: true },
      { name: 'Member self-service portal', starter: true, growth: true, enterprise: true },
      { name: 'Push notifications', starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: 'Finance & Compliance',
    features: [
      { name: 'Basic reports', starter: true, growth: true, enterprise: true },
      { name: 'P&L and journal entries', starter: false, growth: true, enterprise: true },
      { name: 'GST calculations', starter: false, growth: true, enterprise: true },
      { name: 'Statutory compliance forms', starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: 'Infrastructure & Support',
    features: [
      { name: 'Dedicated database', starter: true, growth: true, enterprise: true },
      { name: 'Dedicated infrastructure', starter: false, growth: false, enterprise: true },
      { name: 'White-label branding', starter: false, growth: false, enterprise: true },
      { name: 'Support', starter: 'Email', growth: 'Priority email', enterprise: 'Dedicated manager' },
      { name: 'Data migration assistance', starter: false, growth: false, enterprise: true },
    ],
  },
]

function CellValue({ value }) {
  if (value === true) return <Check size={18} className="text-indigo-500 mx-auto" />
  if (value === false) return <X size={16} className="text-slate-300 mx-auto" />
  return <span className="text-xs text-slate-600">{value}</span>
}

export default function PricingPage() {
  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Pricing that scales with you</h1>
          <p className="text-lg text-indigo-200">
            Start free, grow at your pace. No setup fee, no per-transaction charges.
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 border text-center ${
                plan.highlight
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3">
                  Most Popular
                </span>
              )}
              <h2 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h2>
              <div className="flex items-end justify-center gap-1 mb-5">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {plan.period}
                </span>
              </div>
              <a
                href={plan.name === 'Enterprise' ? 'mailto:sales@chitstack.com' : portalLinks.register}
                target={plan.name === 'Enterprise' ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                <ArrowRight size={15} />
              </a>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Feature comparison</h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-4 font-semibold text-slate-600 w-1/2">Feature</th>
                {plans.map((p) => (
                  <th
                    key={p.name}
                    className={`px-4 py-4 font-semibold text-center ${p.highlight ? 'text-indigo-600' : 'text-slate-600'}`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((section) => (
                <>
                  <tr key={`cat-${section.category}`} className="bg-slate-50/70">
                    <td colSpan={4} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {section.category}
                    </td>
                  </tr>
                  {section.features.map((feat, i) => (
                    <tr key={feat.name} className={`border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-5 py-3.5 text-slate-700">{feat.name}</td>
                      <td className="px-4 py-3.5 text-center"><CellValue value={feat.starter} /></td>
                      <td className="px-4 py-3.5 text-center bg-indigo-50/50"><CellValue value={feat.growth} /></td>
                      <td className="px-4 py-3.5 text-center"><CellValue value={feat.enterprise} /></td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ callout */}
        <div className="mt-16 bg-indigo-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Have questions about pricing?</h3>
          <p className="text-slate-500 text-sm mb-6">
            Our team is happy to walk you through the right plan for your company size and requirements.
          </p>
          <a
            href="mailto:sales@chitstack.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Talk to Sales <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>
  )
}
