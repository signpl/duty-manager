'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/colors'
import { getHolidayName, isRedDay } from '@/lib/holidays'
import EmojiPicker from './EmojiPicker'

interface Member { id: string; name: string }
interface Schedule {
  id: string; date: string
  member1_id: string|null; member2_id: string|null
  is_off: boolean; note: string|null
}
interface Props {
  date: string; schedule: Schedule|null; members: Member[]
  onClose: ()=>void; onSaved: ()=>void
}

const DAYS = ['일','월','화','수','목','금','토']

// 메모 아이템: emoji + text 분리 저장
interface MemoItem { emoji: string; text: string }

const EMOJIS_CHECK = [
  '✅','❌','⚠️','📌','🔔','💡','⭐','🔥','❗','❓','💯','🎯',
  '😊','😅','😢','😡','🙏','👍','👎','💪','👏','🤝','😴','🤒',
  '📋','📝','📞','📅','📂','🔑','💊','🏥','🚗','🏠','🍽️','⏰',
  '☀️','🌙','🌸','🍀','❄️','🌈','💧','🎉','🎊','🌿','🌺','🍁',
  '💪','🦵',
]

function splitItem(str: string): MemoItem {
  for (const e of EMOJIS_CHECK) {
    if (str.startsWith(e + ' ')) return { emoji: e, text: str.slice(e.length + 1) }
    if (str === e) return { emoji: e, text: '' }
  }
  return { emoji: '', text: str }
}

function joinItem(item: MemoItem): string {
  if (!item.emoji && !item.text.trim()) return ''
  if (!item.emoji) return item.text
  return item.emoji + ' ' + item.text
}

function parseMemo(note: string|null): MemoItem[] {
  if (!note) return [{ emoji: '', text: '' }]
  const lines = note.split('\n')
  const items = lines.map(splitItem)
  return items.length > 0 ? items : [{ emoji: '', text: '' }]
}

function joinMemo(items: MemoItem[]): string {
  return items.map(joinItem).filter(Boolean).join('\n')
}

export default function DayModal({ date, schedule, members, onClose, onSaved }: Props) {
  const [m1, setM1] = useState(schedule?.member1_id || '')
  const [m2, setM2] = useState(schedule?.member2_id || '')
  const [isOff, setIsOff] = useState(schedule?.is_off || false)
  const [items, setItems] = useState<MemoItem[]>(parseMemo(schedule?.note || null))
  const [saving, setSaving] = useState(false)
  const [emojiTargetIdx, setEmojiTargetIdx] = useState<number|null>(null)
  const inputRefs = useRef<(HTMLInputElement|null)[]>([])

  const supabase = createClient()
  const [y, mo, d] = date.split('-').map(Number)
  const dow = new Date(y, mo-1, d).getDay()
  const isSat = dow === 6
  const holiday = getHolidayName(date)
  const isRed = isRedDay(date, dow)
  const dateColor = isRed ? '#C0392B' : isSat ? '#2563EB' : '#111827'

  const updateEmoji = (idx: number, emoji: string) => {
    const next = [...items]
    next[idx] = { ...next[idx], emoji }
    setItems(next)
  }

  const updateText = (idx: number, text: string) => {
    const next = [...items]
    next[idx] = { ...next[idx], text }
    setItems(next)
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...items]
      next.splice(idx+1, 0, { emoji: '', text: '' })
      setItems(next)
      setTimeout(() => inputRefs.current[idx+1]?.focus(), 30)
    }
    if (e.key === 'Backspace' && items[idx].text === '' && items.length > 1) {
      e.preventDefault()
      setItems(items.filter((_,i) => i !== idx))
      setTimeout(() => inputRefs.current[Math.max(0, idx-1)]?.focus(), 30)
    }
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      date,
      member1_id: m1 || null,
      member2_id: m2 || null,
      is_off: isOff,
      note: joinMemo(items) || null,
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
    <>
      <div style={{ position:'fixed', inset:0, zIndex:9000 }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} onClick={onClose}/>

        <div className="sheet-up" style={{
          position:'absolute', bottom:0, left:0, right:0,
          background:'#ffffff', colorScheme:'light',
          borderRadius:'20px 20px 0 0',
          maxHeight:'92dvh', display:'flex', flexDirection:'column',
          boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px', flexShrink:0 }}>
            <div style={{ width:36, height:4, borderRadius:99, background:'#D1D5DB' }}/>
          </div>

          <div style={{ overflowY:'auto', flex:1, padding:'6px 20px 36px', colorScheme:'light' }}>

            {/* 날짜 헤더 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:26, fontWeight:900, color:dateColor }}>{d}일</span>
                <span style={{ fontSize:14, fontWeight:600, color:'#6B7280' }}>{mo}월 {DAYS[dow]}요일</span>
                {holiday && <span style={{ fontSize:11, fontWeight:700, color:'#DC2626', background:'#FEE2E2', padding:'2px 8px', borderRadius:99 }}>{holiday}</span>}
              </div>
              {schedule && (
                <button onClick={del} style={{ padding:'6px 14px', borderRadius:99, background:'#FEE2E2', color:'#EF4444', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>삭제</button>
              )}
            </div>

            {/* 휴무 토글 */}
            <button onClick={()=>setIsOff(!isOff)} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', borderRadius:12, marginBottom:14, cursor:'pointer',
              background:isOff?'#FFFBEB':'#F9FAFB',
              border:`1.5px solid ${isOff?'#FCD34D':'#E5E7EB'}`,
            }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:8 }}>
                <span>{isOff?'😴':'🗓️'}</span>
                휴무일
                {isOff && <span style={{ fontSize:12, color:'#F59E0B', fontWeight:600 }}>설정됨</span>}
              </span>
              <div style={{ width:40, height:22, borderRadius:99, position:'relative', background:isOff?'#F59E0B':'#D1D5DB', flexShrink:0 }}>
                <div style={{ position:'absolute', top:2, left:isOff?20:2, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s' }}/>
              </div>
            </button>

            {/* 당번 선택 — 휴무일이어도 배정 가능 */}
            <PickerRow label="당번 1" selected={m1} options={opts1} members={members} onSelect={setM1}/>
            <PickerRow label="당번 2" selected={m2} options={opts2} members={members} onSelect={setM2}/>

            {/* 메모 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em' }}>메모</div>
                <div style={{ fontSize:10, color:'#C4B9AC' }}>Enter = 새 항목</div>
              </div>

              <div style={{ background:'#F9FAFB', borderRadius:12, border:'1.5px solid #E5E7EB', overflow:'hidden' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display:'flex', alignItems:'center',
                    borderBottom: idx < items.length-1 ? '1px solid #EFEFEF' : 'none',
                    minHeight:44,
                  }}>
                    {/* 순번 */}
                    <div style={{ width:24, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#D1D5DB', alignSelf:'stretch', borderRight:'1px solid #EFEFEF' }}>
                      {idx+1}
                    </div>

                    {/* 이모지 슬롯 — 탭하면 교체 */}
                    <button
                      onClick={() => setEmojiTargetIdx(idx)}
                      title="이모지 변경"
                      style={{
                        width:38, height:44, flexShrink:0,
                        background: item.emoji ? 'rgba(99,102,241,0.06)' : 'none',
                        border:'none', cursor:'pointer',
                        fontSize:20, display:'flex', alignItems:'center', justifyContent:'center',
                        borderRight:'1px solid #EFEFEF',
                        position:'relative',
                      }}
                    >
                      {item.emoji || <span style={{ fontSize:16, opacity:0.3 }}>😊</span>}
                      {/* 교체 힌트 점 */}
                      {item.emoji && (
                        <span style={{ position:'absolute', top:4, right:4, width:5, height:5, borderRadius:'50%', background:'#6366f1', opacity:0.6 }}/>
                      )}
                    </button>

                    {/* 텍스트 입력 */}
                    <input
                      ref={el => { inputRefs.current[idx] = el }}
                      type="text"
                      value={item.text}
                      onChange={e => updateText(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      placeholder={idx === 0 ? '내용을 입력하세요' : ''}
                      style={{ flex:1, padding:'10px 6px', border:'none', background:'transparent', fontSize:14, color:'#1F2937', outline:'none', fontFamily:'inherit' }}
                    />

                    {/* 항목 삭제 */}
                    {items.length > 1 && (
                      <button
                        onClick={() => setItems(items.filter((_,i) => i !== idx))}
                        style={{ width:30, flexShrink:0, background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#D1D5DB', padding:0 }}
                      >×</button>
                    )}
                  </div>
                ))}

                {/* + 항목 추가 */}
                <button
                  onClick={() => {
                    const next = [...items, { emoji:'', text:'' }]
                    setItems(next)
                    setTimeout(() => inputRefs.current[next.length-1]?.focus(), 30)
                  }}
                  style={{
                    width:'100%', padding:'9px', background:'none', border:'none',
                    borderTop:'1px dashed #E5E7EB', cursor:'pointer',
                    fontSize:12, color:'#9CA3AF', fontWeight:600,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                  }}
                >
                  + 항목 추가
                </button>
              </div>
            </div>

            {/* 저장/취소 */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:'0 0 27%', padding:'13px 0', borderRadius:14, background:'#F3F4F6', color:'#6B7280', fontSize:14, fontWeight:700, border:'none', cursor:'pointer' }}>취소</button>
              <button onClick={save} disabled={saving} style={{
                flex:1, padding:'13px 0', borderRadius:14,
                background:saving?'#9CA3AF':'#1a1a1a', color:'#fff',
                fontSize:15, fontWeight:800, border:'none', cursor:'pointer',
                boxShadow:saving?'none':'0 4px 14px rgba(0,0,0,0.2)',
              }}>
                {saving ? '저장 중…' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 이모지 피커 — 항목별 교체 */}
      {emojiTargetIdx !== null && (
        <EmojiPicker
          onSelect={emoji => {
            updateEmoji(emojiTargetIdx, emoji)
            setTimeout(() => inputRefs.current[emojiTargetIdx]?.focus(), 30)
          }}
          onClose={() => setEmojiTargetIdx(null)}
        />
      )}
    </>
  )
}

function PickerRow({ label, selected, options, members, onSelect }: {
  label:string; selected:string; options:Member[]; members:Member[]; onSelect:(id:string)=>void
}) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
        {label}
        {selected && <span style={{ color:'#6366f1', textTransform:'none', letterSpacing:0, fontWeight:700, fontSize:12 }}>✓</span>}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {options.map(x => {
          const idx = members.findIndex(m => m.id === x.id)
          const c = getMemberColor(idx)
          const sel = selected === x.id
          return (
            <button key={x.id} onClick={() => onSelect(sel?'':x.id)} style={{
              padding:'9px 18px', borderRadius:99,
              background:sel?c.bg:'#F3F4F6', color:sel?'#fff':'#374151',
              fontSize:14, fontWeight:700, border:`2px solid ${sel?c.bg:'transparent'}`,
              boxShadow:sel?`0 3px 10px ${c.bg}55`:'none', cursor:'pointer',
            }}>{x.name}</button>
          )
        })}
        {selected && (
          <button onClick={() => onSelect('')} style={{ padding:'9px 14px', borderRadius:99, background:'#F3F4F6', color:'#9CA3AF', fontSize:13, fontWeight:600, border:'2px solid transparent', cursor:'pointer' }}>해제</button>
        )}
      </div>
    </div>
  )
}
