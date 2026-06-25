import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Layers } from 'lucide-react'
import { portalLinks } from '../config/portalLinks'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/affiliates', label: 'Affiliates' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <Layers size={24} />
            ChitStack
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href={portalLinks.login}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </a>
            <a
              href={portalLinks.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Try Demo
            </a>
            <a
              href={portalLinks.register}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Free Trial
            </a>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block text-sm font-medium py-1 ${isActive ? 'text-indigo-600' : 'text-slate-600'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <a
              href={portalLinks.login}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-slate-600 py-1"
            >
              Sign In
            </a>
            <a
              href={portalLinks.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-slate-600 py-1"
            >
              Try Demo
            </a>
            <a
              href={portalLinks.register}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
