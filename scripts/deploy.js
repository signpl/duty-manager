#!/usr/bin/env node
// 배포 대상(duty-manager = 화성지점 / duty-manager-2 = 분점)을 사람이 실수로
// 잘못 바꾸는 것을 막기 위한 스크립트. .vercel-configs/<target>.json 을
// .vercel/project.json 으로 복사한 뒤 vercel --prod 로 배포한다.
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const target = process.argv[2]
const valid = ['duty-manager', 'duty-manager-2']

if (!valid.includes(target)) {
  console.error(`사용법: node scripts/deploy.js <${valid.join('|')}>`)
  process.exit(1)
}

const src = path.join(__dirname, '..', '.vercel-configs', `${target}.json`)
const dest = path.join(__dirname, '..', '.vercel', 'project.json')

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)

const config = JSON.parse(fs.readFileSync(dest, 'utf8'))
console.log(`배포 대상: ${config.projectName} (projectId: ${config.projectId})`)

execSync('npx vercel --prod --yes --force', { stdio: 'inherit' })
