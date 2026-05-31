'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/colors'
import { getHolidayName, isRedDay } from '@/lib/holidays'

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

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function DayModal({ date, schedule, members, onClose, onSaved }: Props) {
  const [m1, setM1] = useState(schedule?.member1_id || '')
  const [m2, setM2] = useState(schedule?.member2_id || '')
  const [isOff, setIsOff] = useState(schedule?.is_off || false)
  const [note, setNote] = useState(schedule?.note || '')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const [y, mo, d] = date.split('-').map(Number)
  const dow = new Date(y, mo - 1, d).getDay()
  const isSat = dow === 6
  const holiday = getHolidayName(date)
  const isRed = isRedDay(date, dow)
  const dateColor = isRed ? '#EF4444' : isSat ? '#3B82F6' : '#111827'

  const save = async () => {
    setSaving(true)
    const payload = {
      date,
      member1_id: isOff ? null : (m1 || null),
      member2_id: isOff ? null : (m2 || null),
      is_off: isOff,
      note: note.trim() || null,
    }
    if (schedule) await supabase.from('schedules').update(payload).eq('id', schedule.id)
    else await supabase.from('schedules').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const del = async () => {
    if (!schedule) return
    await supabase.from('schedules').delete().eq('id', schedule.id)
    onSaved(); onClose()
  }

  const opts1 = members.filter(x => !m2 || x.id !== m2)
  const opts2 = members.filter(x => !m1 || x.id !== m1)

  return (
    /* 전체 화면 고정 오버레이 */
    <div className="fixed inset-0 z-50" style={{ isolation: 'isolate' }}>
      {/* 딤 배경 */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* 바텀시트 — 완전 불투명 흰색 */}
      <div
        className="absolute bottom-0 left-0 right-0 sheet-up flex flex-col"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92dvh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#E5E7EB' }} />
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1" style={{ padding: '8px 20px 40px' }}>

          {/* 날짜 + 삭제 */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 32, fontWeight: 900, color: dateColor, lineHeight: 1 }}>{d}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: '#6B7280' }}>{mo}월 {DAYS[dow]}요일</span>
              </div>
              {holiday && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  marginTop: 6, padding: '2px 10px', borderRadius: 99,
                  background: '#FEE2E2', color: '#DC2626',
                  fontSize: 12, fontWeight: 700,
                }}>
                  🎌 {holiday}
                </div>
              )}
            </div>
            {schedule && (
              <button
                onClick={del}
                style={{
                  padding: '8px 16px', borderRadius: 99,
                  background: '#FEE2E2', color: '#EF4444',
                  fontSize: 13, fontWeight: 700, border: 'none',
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            )}
          </div>

          {/* 휴무 토글 */}
          <button
            onClick={() => setIsOff(!isOff)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '14px 16px',
              borderRadius: 16, marginBottom: 20, cursor: 'pointer',
              background: isOff ? '#FFFBEB' : '#F9FAFB',
              border: `2px solid ${isOff ? '#FCD34D' : '#E5E7EB'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: isOff ? '#FEF3C7' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {isOff ? '😴' : '🗓️'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>휴무일</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                  {isOff ? '이 날은 쉬는 날입니다' : '탭하여 휴무일로 설정'}
                </div>
              </div>
            </div>
            {/* 스위치 */}
            <div style={{
              width: 50, height: 28, borderRadius: 99, position: 'relative',
              background: isOff ? '#F59E0B' : '#D1D5DB', flexShrink: 0,
              transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isOff ? 25 : 3,
                width: 22, height: 22, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                transition: 'left 0.2s',
              }} />
            </div>
          </button>

          {!isOff && (
            <>
              {/* 당번 1 */}
              <MemberPicker
                label="당번 1"
                selected={m1}
                options={opts1}
                members={members}
                onSelect={setM1}
              />
              {/* 당번 2 */}
              <MemberPicker
                label="당번 2"
                selected={m2}
                options={opts2}
                members={members}
                onSelect={setM2}
              />
            </>
          )}

          {/* 메모 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
              메모
            </div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="특이사항을 입력하세요"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                background: '#F3F4F6', border: '2px solid transparent',
                fontSize: 15, color: '#111827', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#6366f1' }}
              onBlur={e => { e.target.style.background = '#F3F4F6'; e.target.style.borderColor = 'transparent' }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: '0 0 30%', padding: '16px 0', borderRadius: 16,
                background: '#F3F4F6', color: '#6B7280',
                fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                flex: 1, padding: '16px 0', borderRadius: 16,
                background: saving ? '#9CA3AF' : '#6366f1',
                color: '#fff', fontSize: 15, fontWeight: 800,
                border: 'none', cursor: 'pointer',
                boxShadow: saving ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
              }}
            >
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* 당번 선택 컴포넌트 */
function MemberPicker({
  label, selected, options, members, onSelect,
}: {
  label: string
  selected: string
  options: Member[]
  members: Member[]
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
        {label}
        {selected && <span style={{ color: '#6366f1', marginLeft: 6, textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>✓ 선택됨</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {options.map(x => {
          const idx = members.findIndex(m => m.id === x.id)
          const c = getMemberColor(idx)
          const sel = selected === x.id
          return (
            <button
              key={x.id}
              onClick={() => onSelect(sel ? '' : x.id)}
              style={{
                padding: '14px 8px',
                borderRadius: 14,
                background: sel ? c.bg : '#F3F4F6',
                color: sel ? '#FFFFFF' : '#374151',
                fontSize: 15,
                fontWeight: 700,
                border: `2px solid ${sel ? c.bg : 'transparent'}`,
                boxShadow: sel ? `0 4px 14px ${c.bg}55` : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {x.name}
            </button>
          )
        })}
        {selected && (
          <button
            onClick={() => onSelect('')}
            style={{
              padding: '14px 8px', borderRadius: 14,
              background: '#F3F4F6', color: '#9CA3AF',
              fontSize: 14, fontWeight: 600,
              border: '2px solid transparent', cursor: 'pointer',
            }}
          >
            선택 해제
          </button>
        )}
      </div>
    </div>
  )
}
