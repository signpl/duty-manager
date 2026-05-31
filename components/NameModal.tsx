'use client'

import { useState } from 'react'
import { getMemberColor } from '@/lib/colors'

interface Member { id: string; name: string }
interface Props {
  currentName: string | null
  members: Member[]
  onSave: (name: string) => void
  onClose?: () => void
}

export default function NameModal({ currentName, members, onSave, onClose }: Props) {
  const [mode, setMode] = useState<'select' | 'type'>(members.length > 0 ? 'select' : 'type')
  const [input, setInput] = useState('')

  const isChanging = !!currentName

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* 딤 */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div
        className="sheet-up"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: '#fff',
          colorScheme: 'light',
          borderRadius: '24px 24px 0 0',
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E7EB' }} />
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px 40px' }}>

          {/* 타이틀 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {isChanging ? 'CHANGE NAME' : 'WELCOME'}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {isChanging ? '이름 변경' : '누구세요?'}
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, fontWeight: 500 }}>
              {mode === 'select'
                ? isChanging ? '변경할 이름을 선택하세요' : '본인 이름을 선택하세요'
                : '이름을 직접 입력하세요'}
            </div>
          </div>

          {/* ── 목록 선택 모드 ── */}
          {mode === 'select' && members.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {members.map((m, i) => {
                  const c = getMemberColor(i)
                  const isMe = currentName === m.name
                  return (
                    <button
                      key={m.id}
                      onClick={() => onSave(m.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: isMe ? c.light : '#F9FAFB',
                        border: `2px solid ${isMe ? c.bg : 'transparent'}`,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        boxShadow: isMe ? `0 2px 12px ${c.bg}30` : 'none',
                      }}
                    >
                      {/* 아바타 */}
                      <div style={{
                        width: 46, height: 46,
                        borderRadius: 14,
                        background: c.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 900, color: '#fff',
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${c.bg}50`,
                      }}>
                        {m.name[0]}
                      </div>

                      {/* 이름 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{m.name}</div>
                        {isMe && (
                          <div style={{ fontSize: 11, color: c.bg, fontWeight: 700, marginTop: 2 }}>현재 선택됨</div>
                        )}
                      </div>

                      {/* 체크 */}
                      {isMe && (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: c.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, color: '#fff', fontWeight: 800,
                          flexShrink: 0,
                        }}>✓</div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* 직접 입력으로 전환 */}
              <button
                onClick={() => setMode('type')}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 14, border: '1.5px dashed #D1D5DB',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>+</span> 직접 입력
              </button>
            </>
          )}

          {/* ── 직접 입력 모드 ── */}
          {mode === 'type' && (
            <>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && input.trim() && onSave(input.trim())}
                placeholder="이름을 입력하세요"
                autoFocus
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: 16,
                  border: '2px solid #E5E7EB',
                  background: '#F9FAFB',
                  fontSize: 18, fontWeight: 700,
                  color: '#111827', outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 12,
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB' }}
              />

              <button
                onClick={() => input.trim() && onSave(input.trim())}
                disabled={!input.trim()}
                style={{
                  width: '100%', padding: '15px',
                  borderRadius: 16, border: 'none',
                  background: input.trim() ? '#111827' : '#E5E7EB',
                  color: input.trim() ? '#fff' : '#9CA3AF',
                  fontSize: 16, fontWeight: 800, cursor: input.trim() ? 'pointer' : 'default',
                  marginBottom: 12,
                  boxShadow: input.trim() ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                입장하기
              </button>

              {members.length > 0 && (
                <button
                  onClick={() => setMode('select')}
                  style={{
                    width: '100%', padding: '12px',
                    borderRadius: 14, border: '1.5px solid #E5E7EB',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, color: '#6B7280',
                  }}
                >
                  ← 목록에서 선택
                </button>
              )}
            </>
          )}

          {/* 취소 */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '10px',
                background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13,
                color: '#C4B9AC', marginTop: 8, fontWeight: 500,
              }}
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
