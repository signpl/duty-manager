'use client'

import { useState } from 'react'
import { getMemberColor } from '@/lib/colors'

interface Member { id:string; name:string }
interface Props { currentName:string|null; members:Member[]; onSave:(n:string)=>void; onClose?:()=>void }

export default function NameModal({currentName,members,onSave,onClose}:Props) {
  const [input,setInput] = useState('')
  const [mode,setMode] = useState<'select'|'type'>(members.length>0?'select':'type')

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 dim-in" style={{background:'rgba(0,0,0,0.4)'}} onClick={onClose}/>

      <div className="relative bg-white rounded-t-3xl sheet-up max-h-[85vh] flex flex-col"
        style={{boxShadow:'0 -4px 40px rgba(0,0,0,0.15)'}}>

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200"/>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900">
              {currentName?'이름 변경 👤':'안녕하세요 👋'}
            </h2>
            <p className="text-gray-400 mt-1">
              {currentName?'변경할 이름을 선택하세요':'본인 이름을 선택해주세요'}
            </p>
          </div>

          {mode==='select'&&members.length>0?(
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {members.map((m,i)=>{
                  const c = getMemberColor(i)
                  const isMe = currentName===m.name
                  return (
                    <button key={m.id} onClick={()=>onSave(m.name)}
                      className="py-5 rounded-2xl text-base font-bold touch-manipulation active:scale-95 transition-transform"
                      style={{
                        background: isMe?c.bg:c.light,
                        color: isMe?'#fff':c.bg,
                        border:`2px solid ${isMe?c.bg:'transparent'}`,
                        boxShadow: isMe?`0 4px 16px ${c.bg}50`:undefined
                      }}>
                      <div className="text-3xl mb-1">{m.name[0]}</div>
                      {m.name}
                      {isMe&&<div className="text-xs opacity-70 mt-0.5">현재</div>}
                    </button>
                  )
                })}
              </div>
              <button onClick={()=>setMode('type')}
                className="w-full py-4 rounded-2xl text-base font-semibold text-gray-400 touch-manipulation"
                style={{background:'#F5F5F5'}}>
                + 직접 입력
              </button>
            </>
          ):(
            <>
              <input type="text" value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&input.trim()&&onSave(input.trim())}
                placeholder="이름 입력" autoFocus
                className="w-full rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none mb-4"
                style={{background:'#F5F5F5',border:'2px solid transparent'}}
                onFocus={e=>{e.target.style.borderColor='#6366f1'}}
                onBlur={e=>{e.target.style.borderColor='transparent'}}/>
              <button onClick={()=>input.trim()&&onSave(input.trim())} disabled={!input.trim()}
                className="w-full py-4 rounded-2xl text-lg font-bold text-white mb-3 touch-manipulation disabled:opacity-40"
                style={{background:'#6366f1',boxShadow:'0 4px 16px #6366f140'}}>
                입장하기
              </button>
              {members.length>0&&(
                <button onClick={()=>setMode('select')}
                  className="w-full py-3 text-gray-400 touch-manipulation">← 목록에서 선택</button>
              )}
            </>
          )}

          {onClose&&(
            <button onClick={onClose}
              className="w-full py-3 mt-2 text-gray-300 touch-manipulation">취소</button>
          )}
        </div>
      </div>
    </div>
  )
}
