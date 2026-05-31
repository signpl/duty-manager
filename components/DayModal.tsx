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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* 딤 */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* 바텀시트 — 강제 라이트모드 + 완전 불투명 */}
      <div
        className="sheet-up"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: '#ffffff',
          colorScheme: 'light',
          borderRadius: '20px 20px 0 0',
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D1D5DB' }} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 32px', colorScheme: 'light' }}>

          {/* ── 날짜 헤더 ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: dateColor, lineHeight: 1 }}>{d}일</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{mo}월 {DAYS[dow]}요일</span>
              {holiday && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#DC2626', background: '#FEE2E2',
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  {holiday}
                </span>
              )}
            </div>
            {schedule && (
              <button onClick={del} style={{
                padding: '6px 14px', borderRadius: 99,
                background: '#FEE2E2', color: '#EF4444',
                fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                flexShrink: 0,
              }}>삭제</button>
            )}
          </div>

          {/* ── 휴무 토글 (한 줄 컴팩트) ── */}
          <button
            onClick={() => setIsOff(!isOff)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 12, marginBottom: 14,
              background: isOff ? '#FFFBEB' : '#F9FAFB',
              border: `1.5px solid ${isOff ? '#FCD34D' : '#E5E7EB'}`,
              cursor: 'pointer', boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{isOff ? '😴' : '🗓️'}</span>
              휴무일
              {isOff && <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>설정됨</span>}
            </span>
            {/* 미니 스위치 */}
            <div style={{
              width: 40, height: 22, borderRadius: 99, position: 'relative',
              background: isOff ? '#F59E0B' : '#D1D5DB', flexShrink: 0,
              transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: isOff ? 20 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </div>
          </button>

          {/* ── 당번 선택 ── */}
          {!isOff && (
            <>
              <PickerRow
                label="당번 1" selected={m1}
                options={opts1} members={members}
                onSelect={setM1}
              />
              <PickerRow
                label="당번 2" selected={m2}
                options={opts2} members={members}
                onSelect={setM2}
              />
            </>
          )}

          {/* ── 메모 ── */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              메모
            </div>
            <input
              type="text" value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="특이사항 (선택)"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                background: '#F3F4F6', border: '1.5px solid transparent',
                fontSize: 14, color: '#111827', outline: 'none',
                boxSizing: 'border-box', colorScheme: 'light',
              }}
              onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#6366f1' }}
              onBlur={e => { e.target.style.background = '#F3F4F6'; e.target.style.borderColor = 'transparent' }}
            />
          </div>

          {/* ── 버튼 ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: '0 0 27%', padding: '13px 0', borderRadius: 14,
              background: '#F3F4F6', color: '#6B7280',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>취소</button>
            <button onClick={save} disabled={saving} style={{
              flex: 1, padding: '13px 0', borderRadius: 14,
              background: saving ? '#9CA3AF' : '#6366f1',
              color: '#fff', fontSize: 15, fontWeight: 800,
              border: 'none', cursor: 'pointer',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
            }}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PickerRow({ label, selected, options, members, onSelect }: {
  label: string; selected: string
  options: Member[]; members: Member[]
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {label}
        {selected && <span style={{ color: '#6366f1', textTransform: 'none', letterSpacing: 0, fontWeight: 700, fontSize: 12 }}>✓</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(x => {
          const idx = members.findIndex(m => m.id === x.id)
          const c = getMemberColor(idx)
          const sel = selected === x.id
          return (
            <button key={x.id} onClick={() => onSelect(sel ? '' : x.id)} style={{
              padding: '9px 18px', borderRadius: 99,
              background: sel ? c.bg : '#F3F4F6',
              color: sel ? '#fff' : '#374151',
              fontSize: 14, fontWeight: 700,
              border: `2px solid ${sel ? c.bg : 'transparent'}`,
              boxShadow: sel ? `0 3px 10px ${c.bg}55` : 'none',
              cursor: 'pointer',
            }}>
              {x.name}
            </button>
          )
        })}
        {selected && (
          <button onClick={() => onSelect('')} style={{
            padding: '9px 14px', borderRadius: 99,
            background: '#F3F4F6', color: '#9CA3AF',
            fontSize: 13, fontWeight: 600,
            border: '2px solid transparent', cursor: 'pointer',
          }}>해제</button>
        )}
      </div>
    </div>
  )
}
