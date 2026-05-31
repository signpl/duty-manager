'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DayModal from './DayModal'
import NameModal from './NameModal'

interface Member { id: string; name: string }
interface Schedule {
  id: string; date: string
  member1_id: string | null; member2_id: string | null
  is_off: boolean; note: string | null
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function CalendarClient() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
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
    const { data } = await supabase.from('team_members').select('*').order('name')
    setMembers(data || [])
  }, [])

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${year}-${pad(month + 1)}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`
    const { data } = await supabase.from('schedules').select('*').gte('date', start).lte('date', end)
    setSchedules(data || [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  useEffect(() => {
    const ch = supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, fetchSchedules)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, fetchMembers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSchedules, fetchMembers])

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0) } else setMonth(m => m+1) }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const getSchedule = (d: string) => schedules.find(s => s.date === d) || null
  const getName = (id: string | null) => id ? (members.find(m => m.id === id)?.name || null) : null
  // 이름 축약: 3글자 이상이면 2글자까지만
  const shortName = (name: string | null) => {
    if (!name) return null
    return name.length > 3 ? name.slice(0, 2) + '…' : name
  }

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= lastDate; i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)

  const pad = (n: number) => String(n).padStart(2, '0')
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">📋</span>
            <h1 className="text-base font-bold text-gray-800">당번 관리</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings"
              className="text-xs text-indigo-600 font-medium px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1">
              <span>⚙️</span><span className="hidden sm:inline">팀원 관리</span>
            </Link>
            {userName && (
              <button onClick={() => setShowNameModal(true)}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {userName[0]}
                </span>
                <span className="text-xs text-gray-700 font-medium max-w-[60px] truncate hidden sm:block">{userName}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-2 py-3">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={prevMonth}
            className="w-9 h-9 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center text-gray-500 text-xl font-light touch-manipulation">
            ‹
          </button>
          <div className="text-center">
            <button onClick={goToday}
              className="text-lg font-bold text-gray-800 active:text-indigo-600 transition-colors touch-manipulation">
              {year}년 {MONTH_NAMES[month]}
            </button>
            {(year !== today.getFullYear() || month !== today.getMonth()) && (
              <div className="text-xs text-indigo-500 -mt-0.5" onClick={goToday}>오늘로</div>
            )}
          </div>
          <button onClick={nextMonth}
            className="w-9 h-9 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center text-gray-500 text-xl font-light touch-manipulation">
            ›
          </button>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-semibold
                ${i===0 ? 'text-red-400' : i===6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              if (!day) return (
                <div key={`e-${idx}`} className="min-h-[72px] sm:min-h-[90px] border-b border-r border-gray-50 bg-gray-50/30" />
              )

              const dateStr = `${year}-${pad(month+1)}-${pad(day)}`
              const sch = getSchedule(dateStr)
              const isToday = dateStr === todayStr
              const dow = (firstDay + day - 1) % 7
              const isSun = dow === 0; const isSat = dow === 6
              const m1 = getName(sch?.member1_id || null)
              const m2 = getName(sch?.member2_id || null)
              const hasAssigned = sch && !sch.is_off && (m1 || m2)

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[72px] sm:min-h-[90px] border-b border-r border-gray-50 p-1 sm:p-1.5
                    text-left transition-all active:scale-95 touch-manipulation w-full
                    ${sch?.is_off ? 'bg-amber-50 active:bg-amber-100' : hasAssigned ? 'bg-indigo-50 active:bg-indigo-100' : 'bg-white active:bg-gray-50'}
                    ${isToday ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
                >
                  {/* 날짜 숫자 */}
                  <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto
                    ${isToday ? 'bg-indigo-500 text-white' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-700'}`}>
                    {day}
                  </div>

                  {/* 당번 표시 */}
                  {sch?.is_off ? (
                    <div className="text-[10px] text-amber-500 font-medium text-center">휴무</div>
                  ) : (
                    <div className="space-y-0.5">
                      {m1 && (
                        <div className="text-[10px] sm:text-xs text-indigo-700 font-medium truncate bg-indigo-100 rounded px-1 py-0.5 text-center leading-tight">
                          <span className="sm:hidden">{shortName(m1)}</span>
                          <span className="hidden sm:inline">{m1}</span>
                        </div>
                      )}
                      {m2 && (
                        <div className="text-[10px] sm:text-xs text-indigo-700 font-medium truncate bg-indigo-100 rounded px-1 py-0.5 text-center leading-tight">
                          <span className="sm:hidden">{shortName(m2)}</span>
                          <span className="hidden sm:inline">{m2}</span>
                        </div>
                      )}
                      {!hasAssigned && (
                        <div className="text-[9px] text-gray-300 text-center mt-1">+</div>
                      )}
                    </div>
                  )}
                  {sch?.note && (
                    <div className="text-[9px] text-gray-400 truncate text-center mt-0.5">{sch.note}</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading && <p className="text-center text-gray-400 text-xs mt-3">불러오는 중…</p>}

        {/* 하단 범례 */}
        <div className="flex gap-3 justify-center mt-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 border border-indigo-200 inline-block"/>당번
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-200 inline-block"/>휴무
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-white border border-gray-200 inline-block"/>미배정
          </span>
        </div>
      </main>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          schedule={getSchedule(selectedDate)}
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
