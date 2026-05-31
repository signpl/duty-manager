'use client'

import { useState, useEffect } from 'react'

interface Member { id: string; name: string }
interface Props {
  currentName: string | null; members: Member[]
  onSave: (name: string) => void; onClose?: () => void
}

export default function NameModal({ currentName, members, onSave, onClose }: Props) {
  const [input, setInput] = useState(currentName || '')
  const [mode, setMode] = useState<'select' | 'type'>(members.length > 0 ? 'select' : 'type')
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const close = () => {
    if (!onClose) return
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const handleSelect = (name: string) => onSave(name)
  const handleType = () => { if (input.trim()) onSave(input.trim()) }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close} />

      <div className={`relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl
        transition-transform duration-250 ease-out
        ${visible ? 'translate-y-0' : 'translate-y-full'}`}>

        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pt-3 pb-8 sm:py-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">👋</div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentName ? '이름 변경' : '누구세요?'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {currentName ? '변경할 이름을 선택하세요' : '이름을 선택하거나 입력하세요'}
            </p>
          </div>

          {mode === 'select' && members.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.name)}
                    className={`py-3.5 px-4 rounded-2xl text-sm font-semibold border-2 transition-all touch-manipulation
                      ${currentName === m.name
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-100 bg-gray-50 text-gray-700 active:border-indigo-300 active:bg-indigo-50'}`}
                  >
                    <div className="text-2xl mb-1">{m.name[0]}</div>
                    {m.name}
                  </button>
                ))}
              </div>
              <button onClick={() => setMode('type')}
                className="w-full text-sm text-gray-400 py-2 touch-manipulation">
                목록에 없어요 → 직접 입력
              </button>
            </>
          ) : (
            <>
              <input
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleType()}
                placeholder="이름 입력"
                autoFocus
                className="w-full border-2 border-gray-200 focus:border-indigo-400 rounded-2xl px-4 py-3.5 text-base focus:outline-none mb-3"
              />
              <button onClick={handleType} disabled={!input.trim()}
                className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-40 touch-manipulation">
                입장하기
              </button>
              {members.length > 0 && (
                <button onClick={() => setMode('select')}
                  className="w-full text-sm text-gray-400 py-2 mt-1 touch-manipulation">
                  ← 목록에서 선택
                </button>
              )}
            </>
          )}

          {onClose && (
            <button onClick={close}
              className="w-full text-xs text-gray-300 py-2 mt-1 touch-manipulation">
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
