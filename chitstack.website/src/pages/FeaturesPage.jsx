import {
  Users, Gavel, CreditCard, BarChart3, Smartphone, ShieldCheck,
  Bell, MapPin, FileText, Wallet, BookOpen, Globe, ArrowRight
} from 'lucide-react'

import { portalLinks } from '../config/portalLinks'

const sections = [
  {
    heading: 'Group & Member Management',
    desc: 'The operational core of your chit fund business.',
    features: [
      {
        icon: Users,
        title: 'Chit Group Management',
        points: [
          'Create unlimited chit groups with configurable duration, prize amount, and installment schedules',
          'Track active, completed, and upcoming groups in a single dashboard',
          'Foreman charge and prized/non-prized member tracking',
          'Automated demand note generation per installment cycle',
        ],
      },
      {
        icon: BookOpen,
        title: 'Member Enrolment & KYC',
        points: [
          'Full member profiles with KYC documents, photos, and contact details',
          'Nominee and guarantor management with document attachments',
          'Member ticket assignment across multiple groups',
          'Member history and ledger across all groups',
        ],
      },
    ],
  },
  {
    heading: 'Auctions & Collections',
    desc: 'Real-time auction management and flexible payment collection.',
    features: [
      {
        icon: Gavel,
        title: 'Live Auction Console',
        points: [
          'Real-time online auctions powered by SignalR — all participants see live bids instantly',
          'Automated tie-breaker rules (configurable by prize date, lot, or random)',
          'Voice announcements during auctions for enhanced experience',
          'Auction history and bid logs for full audit trail',
        ],
      },
      {
        icon: CreditCard,
        title: 'Collections & Payments',
        points: [
          'Route-based field collections with agent assignment',
          'Support for cash, UPI, bank transfer, and cheque payments',
          'Digital receipts sent instantly to members',
          'Automated reconciliation and outstanding demand tracking',
        ],
      },
    ],
  },
  {
    heading: 'Portals & Notifications',
    desc: 'Give your members and agents a modern digital experience.',
    features: [
      {
        icon: Smartphone,
        title: 'Member Self-Service Portal',
        points: [
          'Members view their passbook, group status, and upcoming demands',
          'Download payment receipts and statements anytime',
          'Secure login with OTP verification',
          'Mobile-optimised web interface',
        ],
      },
      {
        icon: Bell,
        title: 'Notifications & Alerts',
        points: [
          'Push notifications for auction results, payment due dates, and receipts',
          'Bulk broadcast messages to members or specific groups',
          'Staff notifications for pending approvals and operational alerts',
          'Configurable notification templates',
        ],
      },
      {
        icon: MapPin,
        title: 'Agent Mobile Collections',
        points: [
          'Field agents submit collections from their mobile browsers',
          'Route management — assign collection routes to specific agents',
          'Offline-friendly with automatic sync on reconnect',
          'Daily collection summary and agent performance reports',
        ],
      },
    ],
  },
  {
    heading: 'Finance & Compliance',
    desc: 'Stay audit-ready and compliant without the manual effort.',
    features: [
      {
        icon: BarChart3,
        title: 'Financial Reporting',
        points: [
          'Profit & Loss statements generated from operational data',
          'Journal entries and account head management',
          'Collection arrears and ageing reports',
          'Branch-level and consolidated financial views',
        ],
      },
      {
        icon: FileText,
        title: 'Statutory Compliance',
        points: [
          'GST calculation and return-ready summaries',
          'Statutory forms per regulatory requirements',
          'Voucher and receipt management',
          'Audit trail for every financial transaction',
        ],
      },
      {
        icon: Wallet,
        title: 'Payout Management',
        points: [
          'Prize disbursement tracking per group and member',
          'Deduction management (foreman charges, arrears)',
          'Net payout calculation with full breakdown',
          'Digital payout confirmations and records',
        ],
      },
    ],
  },
  {
    heading: 'Administration & Settings',
    desc: 'Full control over your company configuration.',
    features: [
      {
        icon: Globe,
        title: 'Multi-Branch Support',
        points: [
          'Create and manage unlimited branch locations',
          'Branch-scoped staff, agents, and chit groups',
          'Consolidated reporting across all branches',
          'Branch-level access control for staff',
        ],
      },
      {
        icon: ShieldCheck,
        title: 'Role-Based Access Control',
        points: [
          'Admin, Manager, Staff, Auditor, Agent, and Member roles',
          'Granular permissions per feature and branch',
          'Audit log of all user actions',
          'Secure JWT-based authentication',
        ],
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Built for every part of your business
          </h1>
          <p className="text-lg text-indigo-200 mb-8">
            ChitStack covers the full lifecycle of chit fund operations — from onboarding your first
            member to generating year-end compliance reports.
          </p>
          <a
            href={portalLinks.register}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
          >
            Start Free Trial <ArrowRight size={18} />
          </a>
        </div>
      </div>

      {/* Feature sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        {sections.map((section) => (
          <div key={section.heading}>
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {section.heading}
              </h2>
              <p className="text-slate-500">{section.desc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.features.map((feat) => (
                <div key={feat.title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all bg-white">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                    <feat.icon size={20} className="text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">{feat.title}</h3>
                  <ul className="space-y-2">
                    {feat.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-slate-500">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-slate-50 py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">See all features in action</h2>
          <p className="text-slate-500 mb-6">
            Sign up for a free trial and explore a fully configured demo environment.
          </p>
          <a
            href={portalLinks.register}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get Started Free <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </div>
  )
}
