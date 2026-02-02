const semverGte = (a, b) => {
  const parse = (v) => v.replace(/^v/, '').split('.').map((n) => Number.parseInt(n, 10))
  const [am, an, ap] = parse(a)
  const [bm, bn, bp] = parse(b)
  if (am !== bm) return am > bm
  if (an !== bn) return an > bn
  return ap >= bp
}

const version = process.version
const min20 = '20.19.0'
const min22 = '22.12.0'
const major = Number.parseInt(version.replace(/^v/, '').split('.')[0] ?? '0', 10)

const ok =
  (major === 20 && semverGte(version, min20))
  || (major >= 22 && semverGte(version, min22))

if (!ok) {
  console.error(
    `[node-version] Node ${version} is too old for this project.\n` +
    `- Required: Node ^${min20} or >=${min22} (Nuxt 3.20 / Vite 7 / @vitejs/plugin-vue 6)\n` +
    `- Fix (recommended): nvm install ${min20} && nvm use ${min20}\n`
  )
  process.exit(1)
}
