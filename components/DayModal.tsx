'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/colors'

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
  const isSun=dow===0; const isSat=dow===6

  const save = async () => {
    setSaving(true)
    const payload = {
      date,
      member1_id: isOff?null:(m1||null),
      member2_id: isOff?null:(m2||null),
      is_off: isOff,
      note: note.trim()||null
    }
    if(schedule) await supabase.from('schedules').update(payload).eq('id',schedule.id)
    else await supabase.from('schedules').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const del = async () => {
    if(!schedule) return
    await supabase.from('schedules').delete().eq('id',schedule.id)
    onSaved(); onClose()
  }

  // 선택 시 상대방 제외
  const opts1 = members.filter(x=>!m2||x.id!==m2)
  const opts2 = members.filter(x=>!m1||x.id!==m1)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 dim-in" style={{background:'rgba(0,0,0,0.35)'}}/>

      <div className="relative bg-white rounded-t-3xl sheet-up max-h-[92vh] flex flex-col"
        style={{boxShadow:'0 -4px 40px rgba(0,0,0,0.15)'}}
        onClick={e=>e.stopPropagation()}>

        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200"/>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pt-2 pb-10">

          {/* 날짜 타이틀 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${isSun?'text-red-500':isSat?'text-blue-500':'text-gray-900'}`}>{d}</span>
              <span className="text-lg font-bold text-gray-400">{mo}월 {DAYS[dow]}요일</span>
            </div>
            {schedule&&(
              <button onClick={del}
                className="text-sm text-red-400 font-semibold px-4 py-2 rounded-full touch-manipulation"
                style={{background:'#FFF0F0'}}>삭제</button>
            )}
          </div>

          {/* 휴무 토글 */}
          <button onClick={()=>setIsOff(!isOff)}
            className="w-full flex items-center justify-between p-4 rounded-2xl mb-5 touch-manipulation transition-all"
            style={{
              background: isOff?'#FFFBEB':'#F9F9F9',
              border: `2px solid ${isOff?'#FCD34D':'transparent'}`
            }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isOff?'😴':'📅'}</span>
              <div className="text-left">
                <p className="text-base font-bold text-gray-800">휴무일</p>
                <p className="text-sm text-gray-400">당번 없이 쉬는 날로 설정</p>
              </div>
            </div>
            <div className="w-14 h-7 rounded-full relative transition-colors"
              style={{background:isOff?'#FBBF24':'#E5E7EB'}}>
              <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                style={{left:'2px',transform:isOff?'translateX(28px)':'translateX(0)'}}/>
            </div>
          </button>

          {!isOff&&<>
            {/* 당번 1 */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">당번 1</p>
              <div className="grid grid-cols-2 gap-2">
                {opts1.map((x,i)=>{
                  const idx1 = members.findIndex(m=>m.id===x.id)
                  const c = getMemberColor(idx1)
                  const sel = m1===x.id
                  return (
                    <button key={x.id} onClick={()=>setM1(sel?'':x.id)}
                      className="py-4 rounded-2xl text-base font-bold touch-manipulation transition-all active:scale-95"
                      style={{
                        background: sel?c.bg:c.light,
                        color: sel?'#fff':c.bg,
                        border: `2px solid ${sel?c.bg:'transparent'}`,
                        boxShadow: sel?`0 4px 12px ${c.bg}40`:undefined
                      }}>
                      {x.name}
                    </button>
                  )
                })}
                {m1&&(
                  <button onClick={()=>setM1('')}
                    className="py-4 rounded-2xl text-base font-bold text-gray-400 touch-manipulation"
                    style={{background:'#F5F5F5',border:'2px solid transparent'}}>
                    선택 해제
                  </button>
                )}
              </div>
            </div>

            {/* 당번 2 */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">당번 2</p>
              <div className="grid grid-cols-2 gap-2">
                {opts2.map((x,i)=>{
                  const idx2 = members.findIndex(m=>m.id===x.id)
                  const c = getMemberColor(idx2)
                  const sel = m2===x.id
                  return (
                    <button key={x.id} onClick={()=>setM2(sel?'':x.id)}
                      className="py-4 rounded-2xl text-base font-bold touch-manipulation transition-all active:scale-95"
                      style={{
                        background: sel?c.bg:c.light,
                        color: sel?'#fff':c.bg,
                        border: `2px solid ${sel?c.bg:'transparent'}`,
                        boxShadow: sel?`0 4px 12px ${c.bg}40`:undefined
                      }}>
                      {x.name}
                    </button>
                  )
                })}
                {m2&&(
                  <button onClick={()=>setM2('')}
                    className="py-4 rounded-2xl text-base font-bold text-gray-400 touch-manipulation"
                    style={{background:'#F5F5F5',border:'2px solid transparent'}}>
                    선택 해제
                  </button>
                )}
              </div>
            </div>
          </>}

          {/* 메모 */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">메모</p>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)}
              placeholder="특이사항을 입력하세요"
              className="w-full rounded-2xl px-4 py-4 text-base focus:outline-none transition-colors"
              style={{background:'#F5F5F5',border:'2px solid transparent'}}
              onFocus={e=>{e.target.style.borderColor='#6366f1'}}
              onBlur={e=>{e.target.style.borderColor='transparent'}}/>
          </div>

          {/* 저장/취소 버튼 */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="py-4 rounded-2xl text-base font-bold text-gray-500 touch-manipulation active:bg-gray-200"
              style={{background:'#F0F0F0',width:'30%'}}>
              취소
            </button>
            <button onClick={save} disabled={saving}
              className="py-4 rounded-2xl text-base font-bold text-white touch-manipulation active:opacity-90 disabled:opacity-50 flex-1"
              style={{background:saving?'#9CA3AF':'#6366f1',boxShadow:'0 4px 16px #6366f140'}}>
              {saving?'저장 중…':'저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
