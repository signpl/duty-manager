'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DayModal from './DayModal'
import NameModal from './NameModal'
import { getMemberColor } from '@/lib/colors'
import { getHolidayName, isRedDay } from '@/lib/holidays'
import EmojiPicker from './EmojiPicker'

interface Member { id: string; name: string; role: string }
interface Schedule {
  id: string; date: string
  member1_id: string|null; member2_id: string|null
  is_off: boolean; note: string|null
}

const DAYS_KO   = ['일','월','화','수','목','금','토']
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const pad = (n:number) => String(n).padStart(2,'0')

// 요일별 헤더 색 (일~토)
const HEADER_COLORS = [
  { bg:'#D94F4F', text:'#fff' }, // 일 — 레드
  { bg:'#3A3A3A', text:'#fff' }, // 월
  { bg:'#3A3A3A', text:'#fff' }, // 화
  { bg:'#3A3A3A', text:'#fff' }, // 수
  { bg:'#3A3A3A', text:'#fff' }, // 목
  { bg:'#3A3A3A', text:'#fff' }, // 금
  { bg:'#4A6FA5', text:'#fff' }, // 토 — 블루
]

// 셀 배경색
const CELL_BG   = '#E8E8E8'
const CELL_SUN  = '#FAE0E0'
const CELL_SAT  = '#DDE8FA'
const CELL_HOL  = '#FAE0E0'
const CELL_OFF  = '#FFF3CC'
const CELL_TODAY= '#EEE8FF'

export default function CalendarClient() {
  const today = new Date()
  const [yr, setYr]         = useState(today.getFullYear())
  const [mo, setMo]         = useState(today.getMonth())
  const [members, setMembers]   = useState<Member[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedDate, setSelectedDate] = useState<string|null>(null)
  const [loading, setLoading]   = useState(true)
  const [userName, setUserName] = useState<string|null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [userRole, setUserRole] = useState<string>('viewer')
  const [priorities, setPriorities] = useState('')
  const [notes, setNotes]           = useState('')
  const [emojiTarget, setEmojiTarget] = useState<'priorities'|'notes'|null>(null)
  const saveTimer   = useRef<ReturnType<typeof setTimeout>|null>(null)
  const scrollY     = useRef(0)
  const prioritiesRef = useRef<HTMLTextAreaElement|null>(null)
  const notesRef      = useRef<HTMLTextAreaElement|null>(null)

  const supabase = createClient()
  const monthKey = `${yr}-${pad(mo+1)}`

  useEffect(() => {
    const saved = localStorage.getItem('duty_user_name')
    if (saved) setUserName(saved); else setShowNameModal(true)
  }, [])

  // 멤버 로드 후 권한 계산
  useEffect(() => {
    if (!userName || members.length === 0) return
    const me = members.find(m => m.name === userName)
    setUserRole(me?.role ?? 'viewer')
  }, [userName, members])

  // 월별 메모 로드
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('monthly_notes').select('*').eq('year_month', monthKey).single()
      if (data) { setPriorities(data.priorities||''); setNotes(data.notes||'') }
      else       { setPriorities(''); setNotes('') }
    }
    load()
  }, [monthKey])

  // 메모 자동저장 (1.5초 debounce)
  const saveMemos = (p: string, n: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('monthly_notes').upsert(
        { year_month: monthKey, priorities: p, notes: n, updated_at: new Date().toISOString() },
        { onConflict: 'year_month' }
      )
    }, 1500)
  }

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setMembers(data||[])
  }, [])

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    const start = `${yr}-${pad(mo+1)}-01`
    const end   = `${yr}-${pad(mo+1)}-${pad(new Date(yr,mo+1,0).getDate())}`
    const { data } = await supabase.from('schedules').select('*').gte('date',start).lte('date',end)
    setSchedules(data||[])
    setLoading(false)
  }, [yr, mo])

  useEffect(() => { fetchMembers() },   [fetchMembers])
  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  useEffect(() => {
    const ch = supabase.channel('rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'schedules'},    fetchSchedules)
      .on('postgres_changes',{event:'*',schema:'public',table:'team_members'}, fetchMembers)
      .on('postgres_changes',{event:'*',schema:'public',table:'monthly_notes'},() => {
        supabase.from('monthly_notes').select('*').eq('year_month',monthKey).single()
          .then(({data}: {data: {priorities?: string; notes?: string} | null}) => { if(data){ setPriorities(data.priorities||''); setNotes(data.notes||'') } })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSchedules, fetchMembers, monthKey])

  const prevMo = () => { if(mo===0){setYr(y=>y-1);setMo(11)}else setMo(m=>m-1) }
  const nextMo = () => { if(mo===11){setYr(y=>y+1);setMo(0)}else setMo(m=>m+1) }

  const getSch       = (d:string) => schedules.find(s=>s.date===d)||null
  const getMember    = (id:string|null) => id ? members.find(m=>m.id===id)||null : null
  const getMemberIdx = (id:string|null) => { if(!id) return 0; const i=members.findIndex(m=>m.id===id); return i>=0?i:0 }

  const firstDay = new Date(yr,mo,1).getDay()
  const lastDate = new Date(yr,mo+1,0).getDate()
  const cells:(number|null)[] = [...Array(firstDay).fill(null)]
  for(let i=1;i<=lastDate;i++) cells.push(i)
  while(cells.length%7!==0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
  const userColor = getMemberColor(members.findIndex(m=>m.name===userName))
  const isAdmin = userRole === 'admin'
  const canEdit = userRole === 'admin' || userRole === 'editor'
  // 팀원이 아무도 없으면 초기 설정을 위해 설정 아이콘 노출
  const showSettings = isAdmin || members.length === 0

  return (
    <div style={{minHeight:'100dvh', background:'#F5F5F0', colorScheme:'light', display:'flex', flexDirection:'column'}}>

      {/* ── 헤더 ── */}
      <div style={{background:'#F5F5F0', position:'sticky', top:0, zIndex:20, paddingBottom:4}}>
        <div style={{maxWidth:640, margin:'0 auto', padding:'12px 14px 8px'}}>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
            {/* 타이틀 */}
            <div>
              {process.env.NEXT_PUBLIC_APP_NAME && (
                <div style={{fontSize:11, fontWeight:800, color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4}}>
                  {process.env.NEXT_PUBLIC_APP_NAME}
                </div>
              )}
              <div style={{fontSize:28, fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.03em', lineHeight:1.05}}>
                MONTHLY<br/>PLANNER
              </div>
            </div>
            {/* 우측 컨트롤 */}
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6}}>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                {!canEdit && userName && (
                  <span style={{fontSize:9, fontWeight:800, color:'#9CA3AF', background:'#E5E7EB', padding:'3px 8px', borderRadius:99, letterSpacing:'0.05em'}}>
                    🔒 읽기 전용
                  </span>
                )}
                {showSettings && (
                  <Link href="/settings" style={{
                    width:30, height:30, borderRadius:'50%', background:'#E0DDD5',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'#555',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </Link>
                )}
                {userName && (
                  <button onClick={()=>setShowNameModal(true)} style={{
                    width:30, height:30, borderRadius:'50%',
                    background:userColor?.bg||'#6366f1', border:'none',
                    color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer',
                  }}>{userName[0]}</button>
                )}
              </div>
              {/* 월 네비 */}
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <span style={{fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em'}}>{yr}</span>
                <button onClick={prevMo} style={{width:24,height:24,borderRadius:'50%',background:'#E0DDD5',border:'none',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#555'}}>‹</button>
                <span style={{fontSize:17, fontWeight:900, color:'#1a1a1a', minWidth:36, textAlign:'center'}}>{MONTHS_KO[mo]}</span>
                <button onClick={nextMo} style={{width:24,height:24,borderRadius:'50%',background:'#E0DDD5',border:'none',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#555'}}>›</button>
                {(yr!==today.getFullYear()||mo!==today.getMonth())&&(
                  <button onClick={()=>{setYr(today.getFullYear());setMo(today.getMonth())}} style={{fontSize:10,fontWeight:800,color:'#fff',background:'#1a1a1a',border:'none',padding:'3px 9px',borderRadius:99,cursor:'pointer'}}>TODAY</button>
                )}
              </div>
            </div>
          </div>

          {/* ── 요일 헤더 (둥근 pill) ── */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginTop:10}}>
            {DAYS_KO.map((d,i)=>(
              <div key={d} style={{
                background: HEADER_COLORS[i].bg,
                color: HEADER_COLORS[i].text,
                borderRadius:99, padding:'5px 0',
                textAlign:'center', fontSize:11, fontWeight:800,
                letterSpacing:'0.04em',
              }}>{d}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 달력 그리드 ── */}
      <div style={{maxWidth:640, margin:'0 auto', width:'100%', padding:'4px 14px 0'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3}}>
          {cells.map((day,idx)=>{
            if(!day) return <div key={`e${idx}`} style={{minHeight:82, borderRadius:10, background:'#DDDDD8'}}/>

            const dateStr = `${yr}-${pad(mo+1)}-${pad(day)}`
            const sch     = getSch(dateStr)
            const isToday = dateStr===todayStr
            const dow     = (firstDay+day-1)%7
            const isSun   = dow===0; const isSat=dow===6
            const holiday = getHolidayName(dateStr)
            const isRed   = isRedDay(dateStr,dow)
            const m1      = getMember(sch?.member1_id||null)
            const m2      = getMember(sch?.member2_id||null)
            const m1c     = getMemberColor(getMemberIdx(sch?.member1_id||null))
            const m2c     = getMemberColor(getMemberIdx(sch?.member2_id||null))

            let cellBg = CELL_BG
            if(sch?.is_off)    cellBg=CELL_OFF
            else if(isToday)   cellBg=CELL_TODAY
            else if(isRed)     cellBg=CELL_SUN
            else if(isSat)     cellBg=CELL_SAT

            const numColor = isToday?'#fff' : isRed?'#C0392B' : isSat?'#2563EB' : '#1F2937'

            return (
              <button key={dateStr}
                onClick={()=>{
                  if(!showNameModal && canEdit) {
                    scrollY.current = window.scrollY
                    setSelectedDate(dateStr)
                  }
                }}
                style={{
                  minHeight:82, background:cellBg, borderRadius:10,
                  padding:'5px 5px 4px', display:'flex', flexDirection:'column',
                  gap:2, border:'none', cursor: canEdit ? 'pointer' : 'default',
                  textAlign:'left', position:'relative', outline:'none',
                  boxShadow: isToday ? '0 0 0 2px #6366f1' : 'none',
                }}
              >
                {/* 날짜 + 작은 핀 원 */}
                <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
                  <span style={{
                    width:20, height:20, borderRadius:'50%',
                    background: isToday?'#6366f1':'transparent',
                    color:numColor, fontSize:11, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{day}</span>
                  <span style={{
                    width:8, height:8, borderRadius:'50%',
                    background: isToday?'#6366f1' : isRed?'#E8A0A0' : isSat?'#90B4D8' : '#BBBBBB',
                    flexShrink:0, marginTop:2,
                  }}/>
                </div>

                {/* 공휴일 */}
                {holiday&&(
                  <div style={{fontSize:8, fontWeight:700, color:'#C0392B', lineHeight:1.2, textAlign:'center'}}>
                    {holiday}
                  </div>
                )}

                {/* 휴무 */}
                {sch?.is_off&&(
                  <div style={{fontSize:9, fontWeight:800, color:'#B7791F', textAlign:'center'}}>휴무</div>
                )}

                {/* 당번 */}
                {!sch?.is_off&&(
                  <div style={{display:'flex', flexDirection:'column', gap:1.5}}>
                    {m1&&<div style={{fontSize:9, fontWeight:800, color:'#fff', background:m1c.bg, borderRadius:3, padding:'1.5px 3px', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m1.name}</div>}
                    {m2&&<div style={{fontSize:9, fontWeight:800, color:'#fff', background:m2c.bg, borderRadius:3, padding:'1.5px 3px', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m2.name}</div>}
                  </div>
                )}

                {/* 메모 — 명확하게 */}
                {sch?.note&&(
                  <div style={{
                    fontSize:8, fontWeight:600, color:'#4B5563',
                    background:'rgba(255,255,255,0.7)',
                    borderRadius:3, padding:'1px 3px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    marginTop:'auto',
                  }}>{sch.note}</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PRIORITIES & NOTES ── */}
      <div style={{maxWidth:640, margin:'0 auto', width:'100%', padding:'12px 14px 32px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>

          {/* PRIORITIES */}
          <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #D1D5DB', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 10px 0' }}>
              <div style={{ border:'1.5px solid #D1D5DB', borderRadius:99, padding:'3px 10px', fontSize:10, fontWeight:800, color:'#374151', letterSpacing:'0.1em' }}>PRIORITIES</div>
              {canEdit && <button onClick={()=>setEmojiTarget('priorities')} style={{ fontSize:16, background:'none', border:'none', cursor:'pointer', opacity:0.6, lineHeight:1, padding:2 }}>😊</button>}
            </div>
            <div style={{ position:'relative', flex:1, padding:'6px 12px 10px' }}>
              {[0,1,2,3,4,5].map(i=>(
                <div key={i} style={{ position:'absolute', left:12, right:12, top:`${28+i*27}px`, borderBottom:'1px solid #E5E7EB' }}/>
              ))}
              <textarea
                ref={prioritiesRef}
                value={priorities}
                readOnly={!canEdit}
                onChange={e=>{ if(canEdit){ setPriorities(e.target.value); saveMemos(e.target.value,notes) } }}
                placeholder={canEdit ? '• \n• \n• \n• \n• ' : ''}
                style={{ width:'100%', height:185, background:'transparent', border:'none', outline:'none', resize:'none', fontSize:12, color:'#374151', lineHeight:'27px', fontFamily:'inherit', position:'relative', zIndex:1, cursor: canEdit ? 'text' : 'default' }}
              />
            </div>
          </div>

          {/* NOTES */}
          <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #D1D5DB', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 10px 0' }}>
              <div style={{ border:'1.5px solid #D1D5DB', borderRadius:99, padding:'3px 10px', fontSize:10, fontWeight:800, color:'#374151', letterSpacing:'0.1em' }}>NOTES</div>
              {canEdit && <button onClick={()=>setEmojiTarget('notes')} style={{ fontSize:16, background:'none', border:'none', cursor:'pointer', opacity:0.6, lineHeight:1, padding:2 }}>😊</button>}
            </div>
            <div style={{ padding:'6px 12px 10px', flex:1 }}>
              <textarea
                ref={notesRef}
                value={notes}
                readOnly={!canEdit}
                onChange={e=>{ if(canEdit){ setNotes(e.target.value); saveMemos(priorities,e.target.value) } }}
                placeholder={canEdit ? '메모를 입력하세요...' : ''}
                style={{ width:'100%', height:185, background:'#F3F4F6', border:'none', outline:'none', borderRadius:8, resize:'none', fontSize:12, color:'#374151', padding:'10px', lineHeight:1.6, fontFamily:'inherit', boxSizing:'border-box', cursor: canEdit ? 'text' : 'default' }}
              />
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div style={{display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:10, fontSize:9, fontWeight:700, color:'#9CA3AF'}}>
          {[{color:CELL_SUN,label:'공휴일·일요일'},{color:CELL_SAT,label:'토요일'},{color:CELL_OFF,label:'휴무'}].map(({color,label})=>(
            <span key={label} style={{display:'flex', alignItems:'center', gap:3}}>
              <span style={{width:10,height:10,background:color,border:'1px solid #ccc',borderRadius:2,display:'inline-block'}}/>
              {label}
            </span>
          ))}
        </div>
      </div>

      {selectedDate&&!showNameModal&&(
        <DayModal date={selectedDate} schedule={getSch(selectedDate)} members={members}
          canEdit={canEdit}
          onClose={()=>{
            setSelectedDate(null)
            setTimeout(()=>window.scrollTo({ top:scrollY.current, behavior:'instant' }), 30)
          }}
          onSaved={()=>{
            fetchSchedules()
            setTimeout(()=>window.scrollTo({ top:scrollY.current, behavior:'instant' }), 50)
          }}/>
      )}
      {showNameModal&&(
        <NameModal currentName={userName} members={members}
          onSave={name=>{localStorage.setItem('duty_user_name',name);setUserName(name);setShowNameModal(false)}}
          onClose={userName?()=>setShowNameModal(false):undefined}/>
      )}

      {/* 이모지 피커 — PRIORITIES / NOTES 용 */}
      {emojiTarget && canEdit && (
        <EmojiPicker
          onSelect={emoji => {
            if (emojiTarget === 'priorities') {
              const next = priorities + emoji + ' '
              setPriorities(next); saveMemos(next, notes)
              setTimeout(() => prioritiesRef.current?.focus(), 30)
            } else {
              const next = notes + emoji + ' '
              setNotes(next); saveMemos(priorities, next)
              setTimeout(() => notesRef.current?.focus(), 30)
            }
          }}
          onClose={() => setEmojiTarget(null)}
        />
      )}
    </div>
  )
}
