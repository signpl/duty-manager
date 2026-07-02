#!/usr/bin/env node
// 두 지점(화성/분점) Supabase DB의 모든 데이터를 backups/ 폴더에
// 시간표시(timestamp) JSON 파일로 백업한다.
//
//   node scripts/backup.js            → 두 지점 모두 백업
//   node scripts/backup.js main       → 화성지점만
//   node scripts/backup.js branch     → 분점만
//
// anon 키/URL은 이미 배포된 사이트에 공개되는 값이라 여기에 넣어도 안전하다.
// (RLS가 켜져 있어도 이 테이블들은 anon 읽기가 허용되어 있다.)

const fs = require('fs')
const path = require('path')

const PROJECTS = {
  main: {
    label: '화성지점 (duty-manager)',
    url: 'https://uzffnljizhfzviykysoe.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZmZubGppemhmenZpeWt5c29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTgwNzAsImV4cCI6MjA5NTc5NDA3MH0.WGJcynr2Vy9lSe7GMgSSPBXvUjLLuO5cf9fIvMXD86o',
  },
  branch: {
    label: '분점 (duty-manager-2)',
    url: 'https://qqxjaakunjaytzrngttu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeGphYWt1bmpheXR6cm5ndHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjE5MDQsImV4cCI6MjA5ODM5NzkwNH0.PXdmgt-SKAo1hdW2CqA_l1S8N5hxVgEdPw3GDt04H3A',
  },
}

const TABLES = ['team_members', 'schedules', 'monthly_notes']

async function fetchTable(proj, table) {
  const res = await fetch(`${proj.url}/rest/v1/${table}?select=*`, {
    headers: { apikey: proj.anonKey, Authorization: `Bearer ${proj.anonKey}` },
  })
  if (!res.ok) throw new Error(`${table} 읽기 실패: HTTP ${res.status} ${await res.text()}`)
  return res.json()
}

async function backupOne(key) {
  const proj = PROJECTS[key]
  const data = { _meta: { project: key, label: proj.label, backedUpAt: new Date().toISOString() } }
  let total = 0
  for (const t of TABLES) {
    data[t] = await fetchTable(proj, t)
    total += data[t].length
    console.log(`  - ${t}: ${data[t].length}건`)
  }

  const dir = path.join(__dirname, '..', 'backups')
  fs.mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const file = path.join(dir, `${key}_${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
  console.log(`✓ ${proj.label} 백업 완료 (총 ${total}건) → backups/${path.basename(file)}`)
}

async function main() {
  const arg = process.argv[2]
  const targets = arg ? [arg] : ['main', 'branch']
  for (const t of targets) {
    if (!PROJECTS[t]) {
      console.error(`알 수 없는 대상: ${t} (main | branch)`)
      process.exit(1)
    }
    console.log(`\n[${PROJECTS[t].label}] 백업 중...`)
    await backupOne(t)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
