import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { portalLinks } from '../config/portalLinks'

const links = {
  Product: [
    { label: 'Features', to: '/features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Affiliates', to: '/affiliates' },
  ],
  Portal: [
    { label: 'Register', href: portalLinks.register },
    { label: 'Sign In', href: portalLinks.login },
    { label: 'Try Demo', href: portalLinks.demo },
    { label: 'Affiliate Login', href: portalLinks.affiliateLogin },
  ],
  Company: [
    { label: 'About', to: '#' },
    { label: 'Blog', to: '#' },
    { label: 'Contact', href: 'mailto:hello@chitstack.com' },
  ],
}

const social = [
  { label: 'X', href: '#', char: 'X' },
  { label: 'LinkedIn', href: '#', char: 'in' },
  { label: 'Facebook', href: '#', char: 'f' },
  { label: 'Instagram', href: '#', char: 'ig' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg text-white mb-4">
              <Layers size={22} />
              ChitStack
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Modern software for chit fund businesses. Manage your operations, members, and compliance from one platform.
            </p>
            <div className="flex items-center gap-3">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs font-bold"
                >
                  {s.char}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith('mailto') ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} ChitStack. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
