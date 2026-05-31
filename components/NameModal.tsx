'use client'

import { useState } from 'react'

interface Member {
  id: string
  name: string
}

interface Props {
  currentName: string | null
  members: Member[]
  onSave: (name: string) => void
  onClose?: () => void
}

export default function NameModal({ currentName, members, onSave, onClose }: Props) {
  const [input, setInput] = useState(currentName || '')
  const [mode, setMode] = useState<'select' | 'type'>('select')

  const handleSelect = (name: string) => {
    onSave(name)
  }

  const handleType = () => {
    if (!input.trim()) return
    onSave(input.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-xl font-bold text-gray-800">누구세요?</h2>
          <p className="text-sm text-gray-400 mt-1">이름을 선택하거나 입력하세요</p>
        </div>

        {/* 팀원 목록에서 선택 */}
        {members.length > 0 && mode === 'select' && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m.name)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
                    ${currentName === m.name
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                    }`}
                >
                  <span className="block text-lg mb-0.5">{m.name[0]}</span>
                  {m.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode('type')}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              목록에 없어요 → 직접 입력
            </button>
          </>
        )}

        {/* 직접 입력 */}
        {(members.length === 0 || mode === 'type') && (
          <>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleType()}
              placeholder="이름을 입력하세요"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 mb-3"
            />
            <button
              onClick={handleType}
              disabled={!input.trim()}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-40 text-sm"
            >
              입장하기
            </button>
            {members.length > 0 && (
              <button
                onClick={() => setMode('select')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 mt-1 transition-colors"
              >
                ← 목록에서 선택
              </button>
            )}
          </>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="w-full text-xs text-gray-300 hover:text-gray-500 mt-2 py-1 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </div>
  )
}
