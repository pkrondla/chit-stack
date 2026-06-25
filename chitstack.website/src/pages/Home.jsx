import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Pricing from '../components/Pricing'
import AffiliateProgram from '../components/AffiliateProgram'
import Testimonials from '../components/Testimonials'
import FAQ from '../components/FAQ'
import { ArrowRight } from 'lucide-react'
import { portalLinks } from '../config/portalLinks'

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <AffiliateProgram />
      <Testimonials />
      <FAQ />

      {/* Final CTA banner */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to modernise your chit fund?
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Join hundreds of chit fund companies that have already made the switch.
            Start your free trial today — no credit card required.
          </p>
          <a
            href={portalLinks.register}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Start Free Trial <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </>
  )
}
