import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { portalLinks } from '../config/portalLinks'

const plans = [
  {
    name: 'Starter',
    price: '₹1,999',
    period: '/month',
    desc: 'Perfect for small chit fund companies getting started.',
    features: [
      'Up to 5 chit groups',
      'Up to 100 members',
      '2 branch locations',
      'Basic reports & compliance forms',
      'Member portal access',
      'Email support',
    ],
    cta: 'Start Free Trial',
    ctaHref: portalLinks.register,
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₹4,999',
    period: '/month',
    desc: 'For growing companies managing multiple groups and branches.',
    features: [
      'Unlimited chit groups',
      'Up to 1,000 members',
      'Unlimited branches',
      'Live auction console',
      'Agent mobile collections',
      'Advanced financial reporting',
      'GST & statutory forms',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    ctaHref: portalLinks.register,
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large operations with high member volumes and custom requirements.',
    features: [
      'Unlimited members',
      'Dedicated infrastructure',
      'Custom integrations',
      'White-label options',
      'SLA-backed uptime',
      'Dedicated account manager',
      'On-boarding assistance',
    ],
    cta: 'Contact Us',
    ctaHref: 'mailto:sales@chitstack.com',
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            No setup fees. No per-transaction charges. Start with a free trial — no credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border ${plan.highlight
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-105'
                : 'border-slate-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
                  Most Popular
                </div>
              )}
              <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <div className="flex items-end gap-1 mb-2">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-8 ${plan.highlight ? 'text-indigo-100' : 'text-slate-500'}`}>
                {plan.desc}
              </p>

              <a
                href={plan.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors mb-8 ${
                  plan.highlight
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {plan.cta} <ArrowRight size={16} />
              </a>

              <ul className="space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-emerald-300' : 'text-indigo-500'}`}
                    />
                    <span className={plan.highlight ? 'text-indigo-100' : 'text-slate-600'}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/pricing"
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
          >
            Compare all plan features <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
