import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = join(currentDir, '..')
const srcRoot = join(projectRoot, 'src')
const pageRoot = join(srcRoot, 'pages')
const enforceFiles = [
  join(srcRoot, 'components', 'Layout.jsx')
]

const targetExtensions = new Set(['.js', '.jsx', '.ts', '.tsx'])

const hexColorRegex = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const violations = []

const scanFile = (fullPath) => {
  const extension = fullPath.slice(fullPath.lastIndexOf('.'))
  if (!targetExtensions.has(extension)) return

  const relativePath = relative(projectRoot, fullPath)
  const content = readFileSync(fullPath, 'utf8')
  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    const matches = line.match(hexColorRegex)
    if (!matches) return

    matches.forEach((match) => {
      violations.push({
        file: relativePath.split(sep).join('/'),
        line: index + 1,
        color: match
      })
    })
  })
}

const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      walk(fullPath)
      continue
    }
    scanFile(fullPath)
  }
}

walk(pageRoot)
enforceFiles.forEach((file) => {
  if (statSync(file).isFile()) scanFile(file)
})

if (violations.length > 0) {
  console.error('Hardcoded hex colors detected outside allowed theme files:\n')
  violations.forEach((v) => {
    console.error(`- ${v.file}:${v.line} -> ${v.color}`)
  })
  console.error('\nMove these colors into src/theme/tokens.js or CSS variables in src/index.css.')
  process.exit(1)
}

console.log('Theme color guard passed: no disallowed hardcoded hex colors found.')
