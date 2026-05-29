/**
 * MathNote - ARK Framework
 * router.js - Engine routing
 */

let routes = null
let jsCache = {}

async function loadRoutes() {
  if (routes) return routes
  const res = await fetch('./routes.json')
  routes = await res.json()
  return routes
}

function loadCSS(file) {
  if (document.querySelector(`link[href="${file}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = file
  document.head.appendChild(link)
}

async function loadJS(file) {
  if (jsCache[file]) return jsCache[file]
  const mod = await import('./' + file)
  jsCache[file] = mod
  return mod
}

function matchRoute(url, routes) {
  const parts = url.split('/').filter(Boolean)

  // 1. Exact match
  const exact = routes.find(r => r.route === url)
  if (exact) return { route: exact, params: null }

  // 2. Format :param
  const withParam = routes.find(r => {
    const rParts = r.route.split('/').filter(Boolean)
    if (rParts.length !== parts.length) return false
    return rParts.every((p, i) => p.startsWith(':') || p === parts[i])
  })
  if (withParam) {
    const rParts = withParam.route.split('/').filter(Boolean)
    const params = {}
    rParts.forEach((p, i) => { if (p.startsWith(':')) params[p.slice(1)] = parts[i] })
    return { route: withParam, params }
  }

  // 3. Base route dynamic
  if (parts.length > 1) {
    const base = '/' + parts[0] + '/'
    const dynamic = routes.find(r => r.route === base)
    if (dynamic) return { route: dynamic, params: { value: parts.slice(1).join('/') } }
  }

  return null
}

export async function navigate(url) {
  window.history.pushState({}, '', url)

  const app = document.getElementById('app')
  const allRoutes = await loadRoutes()
  const matched = matchRoute(url, allRoutes)

  if (!matched) {
    app.innerHTML = '<h2 style="padding:2rem;color:red">404 - Halaman tidak ditemukan</h2>'
    return
  }

  const { route: match, params } = matched

  // Load CSS
  if (match.css) {
    const cssFiles = Array.isArray(match.css) ? match.css : [match.css]
    cssFiles.forEach(file => loadCSS(file))
  }

  // Load template + logika paralel
  const jsFiles = match.js
    ? (Array.isArray(match.js) ? match.js : [match.js])
    : []

  const [templateMod, ...logikaMods] = await Promise.all([
    loadJS(match.html),
    ...jsFiles.map(file => loadJS(file))
  ])

  // Render HTML
  app.innerHTML = templateMod.default()

  // Init logika
  for (const mod of logikaMods) {
    if (mod && mod.init) mod.init(params)
  }
}

export async function initRouter() {
  await loadRoutes()
  window.addEventListener('popstate', () => navigate(window.location.pathname))
  const path = window.location.pathname === '/' ? '/catatan' : window.location.pathname
  await navigate(path)
}
