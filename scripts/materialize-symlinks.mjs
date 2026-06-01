import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteBase = path.join(root, 'src/site/base.js')
const commonBase = path.join(root, 'src/common/base.js')

if (!fs.existsSync(siteBase)) {
    process.exit(0)
}
const content = fs.readFileSync(siteBase, 'utf8').trim()
if (content === '../common/base.js') {
    fs.copyFileSync(commonBase, siteBase)
    console.info('Materialized src/site/base.js (Windows symlink checkout)')
}
