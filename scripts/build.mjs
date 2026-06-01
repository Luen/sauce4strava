import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const run = (cmd, opts = {}) =>
    execSync(cmd, { cwd: opts.cwd || root, stdio: 'inherit', shell: true })
const merge = (a, b) =>
    execSync(`node tools/bin/mergejson ${a} ${b}`, {
        cwd: root,
        encoding: 'utf8',
    })

process.chdir(root)

run('node scripts/materialize-symlinks.mjs')

if (!fs.existsSync('node_modules')) {
    run('npm install')
}
const chartJs = path.join(root, 'node_modules/sauce-chartjs')
if (!fs.existsSync(path.join(chartJs, 'dist/Chart.pretty.js'))) {
    run('npm install', { cwd: chartJs })
    run('npx rollup -c', { cwd: chartJs })
}
fs.writeFileSync('node_modules/.packages.build', '')

fs.writeFileSync(
    'manifest.json.tmp',
    merge('manifest_base.json', 'manifest_chromium.json'),
)
fs.writeFileSync(
    'manifest.json',
    merge('manifest.json.tmp', 'manifest_dev.json'),
)
fs.unlinkSync('manifest.json.tmp')

run('npx sass --no-source-map scss:css')
fs.cpSync('scss/fonts', 'css/fonts', { recursive: true })

for (const [src, dest] of [
    ['node_modules/jscoop/src', 'src/common/jscoop'],
    ['node_modules/jsfit/src', 'src/common/jsfit'],
    ['node_modules/saucecharts/src', 'src/site/saucecharts'],
    ['node_modules/saucecharts/css', 'css/saucecharts'],
]) {
    fs.rmSync(dest, { recursive: true, force: true })
    fs.cpSync(src, dest, { recursive: true })
}
fs.copyFileSync('node_modules/fflate/esm/browser.js', 'src/common/fflate.mjs')
fs.copyFileSync(
    'node_modules/sauce-chartjs/dist/Chart.pretty.js',
    'src/site/chartjs/Chart.js',
)

let commit = '0'
try {
    commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
} catch (_) {
    /* ignore */
}
fs.writeFileSync('build.json', JSON.stringify({ git_commit: commit }) + '\n')

run('node scripts/materialize-symlinks.mjs')
console.info('Build complete.')
