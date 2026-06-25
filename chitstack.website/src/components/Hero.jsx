import { ArrowRight, Play } from 'lucide-react'

const portalUrl = import.meta.env.VITE_GLOBAL_PORTAL_URL || ''

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.3)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.15)_0%,_transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-800/60 border border-indigo-600/40 text-indigo-200 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trusted by chit fund companies across India
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            Run Your Chit Fund
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">
              Business — Digitally
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-indigo-100 leading-relaxed mb-10 max-w-2xl">
            ChitStack is the all-in-one platform for chit fund companies. Manage groups, run
            live auctions, collect payments, and keep your members informed — all in one place.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href={`${portalUrl}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-indigo-400/50 text-white font-semibold hover:bg-indigo-800/50 transition-colors"
            >
              <Play size={16} className="fill-white" />
              See How It Works
            </a>
          </div>

          <div className="mt-16 flex flex-wrap gap-8 text-sm text-indigo-200">
            <div>
              <span className="block text-2xl font-bold text-white">500+</span>
              Chit groups managed
            </div>
            <div className="w-px bg-indigo-700" />
            <div>
              <span className="block text-2xl font-bold text-white">50,000+</span>
              Members enrolled
            </div>
            <div className="w-px bg-indigo-700" />
            <div>
              <span className="block text-2xl font-bold text-white">₹100Cr+</span>
              Transactions processed
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
