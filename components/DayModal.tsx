'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member { id: string; name: string }
interface Schedule {
  id: string; date: string
  member1_id: string | null; member2_id: string | null
  is_off: boolean; note: string | null
}
interface Props {
  date: string; schedule: Schedule | null; members: Member[]
  onClose: () => void; onSaved: () => void
}

const DAY_KO = ['일','월','화','수','목','금','토']

export default function DayModal({ date, schedule, members, onClose, onSaved }: Props) {
  const [member1, setMember1] = useState(schedule?.member1_id || '')
  const [member2, setMember2] = useState(schedule?.member2_id || '')
  const [isOff, setIsOff] = useState(schedule?.is_off || false)
  const [note, setNote] = useState(schedule?.note || '')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  const supabase = createClient()

  // 슬라이드 업 애니메이션
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const close = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const [y, m, d] = date.split('-').map(Number)
  const dateObj = new Date(y, m-1, d)
  const displayDate = `${m}월 ${d}일 (${DAY_KO[dateObj.getDay()]})`

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      date,
      member1_id: isOff ? null : (member1 || null),
      member2_id: isOff ? null : (member2 || null),
      is_off: isOff,
      note: note.trim() || null,
    }
    if (schedule) await supabase.from('schedules').update(payload).eq('id', schedule.id)
    else await supabase.from('schedules').insert(payload)
    setSaving(false)
    onSaved()
    close()
  }

  const handleDelete = async () => {
    if (!schedule) return
    setSaving(true)
    await supabase.from('schedules').delete().eq('id', schedule.id)
    onSaved()
    close()
  }

  // 필터: 다른 당번이 선택한 멤버 제외 (중복 방지)
  const available1 = members.filter(m => !member2 || m.id !== member2)
  const available2 = members.filter(m => !member1 || m.id !== member1)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center"
      onClick={close}
    >
      {/* 딤 배경 */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`} />

      {/* 모달 패널 */}
      <div
        className={`relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl
          transition-transform duration-250 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full sm:translate-y-4 sm:opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 (모바일) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pt-2 pb-6 sm:pt-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{displayDate}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {schedule ? '당번을 수정하세요' : '당번을 배정하세요'}
              </p>
            </div>
            <button onClick={close}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-lg transition-colors touch-manipulation">
              ×
            </button>
          </div>

          {/* 휴무 토글 */}
          <button
            onClick={() => setIsOff(!isOff)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl mb-4 transition-all touch-manipulation
              ${isOff ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-50 border-2 border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{isOff ? '😴' : '📅'}</span>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-700">휴무일</div>
                <div className="text-xs text-gray-400">당번 없이 쉬는 날</div>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${isOff ? 'bg-amber-400' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOff ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {!isOff && (
            <div className="space-y-3 mb-4">
              {/* 당번 1 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">당번 1</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  <button
                    onClick={() => setMember1('')}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all touch-manipulation
                      ${!member1 ? 'border-gray-300 bg-gray-100 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                  >
                    없음
                  </button>
                  {available1.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMember1(m.id)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all touch-manipulation
                        ${member1 === m.id
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-indigo-200'}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 당번 2 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">당번 2</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  <button
                    onClick={() => setMember2('')}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all touch-manipulation
                      ${!member2 ? 'border-gray-300 bg-gray-100 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                  >
                    없음
                  </button>
                  {available2.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMember2(m.id)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all touch-manipulation
                        ${member2 === m.id
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-indigo-200'}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">메모</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="특이사항 입력 (선택)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            {schedule && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-3 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors touch-manipulation"
              >
                삭제
              </button>
            )}
            <button
              onClick={close}
              className="flex-1 py-3 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium touch-manipulation"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 text-sm text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl transition-colors font-semibold disabled:opacity-50 touch-manipulation"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
