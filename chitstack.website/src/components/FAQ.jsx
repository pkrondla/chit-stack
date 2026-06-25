import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'What is ChitStack?',
    a: 'ChitStack is a cloud-based chit fund management platform. It covers the full operational lifecycle — from chit group creation and member enrolment to live auctions, installment collections, and statutory compliance reporting.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Register through our portal and get immediate access to a fully functional demo environment pre-loaded with sample data. Explore all features, run a test auction, and generate sample reports — no credit card required.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. ChitStack is hosted on Microsoft Azure with dedicated database isolation per company. Data is encrypted in transit (TLS) and at rest. Each company\'s data is fully isolated from every other company on the platform.',
  },
  {
    q: 'Can I import my existing member and group data?',
    a: 'Yes. We provide CSV import templates for members, chit groups, and historical transactions. Our onboarding team can assist with data migration from spreadsheets or legacy software.',
  },
  {
    q: 'What payment methods are supported for installment collection?',
    a: 'ChitStack supports cash, UPI, bank transfer, and cheque payment recording. Field agents can log collections from their mobile devices, and all transactions are reconciled centrally.',
  },
  {
    q: 'Do you support multiple branch locations?',
    a: 'Yes. The Growth and Enterprise plans support unlimited branch locations. Each branch can have its own chit groups, staff, agents, and collection routes while sharing a central reporting dashboard.',
  },
  {
    q: 'Is there an app for members?',
    a: 'Members access a web-based portal (works on mobile browsers) where they can view their passbook, outstanding demands, and group status. A dedicated mobile app is on the product roadmap.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-slate-500">
            Can&apos;t find what you&apos;re looking for?{' '}
            <a href="mailto:support@chitstack.com" className="text-indigo-600 hover:underline">
              Email our team
            </a>.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                className="flex items-center justify-between w-full text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`flex-shrink-0 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
