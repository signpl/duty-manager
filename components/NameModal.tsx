'use client'

import { useState } from 'react'

interface Member { id:string; name:string }
interface Props { currentName:string|null; members:Member[]; onSave:(n:string)=>void; onClose?:()=>void }

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

export default function NameModal({currentName,members,onSave,onClose}:Props) {
  const [input,setInput] = useState('')
  const [mode,setMode] = useState<'select'|'type'>(members.length>0?'select':'type')

  const colorOf = (name:string) => COLORS[name.charCodeAt(0)%COLORS.length]

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 fade-in" onClick={onClose}/>

      <div className="relative bg-white rounded-t-3xl shadow-2xl slide-up max-h-[85vh] flex flex-col">
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200"/>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentName ? '이름 변경' : '안녕하세요 👋'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {currentName ? '변경할 이름을 선택하세요' : '이름을 선택해주세요'}
            </p>
          </div>

          {mode==='select' && members.length>0 ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {members.map(m=>{
                  const color = colorOf(m.name)
                  const isMe = currentName===m.name
                  return (
                    <button key={m.id} onClick={()=>onSave(m.name)}
                      className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all touch-manipulation active:scale-95
                        ${isMe?'border-indigo-400 bg-indigo-50':'border-transparent bg-gray-50 active:bg-gray-100'}`}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 shadow-sm"
                        style={{background:color}}>
                        {m.name[0]}
                      </div>
                      <span className={`text-sm font-semibold ${isMe?'text-indigo-700':'text-gray-700'}`}>{m.name}</span>
                      {isMe && <span className="text-[10px] text-indigo-400 mt-0.5">현재</span>}
                    </button>
                  )
                })}
              </div>
              <button onClick={()=>setMode('type')}
                className="w-full py-3 text-sm text-gray-400 touch-manipulation border border-dashed border-gray-200 rounded-2xl hover:border-gray-300">
                + 직접 입력
              </button>
            </>
          ):(
            <>
              <input type="text" value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&input.trim()&&onSave(input.trim())}
                placeholder="이름을 입력하세요" autoFocus
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-300 rounded-2xl px-4 py-4 text-base focus:outline-none mb-4 transition-colors"/>
              <button onClick={()=>input.trim()&&onSave(input.trim())} disabled={!input.trim()}
                className="w-full py-4 rounded-2xl text-white text-base font-bold touch-manipulation disabled:opacity-40 mb-3"
                style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                입장하기
              </button>
              {members.length>0&&(
                <button onClick={()=>setMode('select')}
                  className="w-full py-2 text-sm text-gray-400 touch-manipulation">← 목록에서 선택</button>
              )}
            </>
          )}

          {onClose&&(
            <button onClick={onClose}
              className="w-full py-3 mt-2 text-sm text-gray-300 touch-manipulation">취소</button>
          )}
        </div>
      </div>
    </div>
  )
}
