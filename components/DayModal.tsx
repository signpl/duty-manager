'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member { id:string; name:string }
interface Schedule { id:string; date:string; member1_id:string|null; member2_id:string|null; is_off:boolean; note:string|null }
interface Props { date:string; schedule:Schedule|null; members:Member[]; onClose:()=>void; onSaved:()=>void }

const DAYS = ['일','월','화','수','목','금','토']

export default function DayModal({date,schedule,members,onClose,onSaved}:Props) {
  const [m1, setM1] = useState(schedule?.member1_id||'')
  const [m2, setM2] = useState(schedule?.member2_id||'')
  const [isOff, setIsOff] = useState(schedule?.is_off||false)
  const [note, setNote] = useState(schedule?.note||'')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const [y,mo,d] = date.split('-').map(Number)
  const dow = new Date(y,mo-1,d).getDay()
  const displayDate = `${mo}월 ${d}일 (${DAYS[dow]})`

  const save = async () => {
    setSaving(true)
    const payload = { date, member1_id:isOff?null:(m1||null), member2_id:isOff?null:(m2||null), is_off:isOff, note:note.trim()||null }
    if(schedule) await supabase.from('schedules').update(payload).eq('id',schedule.id)
    else await supabase.from('schedules').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const del = async () => {
    if(!schedule) return
    await supabase.from('schedules').delete().eq('id',schedule.id)
    onSaved(); onClose()
  }

  const avail1 = members.filter(x=>!m2||x.id!==m2)
  const avail2 = members.filter(x=>!m1||x.id!==m1)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      {/* 딤 */}
      <div className="absolute inset-0 bg-black/30 fade-in backdrop-blur-[2px]"/>

      {/* 바텀시트 */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl slide-up max-h-[90vh] flex flex-col"
        onClick={e=>e.stopPropagation()}>

        {/* 핸들 */}
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200"/>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-8">
          {/* 날짜 & 액션 */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-gray-400 font-medium">{y}년</p>
              <h3 className="text-2xl font-bold text-gray-900">{displayDate}</h3>
            </div>
            {schedule && (
              <button onClick={del}
                className="mt-1 text-xs text-red-400 bg-red-50 px-3 py-1.5 rounded-full font-medium touch-manipulation active:bg-red-100">
                삭제
              </button>
            )}
          </div>

          {/* 휴무 토글 */}
          <button onClick={()=>setIsOff(!isOff)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl mb-4 transition-all touch-manipulation border-2
              ${isOff?'bg-amber-50 border-amber-200':'bg-gray-50 border-transparent'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg
                ${isOff?'bg-amber-100':'bg-gray-100'}`}>
                {isOff?'😴':'📅'}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">휴무일</p>
                <p className="text-xs text-gray-400">당번 없이 쉬는 날</p>
              </div>
            </div>
            {/* 토글 스위치 */}
            <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isOff?'bg-amber-400':'bg-gray-200'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOff?'translate-x-6':''}`}/>
            </div>
          </button>

          {!isOff && (
            <div className="space-y-4 mb-4">
              {/* 당번 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">당번 1</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={()=>setM1('')}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all touch-manipulation
                      ${!m1?'border-gray-400 bg-gray-100 text-gray-700':'border-gray-100 text-gray-400'}`}>
                    없음
                  </button>
                  {avail1.map(x=>(
                    <button key={x.id} onClick={()=>setM1(x.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all touch-manipulation
                        ${m1===x.id
                          ?'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                          :'border-gray-100 bg-gray-50 text-gray-700 active:border-indigo-200'}`}>
                      {x.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 당번 2 */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">당번 2</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={()=>setM2('')}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all touch-manipulation
                      ${!m2?'border-gray-400 bg-gray-100 text-gray-700':'border-gray-100 text-gray-400'}`}>
                    없음
                  </button>
                  {avail2.map(x=>(
                    <button key={x.id} onClick={()=>setM2(x.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all touch-manipulation
                        ${m2===x.id
                          ?'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                          :'border-gray-100 bg-gray-50 text-gray-700 active:border-indigo-200'}`}>
                      {x.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">메모</p>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)}
              placeholder="특이사항 입력 (선택)"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-200 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors"/>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold touch-manipulation active:bg-gray-200">
              취소
            </button>
            <button onClick={save} disabled={saving}
              className="flex-2 px-8 py-3.5 rounded-2xl text-white text-sm font-bold touch-manipulation active:opacity-90 disabled:opacity-50 transition-opacity"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',flexGrow:2}}>
              {saving?'저장 중…':'저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
