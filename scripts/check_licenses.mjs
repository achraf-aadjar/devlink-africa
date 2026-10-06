// Contrôle des licences des paquets Node installés (lecture de node_modules, sans dépendance).
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [root, allowlistPath] = process.argv.slice(2)

const PERMISSIVE = /^(mit(-0)?|isc|apache|bsd|psf|python|0bsd|unlicense|cc0|zlib|blueoak)/i
const COPYLEFT = /(^|[^a-z])(a|l)?gpl|gnu (affero|lesser|general)|(^|[^a-z])mpl|mozilla/i

function loadAllowlist(path) {
  if (!existsSync(path)) return new Set()
  return new Set(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.split('#')[0].trim().toLowerCase())
      .filter(Boolean),
  )
}

function licenseOf(pkg) {
  const l = pkg.license ?? pkg.licenses
  if (!l) return 'UNKNOWN'
  if (typeof l === 'string') return l
  if (Array.isArray(l)) return l.map((x) => (typeof x === 'string' ? x : x.type)).join(' OR ')
  return l.type ?? 'UNKNOWN'
}

function classify(expression) {
  const text = expression.trim().replace(/^\(|\)$/g, '')
  if (!text || text.toUpperCase() === 'UNKNOWN') return 'unknown'
  const verdicts = text.split(/\s+OR\s+/).map((alt) => {
    const parts = alt.replace(/[()]/g, '').split(/\s+AND\s+/).map((p) =>
      COPYLEFT.test(p) ? 'copyleft' : PERMISSIVE.test(p.trim()) ? 'ok' : 'unknown',
    )
    return parts.includes('copyleft') ? 'copyleft' : parts.includes('unknown') ? 'unknown' : 'ok'
  })
  if (verdicts.includes('ok')) return 'ok'
  return verdicts.includes('copyleft') ? 'copyleft' : 'unknown'
}

function* packages(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || !(entry.isDirectory() || entry.isSymbolicLink())) continue
    const path = join(dir, entry.name)
    if (entry.name.startsWith('@')) {
      yield* packages(path)
      continue
    }
    const manifest = join(path, 'package.json')
    if (existsSync(manifest)) {
      yield JSON.parse(readFileSync(manifest, 'utf8'))
      if (existsSync(join(path, 'node_modules'))) yield* packages(join(path, 'node_modules'))
    }
  }
}

const allowlist = loadAllowlist(allowlistPath)
const seen = new Set()
let problems = 0
for (const pkg of packages(root)) {
  if (!pkg.name || seen.has(`${pkg.name}@${pkg.version}`)) continue
  seen.add(`${pkg.name}@${pkg.version}`)
  const lic = licenseOf(pkg)
  const verdict = classify(lic)
  if (verdict === 'ok') continue
  if (allowlist.has(pkg.name.toLowerCase()) || allowlist.has(`${pkg.name}@${pkg.version}`.toLowerCase())) {
    console.log(`  exception justifiée : ${pkg.name} ${pkg.version} (${lic})`)
    continue
  }
  problems++
  const label = verdict === 'copyleft' ? 'RÉCIPROCITÉ' : 'INCONNUE/NON RECONNUE'
  console.error(`  [${label}] ${pkg.name} ${pkg.version} : ${lic}`)
}
console.log(`${seen.size} paquets Node analysés, ${problems} problème(s).`)
process.exit(problems ? 1 : 0)
