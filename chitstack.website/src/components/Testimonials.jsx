import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Ramesh Iyer',
    role: 'Managing Director',
    company: 'Iyer Chits, Coimbatore',
    quote:
      'We moved from Excel sheets and WhatsApp groups to ChitStack in a week. The live auction feature saved hours every month. Our members love getting instant payment receipts.',
    rating: 5,
    initials: 'RI',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    name: 'Priya Sundaram',
    role: 'Operations Head',
    company: 'Sundaram Financiers, Chennai',
    quote:
      'The statutory forms and GST reports are generated automatically. What used to take our accountant two days now takes two minutes. The compliance burden has dropped significantly.',
    rating: 5,
    initials: 'PS',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Mohammed Farhan',
    role: 'Founder',
    company: 'Farhan Associates, Hyderabad',
    quote:
      'Our field agents now collect installments digitally through their phones. No more cash reconciliation issues. The route management feature is exactly what we needed.',
    rating: 5,
    initials: 'MF',
    color: 'bg-amber-100 text-amber-700',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Trusted by chit fund companies
          </h2>
          <p className="text-lg text-slate-500">
            See what operators say after switching to ChitStack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}, {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
