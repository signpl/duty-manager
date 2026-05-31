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

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
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
    const start = `${yr}-${pad(mo + 1)}-01`
    const end = `${yr}-${pad(mo + 1)}-${pad(new Date(yr, mo + 1, 0).getDate())}`
    const { data } = await supabase.from('schedules').select('*').gte('date', start).lte('date', end)
    setSchedules(data || [])
    setLoading(false)
  }, [yr, mo])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  useEffect(() => {
    const ch = supabase.channel('rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, fetchSchedules)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, fetchMembers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSchedules, fetchMembers])

  const prevMo = () => { if (mo === 0) { setYr(y => y - 1); setMo(11) } else setMo(m => m - 1) }
  const nextMo = () => { if (mo === 11) { setYr(y => y + 1); setMo(0) } else setMo(m => m + 1) }

  const getSch = (d: string) => schedules.find(s => s.date === d) || null
  const getMember = (id: string | null) => id ? members.find(m => m.id === id) || null : null
  const getMemberIdx = (id: string | null) => {
    if (!id) return 0
    const idx = members.findIndex(m => m.id === id)
    return idx >= 0 ? idx : 0
  }

  const firstDay = new Date(yr, mo, 1).getDay()
  const lastDate = new Date(yr, mo + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null)]
  for (let i = 1; i <= lastDate; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const userColor = getMemberColor(members.findIndex(m => m.name === userName))

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-20 border-b border-gray-100">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={prevMo}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 min-w-[80px] text-center">
              {yr !== today.getFullYear() ? `${yr}. ` : ''}{MONTHS[mo]}
            </h1>
            <button onClick={nextMo}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(yr !== today.getFullYear() || mo !== today.getMonth()) && (
              <button onClick={() => { setYr(today.getFullYear()); setMo(today.getMonth()) }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full touch-manipulation"
                style={{ background: '#EEF2FF', color: '#6366f1' }}>
                오늘
              </button>
            )}
            <Link href="/settings"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </Link>
            {userName && (
              <button onClick={() => setShowNameModal(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white touch-manipulation"
                style={{ background: userColor?.bg || '#6366f1' }}>
                {userName[0]}
              </button>
            )}
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 max-w-lg mx-auto">
          {DAYS.map((d, i) => (
            <div key={d} className={`py-1.5 text-center text-[11px] font-bold
              ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>
      </header>

      {/* 달력 그리드 */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-7 border-l border-t border-gray-100">
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`e${idx}`} className="min-h-[90px] border-r border-b border-gray-100 bg-gray-50/30" />
            )

            const dateStr = `${yr}-${pad(mo + 1)}-${pad(day)}`
            const sch = getSch(dateStr)
            const isToday = dateStr === todayStr
            const dow = (firstDay + day - 1) % 7
            const isSat = dow === 6
            const holiday = getHolidayName(dateStr)
            const isRed = isRedDay(dateStr, dow) // 일요일 또는 공휴일

            const m1 = getMember(sch?.member1_id || null)
            const m2 = getMember(sch?.member2_id || null)
            const m1Color = getMemberColor(getMemberIdx(sch?.member1_id || null))
            const m2Color = getMemberColor(getMemberIdx(sch?.member2_id || null))

            // 셀 배경색
            let cellBg = 'white'
            if (sch?.is_off) cellBg = '#FFFBEB'
            else if (isToday) cellBg = '#F5F3FF'
            else if (isRed) cellBg = '#FFF8F8'
            else if (isSat) cellBg = '#F5F8FF'

            return (
              <button
                key={dateStr}
                onClick={() => { if (!showNameModal) setSelectedDate(dateStr) }}
                className="min-h-[90px] p-1 text-left flex flex-col gap-0.5 touch-manipulation active:brightness-95 transition-all border-r border-b border-gray-100 w-full"
                style={{ background: cellBg }}
              >
                {/* 날짜 숫자 */}
                <div className="flex justify-center">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold
                    ${isToday ? 'text-white' : isRed ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-800'}`}
                    style={isToday ? { background: '#6366f1' } : {}}>
                    {day}
                  </span>
                </div>

                {/* 공휴일 이름 */}
                {holiday && (
                  <div className="text-[8px] font-bold text-red-400 text-center w-full leading-tight truncate">
                    {holiday}
                  </div>
                )}

                {/* 당번 / 휴무 */}
                {sch?.is_off ? (
                  <div className="text-[10px] font-bold text-amber-500 text-center w-full mt-0.5">😴 휴무</div>
                ) : (
                  <div className="space-y-0.5 w-full mt-0.5">
                    {m1 && (
                      <div className="rounded-md px-1 py-0.5 text-[10px] font-bold w-full text-center truncate leading-tight"
                        style={{ background: m1Color.bg, color: '#fff' }}>
                        {m1.name}
                      </div>
                    )}
                    {m2 && (
                      <div className="rounded-md px-1 py-0.5 text-[10px] font-bold w-full text-center truncate leading-tight"
                        style={{ background: m2Color.bg, color: '#fff' }}>
                        {m2.name}
                      </div>
                    )}
                    {!m1 && !m2 && (
                      <div className="text-[10px] text-gray-200 text-center w-full">+</div>
                    )}
                  </div>
                )}

                {/* 메모 */}
                {sch?.note && (
                  <div className="text-[9px] text-gray-400 w-full truncate text-center leading-tight">
                    {sch.note}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="max-w-lg mx-auto w-full px-4 py-3 flex gap-4 justify-center border-t border-gray-50">
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200 inline-block"/>공휴일·일요일
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <span className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200 inline-block"/>토요일
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block"/>휴무
        </span>
      </div>

      {loading && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm">
          불러오는 중…
        </div>
      )}

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
