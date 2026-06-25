import { ArrowRight } from 'lucide-react'

const portalUrl = import.meta.env.VITE_GLOBAL_PORTAL_URL || ''

const steps = [
  {
    step: '01',
    title: 'Sign Up & Subscribe',
    desc: 'Register your company through our portal in minutes. Choose a subscription plan that fits your scale — no setup fee, no hidden costs.',
  },
  {
    step: '02',
    title: 'Configure Your Company',
    desc: 'Add your branches, create chit groups, enroll members, and set up your foremen and agents. Our guided setup gets you operational fast.',
  },
  {
    step: '03',
    title: 'Go Live',
    desc: 'Collect installments, run your first live auction, and share member portal access. Your entire operation runs through a single platform.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Up and running in days, not months
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            No lengthy implementations. No on-site consultants. Just a guided setup that gets your business digital fast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />

          {steps.map((s, i) => (
            <div key={s.step} className="relative flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-lg shadow-indigo-200 relative z-10">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight size={20} className="md:hidden mt-6 text-indigo-300" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href={`${portalUrl}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start Your Free Trial <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
