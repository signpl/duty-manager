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

const DAYS = ['일','월','화','수','목','금','토']
const pad = (n: number) => String(n).padStart(2,'0')

export default function CalendarClient() {
  const today = new Date()
  const [yr, setYr] = useState(today.getFullYear())
  const [mo, setMo] = useState(today.getMonth())
  const [members, setMembers] = useState<Member[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedDate, setSelectedDate] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string|null>(null)
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
      .on('postgres_changes',{event:'*',schema:'public',table:'schedules'}, fetchSchedules)
      .on('postgres_changes',{event:'*',schema:'public',table:'team_members'}, fetchMembers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSchedules, fetchMembers])

  const prevMo = () => { if(mo===0){setYr(y=>y-1);setMo(11)}else setMo(m=>m-1) }
  const nextMo = () => { if(mo===11){setYr(y=>y+1);setMo(0)}else setMo(m=>m+1) }

  const getSch = (d:string) => schedules.find(s=>s.date===d)||null
  const getName = (id:string|null) => id ? members.find(m=>m.id===id)?.name||null : null

  const firstDay = new Date(yr,mo,1).getDay()
  const lastDate = new Date(yr,mo+1,0).getDate()
  const cells:(number|null)[] = [...Array(firstDay).fill(null)]
  for(let i=1;i<=lastDate;i++) cells.push(i)
  while(cells.length%7!==0) cells.push(null)

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
  const isThisMonth = yr===today.getFullYear()&&mo===today.getMonth()

  return (
    <div className="min-h-screen" style={{background:'#f5f5f7'}}>
      {/* 헤더 */}
      <header style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}
        className="sticky top-0 z-20 border-b border-black/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
              {yr}년
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'][mo]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isThisMonth && (
              <button onClick={()=>{setYr(today.getFullYear());setMo(today.getMonth())}}
                className="text-xs text-indigo-600 font-semibold px-3 py-1.5 rounded-full bg-indigo-50 touch-manipulation">
                오늘
              </button>
            )}
            <Link href="/settings"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-gray-500">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </Link>
            {userName && (
              <button onClick={()=>setShowNameModal(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white touch-manipulation active:opacity-80"
                style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                {userName[0]}
              </button>
            )}
          </div>
        </div>
        {/* 월 탐색 */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2">
          <button onClick={prevMo}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200 text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMo}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200 text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-3">
        {/* 달력 카드 */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-black/5">
          {/* 요일 */}
          <div className="grid grid-cols-7 px-1 pt-3 pb-1">
            {DAYS.map((d,i)=>(
              <div key={d} className={`text-center text-[11px] font-semibold py-1
                ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>
            ))}
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-7 px-1 pb-2 gap-y-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} />

              const dateStr = `${yr}-${pad(mo+1)}-${pad(day)}`
              const sch = getSch(dateStr)
              const isToday = dateStr===todayStr
              const dow = (firstDay+day-1)%7
              const isSun = dow===0; const isSat = dow===6
              const m1 = getName(sch?.member1_id||null)
              const m2 = getName(sch?.member2_id||null)
              const hasAssigned = sch && !sch.is_off && (m1||m2)

              return (
                <button key={dateStr} onClick={()=>{
                  if(showNameModal) return // 이름 모달 열려있으면 무시
                  setSelectedDate(dateStr)
                }}
                  className="relative flex flex-col items-center py-1.5 px-0.5 rounded-2xl transition-all touch-manipulation active:scale-95 active:bg-gray-50 min-h-[64px]"
                >
                  {/* 날짜 숫자 */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold mb-1
                    ${isToday
                      ? 'text-white'
                      : isSun ? 'text-red-400'
                      : isSat ? 'text-blue-400'
                      : 'text-gray-800'}`}
                    style={isToday ? {background:'linear-gradient(135deg,#6366f1,#8b5cf6)'} : {}}>
                    {day}
                  </div>

                  {/* 당번 표시 */}
                  {sch?.is_off ? (
                    <span className="text-[9px] text-amber-500 font-semibold bg-amber-50 rounded-full px-1.5 py-0.5">휴무</span>
                  ) : (
                    <div className="w-full space-y-0.5">
                      {m1 && (
                        <div className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 rounded-full px-1 py-0.5 text-center truncate leading-tight">
                          {m1.length>3?m1.slice(0,2)+'…':m1}
                        </div>
                      )}
                      {m2 && (
                        <div className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 rounded-full px-1 py-0.5 text-center truncate leading-tight">
                          {m2.length>3?m2.slice(0,2)+'…':m2}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 하단 도트: 배정됨 표시 */}
                  {hasAssigned && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-300"/>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center mt-4">
            <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"/>
          </div>
        )}
      </main>

      {/* 날짜 모달 (이름 모달이 없을 때만) */}
      {selectedDate && !showNameModal && (
        <DayModal
          date={selectedDate}
          schedule={getSch(selectedDate)}
          members={members}
          onClose={()=>setSelectedDate(null)}
          onSaved={fetchSchedules}
        />
      )}

      {/* 이름 모달 */}
      {showNameModal && (
        <NameModal
          currentName={userName}
          members={members}
          onSave={name=>{localStorage.setItem('duty_user_name',name);setUserName(name);setShowNameModal(false)}}
          onClose={userName?()=>setShowNameModal(false):undefined}
        />
      )}
    </div>
  )
}
