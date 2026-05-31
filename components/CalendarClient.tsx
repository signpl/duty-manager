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

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const pad = (n: number) => String(n).padStart(2, '0')

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
    const end = `${yr}-${pad(mo+1)}-${pad(new Date(yr,mo+1,0).getDate())}`
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

  const getSch = (d: string) => schedules.find(s => s.date === d) || null
  const getMember = (id: string | null) => id ? members.find(m => m.id === id) || null : null
  const getMemberIdx = (id: string | null) => {
    if (!id) return 0
    const idx = members.findIndex(m => m.id === id)
    return idx >= 0 ? idx : 0
  }

  const firstDay = new Date(yr, mo, 1).getDay()
  const lastDate = new Date(yr, mo+1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null)]
  for (let i = 1; i <= lastDate; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
  const userColor = getMemberColor(members.findIndex(m => m.name === userName))

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFA', colorScheme: 'light', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{
        background: '#fff',
        borderBottom: '2px solid #1a1a1a',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        {/* 타이틀 */}
        <div style={{
          maxWidth: 640, margin: '0 auto',
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={prevMo} style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1.5px solid #d1d5db', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: '#555',
            }}>‹</button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {yr}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {MONTHS_KO[mo]}
              </div>
            </div>

            <button onClick={nextMo} style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1.5px solid #d1d5db', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: '#555',
            }}>›</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(yr !== today.getFullYear() || mo !== today.getMonth()) && (
              <button
                onClick={() => { setYr(today.getFullYear()); setMo(today.getMonth()) }}
                style={{
                  fontSize: 11, fontWeight: 800, color: '#6366f1',
                  background: '#EEF2FF', border: 'none',
                  padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >TODAY</button>
            )}
            <Link href="/settings" style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1.5px solid #d1d5db', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B7280',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </Link>
            {userName && (
              <button onClick={() => setShowNameModal(true)} style={{
                width: 30, height: 30, borderRadius: '50%',
                background: userColor?.bg || '#6366f1',
                border: 'none', color: '#fff',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}>
                {userName[0]}
              </button>
            )}
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{
          maxWidth: 640, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderTop: '1px solid #1a1a1a',
        }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{
              padding: '6px 0',
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : '#374151',
              borderRight: i < 6 ? '1px solid #1a1a1a' : 'none',
            }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* ── 달력 그리드 ── */}
      <div style={{ flex: 1, maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          border: '2px solid #1a1a1a',
          borderTop: 'none',
          background: '#1a1a1a', // gap 색
          gap: '1px',
        }}>
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`e${idx}`} style={{ background: '#f0f0f0', minHeight: 88 }} />
            )

            const dateStr = `${yr}-${pad(mo+1)}-${pad(day)}`
            const sch = getSch(dateStr)
            const isToday = dateStr === todayStr
            const dow = (firstDay + day - 1) % 7
            const isSat = dow === 6
            const holiday = getHolidayName(dateStr)
            const isRed = isRedDay(dateStr, dow)
            const m1 = getMember(sch?.member1_id || null)
            const m2 = getMember(sch?.member2_id || null)
            const m1Color = getMemberColor(getMemberIdx(sch?.member1_id || null))
            const m2Color = getMemberColor(getMemberIdx(sch?.member2_id || null))

            // 셀 배경
            let bg = '#ffffff'
            if (sch?.is_off) bg = '#FFFBEB'
            else if (isToday) bg = '#F5F3FF'
            else if (isRed) bg = '#FFF5F5'
            else if (isSat) bg = '#F0F7FF'

            // 날짜 숫자 색
            const numColor = isToday ? '#fff' : isRed ? '#EF4444' : isSat ? '#3B82F6' : '#1F2937'

            return (
              <button
                key={dateStr}
                onClick={() => { if (!showNameModal) setSelectedDate(dateStr) }}
                style={{
                  minHeight: 88,
                  background: bg,
                  padding: '6px 5px 5px',
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                  gap: 2, border: 'none', cursor: 'pointer',
                  textAlign: 'left', position: 'relative',
                }}
              >
                {/* 날짜 숫자 */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                  <span style={{
                    width: 22, height: 22,
                    borderRadius: '50%',
                    background: isToday ? '#6366f1' : 'transparent',
                    color: numColor,
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {day}
                  </span>
                </div>

                {/* 공휴일 */}
                {holiday && (
                  <div style={{
                    fontSize: 8, fontWeight: 700, color: '#DC2626',
                    textAlign: 'center', lineHeight: 1.2, marginBottom: 1,
                  }}>
                    {holiday}
                  </div>
                )}

                {/* 휴무 */}
                {sch?.is_off && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: '#D97706',
                    textAlign: 'center',
                  }}>휴무</div>
                )}

                {/* 당번 이름 */}
                {!sch?.is_off && (
                  <>
                    {m1 && (
                      <div style={{
                        fontSize: 10, fontWeight: 700,
                        color: '#fff',
                        background: m1Color.bg,
                        borderRadius: 4,
                        padding: '2px 4px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {m1.name}
                      </div>
                    )}
                    {m2 && (
                      <div style={{
                        fontSize: 10, fontWeight: 700,
                        color: '#fff',
                        background: m2Color.bg,
                        borderRadius: 4,
                        padding: '2px 4px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {m2.name}
                      </div>
                    )}
                    {!m1 && !m2 && (
                      <div style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center' }}>·</div>
                    )}
                  </>
                )}

                {/* 메모 */}
                {sch?.note && (
                  <div style={{
                    fontSize: 8, color: '#9CA3AF',
                    textAlign: 'center', marginTop: 'auto',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {sch.note}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 범례 */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center',
          padding: '10px 16px',
          fontSize: 10, fontWeight: 600, color: '#9CA3AF',
          letterSpacing: '0.04em',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 2, display: 'inline-block' }} />
            공휴일·일요일
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: '#F0F7FF', border: '1px solid #93C5FD', borderRadius: 2, display: 'inline-block' }} />
            토요일
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 2, display: 'inline-block' }} />
            휴무
          </span>
        </div>
      </div>

      {selectedDate && !showNameModal && (
        <DayModal
          date={selectedDate}
          schedule={getSch(selectedDate)}
          members={members}
          onClose={() => setSelectedDate(null)}
          onSaved={fetchSchedules}
        />
      )}

      {showNameModal && (
        <NameModal
          currentName={userName}
          members={members}
          onSave={name => { localStorage.setItem('duty_user_name', name); setUserName(name); setShowNameModal(false) }}
          onClose={userName ? () => setShowNameModal(false) : undefined}
        />
      )}
    </div>
  )
}
