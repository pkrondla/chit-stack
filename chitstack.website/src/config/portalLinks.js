/** Strip trailing slashes from a base URL. */
function trimBase(url) {
  return (url || '').replace(/\/+$/, '')
}

/**
 * Global portal base URL (registration, login, affiliate flows).
 * Set VITE_GLOBAL_PORTAL_URL at build time; dev falls back to local global web.
 */
export const globalPortalUrl = trimBase(
  import.meta.env.VITE_GLOBAL_PORTAL_URL
    || (import.meta.env.DEV ? 'http://localhost:5173' : 'https://manage.chitstack.com'),
)

/**
 * Demo tenant app URL (pre-loaded trial environment).
 * Set VITE_DEMO_TENANT_URL at build time; dev falls back to local tenant web.
 */
export const demoPortalUrl = trimBase(
  import.meta.env.VITE_DEMO_TENANT_URL
    || (import.meta.env.DEV ? 'http://localhost:5174' : 'https://demo.chitstack.com'),
)

/** Build an absolute URL to a path on the global portal. */
export function globalPortalPath(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${globalPortalUrl}${normalized}`
}

export const portalLinks = {
  register: globalPortalPath('/register'),
  login: globalPortalPath('/login'),
  subscribe: globalPortalPath('/subscribe'),
  affiliateRegister: globalPortalPath('/affiliate/register'),
  affiliateLogin: globalPortalPath('/affiliate/login'),
  demo: demoPortalUrl,
}
