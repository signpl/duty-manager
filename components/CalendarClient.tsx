'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DayModal from './DayModal'
import NameModal from './NameModal'
import { getMemberColor } from '@/lib/colors'
import { getHolidayName, isRedDay } from '@/lib/holidays'

interface Member { id: string; name: string }
interface Schedule {
  id: string; date: string
  member1_id: string | null; member2_id: string | null
  is_off: boolean; note: string | null
}

// 요일별 파스텔 컬러 (일~토)
const DAY_COLORS = [
  { bg: '#FFFFFF', text: '#1F2937' }, // 일
  { bg: '#B8E4B0', text: '#1F2937' }, // 월 - 민트 그린
  { bg: '#C9BBF0', text: '#1F2937' }, // 화 - 라벤더
  { bg: '#F5C9A0', text: '#1F2937' }, // 수 - 피치
  { bg: '#F4A8B8', text: '#1F2937' }, // 목 - 핑크
  { bg: '#F7E48A', text: '#1F2937' }, // 금 - 옐로우
  { bg: '#A8D8F0', text: '#1F2937' }, // 토 - 스카이블루
]

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const pad = (n: number) => String(n).padStart(2, '0')
const BG = '#F0EBE1'  // 크림 베이지 배경
const BORDER = '#333333'

export default function CalendarClient() {
  const today = new Date()
  const [yr, setYr] = useState(today.getFullYear())
  const [mo, setMo] = useState(today.getMonth())
  const [members, setMembers] = useState<Member[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('duty_user_name')
    if (saved) setUserName(saved)
    else setShowNameModal(true)
  }, [])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setMembers(data || [])
  }, [])

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    const start = `${yr}-${pad(mo+1)}-01`
    const end   = `${yr}-${pad(mo+1)}-${pad(new Date(yr,mo+1,0).getDate())}`
    const { data } = await supabase.from('schedules').select('*').gte('date',start).lte('date',end)
    setSchedules(data || [])
    setLoading(false)
  }, [yr, mo])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  useEffect(() => {
    const ch = supabase.channel('rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'schedules'},fetchSchedules)
      .on('postgres_changes',{event:'*',schema:'public',table:'team_members'},fetchMembers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSchedules, fetchMembers])

  const prevMo = () => { if(mo===0){setYr(y=>y-1);setMo(11)}else setMo(m=>m-1) }
  const nextMo = () => { if(mo===11){setYr(y=>y+1);setMo(0)}else setMo(m=>m+1) }

  const getSch   = (d: string) => schedules.find(s => s.date === d) || null
  const getMember = (id: string|null) => id ? members.find(m=>m.id===id)||null : null
  const getMemberIdx = (id: string|null) => {
    if (!id) return 0
    const idx = members.findIndex(m=>m.id===id)
    return idx >= 0 ? idx : 0
  }

  const firstDay = new Date(yr,mo,1).getDay()
  const lastDate  = new Date(yr,mo+1,0).getDate()
  const cells: (number|null)[] = [...Array(firstDay).fill(null)]
  for (let i=1;i<=lastDate;i++) cells.push(i)
  while (cells.length%7!==0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
  const userColor = getMemberColor(members.findIndex(m=>m.name===userName))

  return (
    <div style={{ minHeight:'100dvh', background:BG, colorScheme:'light', display:'flex', flexDirection:'column' }}>

      {/* ── 헤더 ── */}
      <div style={{ background:BG, position:'sticky', top:0, zIndex:20 }}>
        <div style={{ maxWidth:640, margin:'0 auto', padding:'12px 14px 0' }}>

          {/* 타이틀 + 우측 아이콘 */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', lineHeight:1.05, letterSpacing:'-0.03em' }}>
                MONTHLY<br/>PLANNER
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
              <div style={{ display:'flex', gap:6 }}>
                <Link href="/settings" style={{
                  width:30, height:30, borderRadius:'50%',
                  background:'#e8e0d4', border:'none',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'#555',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </Link>
                {userName && (
                  <button onClick={()=>setShowNameModal(true)} style={{
                    width:30, height:30, borderRadius:'50%',
                    background: userColor?.bg||'#6366f1',
                    border:'none', color:'#fff',
                    fontSize:12, fontWeight:800, cursor:'pointer',
                  }}>
                    {userName[0]}
                  </button>
                )}
              </div>
              {/* 년도 + 월 선택 */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em' }}>{yr}</span>
                <button onClick={prevMo} style={{
                  width:24, height:24, borderRadius:'50%',
                  background:'#e8e0d4', border:'none',
                  fontSize:14, cursor:'pointer', color:'#555',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>‹</button>
                <span style={{ fontSize:16, fontWeight:800, color:'#1a1a1a', minWidth:32, textAlign:'center' }}>
                  {MONTHS_KO[mo]}
                </span>
                <button onClick={nextMo} style={{
                  width:24, height:24, borderRadius:'50%',
                  background:'#e8e0d4', border:'none',
                  fontSize:14, cursor:'pointer', color:'#555',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>›</button>
                {(yr!==today.getFullYear()||mo!==today.getMonth()) && (
                  <button onClick={()=>{setYr(today.getFullYear());setMo(today.getMonth())}} style={{
                    fontSize:10, fontWeight:800, color:'#6366f1',
                    background:'rgba(99,102,241,0.12)', border:'none',
                    padding:'3px 8px', borderRadius:99, cursor:'pointer',
                  }}>TODAY</button>
                )}
              </div>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(7,1fr)',
            border:`1.5px solid ${BORDER}`,
            borderBottom:'none',
            borderRadius:'6px 6px 0 0',
            overflow:'hidden',
          }}>
            {DAYS_KO.map((d,i)=>(
              <div key={d} style={{
                background: DAY_COLORS[i].bg,
                color: DAY_COLORS[i].text,
                padding:'6px 0',
                textAlign:'center',
                fontSize:11, fontWeight:800,
                letterSpacing:'0.04em',
                borderRight: i<6 ? `1px solid ${BORDER}` : 'none',
              }}>
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 달력 그리드 ── */}
      <div style={{ flex:1, maxWidth:640, margin:'0 auto', width:'100%', padding:'0 14px 16px' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(7,1fr)',
          border:`1.5px solid ${BORDER}`,
          borderTop:'none',
          borderRadius:'0 0 6px 6px',
          overflow:'hidden',
          background: BORDER,
          gap:'1px',
        }}>
          {cells.map((day,idx)=>{
            if (!day) return (
              <div key={`e${idx}`} style={{ background:'#EAE4D8', minHeight:82 }} />
            )

            const dateStr  = `${yr}-${pad(mo+1)}-${pad(day)}`
            const sch      = getSch(dateStr)
            const isToday  = dateStr===todayStr
            const dow      = (firstDay+day-1)%7
            const holiday  = getHolidayName(dateStr)
            const isRed    = isRedDay(dateStr,dow)
            const m1       = getMember(sch?.member1_id||null)
            const m2       = getMember(sch?.member2_id||null)
            const m1c      = getMemberColor(getMemberIdx(sch?.member1_id||null))
            const m2c      = getMemberColor(getMemberIdx(sch?.member2_id||null))

            // 요일별 베이스 배경 (파스텔 연하게)
            const dayBg    = DAY_COLORS[dow].bg
            let cellBg     = dayBg === '#FFFFFF' ? '#fafafa' : dayBg + 'AA'
            if (sch?.is_off) cellBg = '#FFF8E1'
            if (isToday)     cellBg = dayBg === '#FFFFFF' ? '#F0EEFF' : dayBg + 'DD'

            return (
              <button
                key={dateStr}
                onClick={()=>{ if(!showNameModal) setSelectedDate(dateStr) }}
                style={{
                  minHeight:82,
                  background:cellBg,
                  padding:'5px 4px 4px',
                  display:'flex', flexDirection:'column', alignItems:'stretch',
                  gap:2, border:'none', cursor:'pointer', textAlign:'left',
                  outline: isToday ? '2.5px solid #6366f1' : 'none',
                  outlineOffset: isToday ? '-2.5px' : undefined,
                  position:'relative',
                }}
              >
                {/* 날짜 숫자 */}
                <div style={{ display:'flex', justifyContent:'center', marginBottom:1 }}>
                  <span style={{
                    width:20, height:20, borderRadius:'50%',
                    background: isToday ? '#6366f1' : 'transparent',
                    color: isToday ? '#fff' : isRed ? '#EF4444' : '#1F2937',
                    fontSize:11, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {day}
                  </span>
                </div>

                {/* 공휴일 */}
                {holiday && (
                  <div style={{ fontSize:8, fontWeight:700, color:'#DC2626', textAlign:'center', lineHeight:1.2 }}>
                    {holiday}
                  </div>
                )}

                {/* 휴무 */}
                {sch?.is_off && (
                  <div style={{ fontSize:9, fontWeight:800, color:'#D97706', textAlign:'center' }}>
                    휴무
                  </div>
                )}

                {/* 당번 */}
                {!sch?.is_off && (
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {m1 && (
                      <div style={{
                        fontSize:9, fontWeight:800, color:'#fff',
                        background:m1c.bg, borderRadius:3,
                        padding:'2px 3px', textAlign:'center',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{m1.name}</div>
                    )}
                    {m2 && (
                      <div style={{
                        fontSize:9, fontWeight:800, color:'#fff',
                        background:m2c.bg, borderRadius:3,
                        padding:'2px 3px', textAlign:'center',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{m2.name}</div>
                    )}
                  </div>
                )}

                {/* 메모 */}
                {sch?.note && (
                  <div style={{
                    fontSize:7, color:'#9CA3AF', textAlign:'center',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    marginTop:'auto',
                  }}>{sch.note}</div>
                )}
              </button>
            )
          })}
        </div>

        {/* 범례 */}
        <div style={{
          display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap',
          padding:'10px 0 4px',
          fontSize:9, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.04em',
        }}>
          {[
            { color:'#FEE2E2', label:'공휴일·일요일' },
            { color:'#DBEAFE', label:'토요일' },
            { color:'#FFF8E1', label:'휴무' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, background:color, border:'1px solid #ccc', borderRadius:2, display:'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {selectedDate && !showNameModal && (
        <DayModal
          date={selectedDate}
          schedule={getSch(selectedDate)}
          members={members}
          onClose={()=>setSelectedDate(null)}
          onSaved={fetchSchedules}
        />
      )}
      {showNameModal && (
        <NameModal
          currentName={userName}
          members={members}
          onSave={name=>{ localStorage.setItem('duty_user_name',name); setUserName(name); setShowNameModal(false) }}
          onClose={userName?()=>setShowNameModal(false):undefined}
        />
      )}
    </div>
  )
}
