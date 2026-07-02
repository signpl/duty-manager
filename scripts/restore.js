#!/usr/bin/env node
// 백업 파일(backups/*.json)의 데이터를 Supabase DB로 되돌린다(복구).
//
//   node scripts/restore.js                       → 사용 가능한 백업 목록 보기
//   node scripts/restore.js main <파일>           → 미리보기(실제 변경 안 함)
//   node scripts/restore.js main <파일> --yes     → 실제 복구 실행
//
// 안전장치:
//  - --yes 없이는 무엇을 복구할지 보여주기만 하고 실제로는 바꾸지 않는다.
//  - 백업 파일의 지점과 대상 지점이 다르면 막는다 (화성 백업을 분점에 넣는 실수 방지).
//  - id 기준 upsert 방식이라 "지워진 데이터를 되살리기"는 하되,
//    백업 이후 새로 추가된 데이터를 지우지는 않는다 (덜 파괴적).

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
const backupsDir = path.join(__dirname, '..', 'backups')

function listBackups() {
  if (!fs.existsSync(backupsDir)) { console.log('backups/ 폴더가 없습니다. 먼저 npm run backup 을 실행하세요.'); return }
  const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json')).sort().reverse()
  if (files.length === 0) { console.log('백업 파일이 없습니다. 먼저 npm run backup 을 실행하세요.'); return }
  console.log('사용 가능한 백업 파일 (최신순):\n')
  for (const f of files) {
    let info = ''
    try {
      const d = JSON.parse(fs.readFileSync(path.join(backupsDir, f), 'utf8'))
      const counts = TABLES.map(t => `${t.split('_')[0]} ${(d[t] || []).length}`).join(' / ')
      info = `  [${d._meta?.label || '?'}]  ${counts}`
    } catch (e) {}
    console.log(`  ${f}${info}`)
  }
  console.log('\n복구하려면: node scripts/restore.js <main|branch> backups/<파일명> --yes')
}

async function upsert(proj, table, rows) {
  if (!rows || rows.length === 0) return 0
  const res = await fetch(`${proj.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: proj.anonKey,
      Authorization: `Bearer ${proj.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`${table} 복구 실패: HTTP ${res.status} ${await res.text()}`)
  return rows.length
}

async function main() {
  const [key, file, flag] = process.argv.slice(2)

  if (!key) { listBackups(); return }
  const proj = PROJECTS[key]
  if (!proj) { console.error(`알 수 없는 대상: ${key} (main | branch)`); process.exit(1) }
  if (!file) { console.error('복구할 백업 파일 경로를 지정하세요.\n예) node scripts/restore.js main backups/main_....json --yes'); process.exit(1) }

  const filePath = path.isAbsolute(file) ? file : path.join(__dirname, '..', file)
  if (!fs.existsSync(filePath)) { console.error(`파일을 찾을 수 없습니다: ${filePath}`); process.exit(1) }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  // 지점 불일치 방지
  if (data._meta?.project && data._meta.project !== key) {
    console.error(`⚠ 이 백업은 "${data._meta.label}" 것인데 "${proj.label}"(으)로 복구하려 합니다. 중단합니다.`)
    console.error(`  올바른 대상: node scripts/restore.js ${data._meta.project} ${file} --yes`)
    process.exit(1)
  }

  console.log(`대상: ${proj.label}`)
  console.log(`백업: ${path.basename(filePath)} (${data._meta?.backedUpAt || '시각 미상'})`)
  for (const t of TABLES) console.log(`  - ${t}: ${(data[t] || []).length}건`)

  if (flag !== '--yes') {
    console.log('\n[미리보기] 실제로는 아무것도 바꾸지 않았습니다.')
    console.log('정말 복구하려면 맨 뒤에 --yes 를 붙여 다시 실행하세요.')
    return
  }

  console.log('\n복구 실행 중... (id가 같으면 덮어쓰고, 지워졌던 데이터는 되살립니다)')
  let total = 0
  for (const t of TABLES) {
    const n = await upsert(proj, t, data[t])
    total += n
    console.log(`  ✓ ${t}: ${n}건 반영`)
  }
  console.log(`\n✓ 복구 완료 — 총 ${total}건`)
}

main().catch((e) => { console.error(e); process.exit(1) })
