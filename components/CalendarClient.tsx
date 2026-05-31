'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import DayModal from './DayModal'

interface Member {
  id: string
  name: string
}

interface Schedule {
  id: string
  date: string
  member1_id: string | null
  member2_id: string | null
  is_off: boolean
  note: string | null
}

interface Props {
  user: User
  initialMembers: Member[]
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function CalendarClient({ user, initialMembers }: Props) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    setSchedules(data || [])
    setLoading(false)
  }, [currentYear, currentMonth])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchSchedules()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, async () => {
        const { data } = await supabase.from('team_members').select('*').order('name')
        setMembers(data || [])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchSchedules])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else setCurrentMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else setCurrentMonth(m => m + 1)
  }

  const getScheduleForDate = (dateStr: string) => {
    return schedules.find(s => s.date === dateStr)
  }

  const getMemberName = (id: string | null) => {
    if (!id) return null
    return members.find(m => m.id === id)?.name || null
  }

  // 달력 날짜 계산
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= lastDate; i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-bold text-gray-800">당번 관리</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
              ⚙️ 팀원 관리
            </Link>
            <div className="flex items-center gap-2">
              <img src={user.user_metadata?.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              <span className="text-sm text-gray-600 hidden sm:block">{user.user_metadata?.name || user.email}</span>
            </div>
            <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-xl">‹</button>
          <h2 className="text-2xl font-bold text-gray-800 min-w-[140px] text-center">
            {currentYear}년 {MONTH_NAMES[currentMonth]}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-xl">›</button>
        </div>

        {/* 범례 */}
        <div className="flex gap-3 justify-center mb-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-300 inline-block"></span> 당번 배정됨</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300 inline-block"></span> 미배정</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300 inline-block"></span> 휴무</span>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7">
            {DAY_NAMES.map((day, i) => (
              <div key={day} className={`py-3 text-center text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 border-t border-gray-100">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="min-h-[90px] border-b border-r border-gray-100 bg-gray-50/50" />

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const schedule = getScheduleForDate(dateStr)
              const isToday = dateStr === todayStr
              const dayOfWeek = (firstDay + day - 1) % 7
              const isSunday = dayOfWeek === 0
              const isSaturday = dayOfWeek === 6

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[90px] border-b border-r border-gray-100 p-2 cursor-pointer transition-all
                    ${schedule?.is_off ? 'bg-amber-50 hover:bg-amber-100' : schedule ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}
                    ${isToday ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-indigo-500 text-white' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {schedule?.is_off ? (
                    <div className="text-xs text-amber-600 font-medium">휴무</div>
                  ) : (
                    <div className="space-y-0.5">
                      {getMemberName(schedule?.member1_id || null) && (
                        <div className="text-xs text-indigo-700 font-medium truncate bg-indigo-100 rounded px-1 py-0.5">
                          {getMemberName(schedule?.member1_id || null)}
                        </div>
                      )}
                      {getMemberName(schedule?.member2_id || null) && (
                        <div className="text-xs text-indigo-700 font-medium truncate bg-indigo-100 rounded px-1 py-0.5">
                          {getMemberName(schedule?.member2_id || null)}
                        </div>
                      )}
                      {!schedule && (
                        <div className="text-xs text-gray-300">클릭하여 배정</div>
                      )}
                    </div>
                  )}
                  {schedule?.note && (
                    <div className="text-xs text-gray-400 mt-1 truncate">{schedule.note}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {loading && (
          <div className="text-center py-4 text-gray-400 text-sm">불러오는 중...</div>
        )}
      </main>

      {/* 날짜 클릭 모달 */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          schedule={getScheduleForDate(selectedDate) || null}
          members={members}
          onClose={() => setSelectedDate(null)}
          onSaved={fetchSchedules}
        />
      )}
    </div>
  )
}
