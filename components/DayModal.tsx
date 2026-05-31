'use client'

import { useState } from 'react'
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

  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const displayDate = `${month}월 ${day}일 (${dayNames[dateObj.getDay()]})`

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
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">{displayDate}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* 휴무 */}
        <label className="flex items-center gap-3 mb-5 p-3 bg-amber-50 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={isOff}
            onChange={e => setIsOff(e.target.checked)}
            className="w-4 h-4 accent-amber-500"
          />
          <span className="text-sm font-medium text-amber-700">휴무일</span>
        </label>

        {!isOff && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">당번 1</label>
              <select
                value={member1}
                onChange={e => setMember1(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">선택 안함</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">당번 2</label>
              <select
                value={member2}
                onChange={e => setMember2(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
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
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">메모</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="선택 사항"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex gap-2">
          {schedule && (
            <button
              onClick={handleDelete}
              className="px-3 py-2.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors font-medium disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
