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
    <div className="fixed inset-0 z-50">
      {/* 딤 */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />

      {/* 바텀시트 */}
      <div
        className="absolute bottom-0 left-0 right-0 sheet-up"
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.15)',
        }}
      >
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E7EB' }} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 20px 36px' }}>

          {/* 날짜 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: dateColor }}>{d}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>{mo}월 {DAYS[dow]}요일</span>
              {holiday && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#DC2626',
                  background: '#FEE2E2', padding: '2px 8px', borderRadius: 99,
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
              }}>삭제</button>
            )}
          </div>

          {/* 휴무 토글 — 컴팩트 */}
          <button
            onClick={() => setIsOff(!isOff)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '10px 14px',
              borderRadius: 12, marginBottom: 16, cursor: 'pointer',
              background: isOff ? '#FFFBEB' : '#F9FAFB',
              border: `1.5px solid ${isOff ? '#FCD34D' : '#E5E7EB'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{isOff ? '😴' : '🗓️'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>휴무일</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {isOff ? '휴무일로 설정됨' : '탭하여 휴무일로 설정'}
                </div>
              </div>
            </div>
            {/* 작은 스위치 */}
            <div style={{
              width: 44, height: 24, borderRadius: 99, position: 'relative', flexShrink: 0,
              background: isOff ? '#F59E0B' : '#D1D5DB', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: isOff ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </div>
          </button>

          {!isOff && (
            <>
              <Section label="당번 1" selected={!!m1}>
                <MemberGrid options={opts1} members={members} selected={m1} onSelect={setM1} />
              </Section>
              <Section label="당번 2" selected={!!m2}>
                <MemberGrid options={opts2} members={members} selected={m2} onSelect={setM2} />
              </Section>
            </>
          )}

          {/* 메모 */}
          <div style={{ marginBottom: 20 }}>
            <Label>메모</Label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="특이사항 (선택)"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                background: '#F3F4F6', border: '1.5px solid transparent',
                fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#6366f1' }}
              onBlur={e => { e.target.style.background = '#F3F4F6'; e.target.style.borderColor = 'transparent' }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: '0 0 28%', padding: '14px 0', borderRadius: 14,
              background: '#F3F4F6', color: '#6B7280',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}>취소</button>
            <button onClick={save} disabled={saving} style={{
              flex: 1, padding: '14px 0', borderRadius: 14,
              background: saving ? '#9CA3AF' : '#6366f1', color: '#fff',
              fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
            }}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function Section({ label, selected, children }: { label: string; selected: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
        {selected && <span style={{ color: '#6366f1', textTransform: 'none', letterSpacing: 0, fontWeight: 600, marginLeft: 6 }}>✓</span>}
      </div>
      {children}
    </div>
  )
}

function MemberGrid({ options, members, selected, onSelect }: {
  options: Member[]; members: Member[]; selected: string; onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(x => {
        const idx = members.findIndex(m => m.id === x.id)
        const c = getMemberColor(idx)
        const sel = selected === x.id
        return (
          <button
            key={x.id}
            onClick={() => onSelect(sel ? '' : x.id)}
            style={{
              padding: '10px 18px', borderRadius: 99,
              background: sel ? c.bg : '#F3F4F6',
              color: sel ? '#fff' : '#374151',
              fontSize: 14, fontWeight: 700,
              border: `2px solid ${sel ? c.bg : 'transparent'}`,
              boxShadow: sel ? `0 3px 10px ${c.bg}50` : 'none',
              cursor: 'pointer', transition: 'all 0.15s',
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
            padding: '10px 14px', borderRadius: 99,
            background: '#F3F4F6', color: '#9CA3AF',
            fontSize: 13, fontWeight: 600,
            border: '2px solid transparent', cursor: 'pointer',
          }}
        >
          해제
        </button>
      )}
    </div>
  )
}
