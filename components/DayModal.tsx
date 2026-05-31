'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  date: string
  schedule: Schedule | null
  members: Member[]
  onClose: () => void
  onSaved: () => void
}

export default function DayModal({ date, schedule, members, onClose, onSaved }: Props) {
  const [member1, setMember1] = useState(schedule?.member1_id || '')
  const [member2, setMember2] = useState(schedule?.member2_id || '')
  const [isOff, setIsOff] = useState(schedule?.is_off || false)
  const [note, setNote] = useState(schedule?.note || '')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  // 날짜 포맷
  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const displayDate = `${year}년 ${month}월 ${day}일 (${dayNames[dateObj.getDay()]})`

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      date,
      member1_id: isOff ? null : (member1 || null),
      member2_id: isOff ? null : (member2 || null),
      is_off: isOff,
      note: note || null,
    }

    if (schedule) {
      await supabase.from('schedules').update(payload).eq('id', schedule.id)
    } else {
      await supabase.from('schedules').insert(payload)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    if (!schedule) return
    await supabase.from('schedules').delete().eq('id', schedule.id)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">{displayDate}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* 휴무 토글 */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-amber-50 rounded-xl">
          <input
            type="checkbox"
            id="isOff"
            checked={isOff}
            onChange={e => setIsOff(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="isOff" className="text-sm font-medium text-amber-700 cursor-pointer">
            휴무일로 설정
          </label>
        </div>

        {!isOff && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">당번 1</label>
              <select
                value={member1}
                onChange={e => setMember1(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">선택 안함</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">당번 2</label>
              <select
                value={member2}
                onChange={e => setMember2(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">선택 안함</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="메모를 입력하세요"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex gap-2">
          {schedule && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
