'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getMemberColor } from '@/lib/colors'

interface Member { id: string; name: string }

const BG = '#F0EBE1'

export default function SettingsClient() {
  const [members, setMembers] = useState<Member[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setUserName(localStorage.getItem('duty_user_name'))
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setMembers(data || [])
  }

  const add = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('team_members').insert({ name: newName.trim() })
    setNewName(''); await fetchMembers(); setLoading(false)
  }

  const update = async (id: string) => {
    if (!editingName.trim()) return
    setLoading(true)
    const old = members.find(m => m.id === id)
    await supabase.from('team_members').update({ name: editingName.trim() }).eq('id', id)
    if (old && userName === old.name) {
      localStorage.setItem('duty_user_name', editingName.trim())
      setUserName(editingName.trim())
    }
    setEditingId(null); await fetchMembers(); setLoading(false)
  }

  const del = async (id: string) => {
    if (!confirm('정말 삭제할까요?')) return
    setLoading(true)
    await supabase.from('team_members').delete().eq('id', id)
    await fetchMembers(); setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: BG, colorScheme: 'light', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{ background: BG, position: 'sticky', top: 0, zIndex: 10, borderBottom: '1.5px solid #1a1a1a' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/calendar" style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#e8e0d4', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#555', fontSize: 18, textDecoration: 'none', flexShrink: 0,
          }}>‹</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              TEAM
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', lineHeight: 1, letterSpacing: '-0.02em' }}>
              팀원 관리
            </div>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 800, color: '#6B7280',
            background: '#e8e0d4', padding: '4px 12px', borderRadius: 99,
          }}>
            {members.length}명
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 새 팀원 추가 ── */}
        <div style={{
          background: '#fff',
          border: '1.5px solid #1a1a1a',
          borderRadius: 12,
          padding: '16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            새 팀원 추가
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="이름을 입력하세요"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1.5px solid #e5e7eb',
                background: '#fafafa',
                fontSize: 15,
                color: '#1a1a1a',
                outline: 'none',
                fontWeight: 500,
              }}
              onFocus={e => { e.target.style.borderColor = '#1a1a1a'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa' }}
            />
            <button
              onClick={add}
              disabled={loading || !newName.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                background: newName.trim() ? '#1a1a1a' : '#e5e7eb',
                color: newName.trim() ? '#fff' : '#9CA3AF',
                fontSize: 14, fontWeight: 800,
                border: 'none', cursor: newName.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
                letterSpacing: '0.03em',
              }}
            >
              추가
            </button>
          </div>
        </div>

        {/* ── 팀원 목록 ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            팀원 목록
          </div>

          {members.length === 0 ? (
            <div style={{
              background: '#fff', border: '1.5px solid #e5e7eb',
              borderRadius: 12, padding: '48px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>팀원을 추가해주세요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map((m, i) => {
                const c = getMemberColor(i)
                const isMe = userName === m.name

                if (editingId === m.id) {
                  return (
                    <div key={m.id} style={{
                      background: '#fff', border: `1.5px solid ${c.bg}`,
                      borderRadius: 12, padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: c.bg, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 900, flexShrink: 0,
                      }}>
                        {editingName[0] || m.name[0]}
                      </div>
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') update(m.id); if (e.key === 'Escape') setEditingId(null) }}
                        autoFocus
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8,
                          border: `1.5px solid ${c.bg}`, background: '#fafafa',
                          fontSize: 15, fontWeight: 600, color: '#1a1a1a', outline: 'none',
                        }}
                      />
                      <button onClick={() => update(m.id)} style={{
                        padding: '8px 14px', borderRadius: 8,
                        background: c.bg, color: '#fff',
                        fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                      }}>저장</button>
                      <button onClick={() => setEditingId(null)} style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: '#f3f4f6', color: '#6B7280',
                        fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                      }}>취소</button>
                    </div>
                  )
                }

                return (
                  <div key={m.id} style={{
                    background: '#fff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'border-color 0.15s',
                  }}>
                    {/* 컬러 아바타 */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: c.bg, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 900, flexShrink: 0,
                      boxShadow: `0 3px 8px ${c.bg}50`,
                    }}>
                      {m.name[0]}
                    </div>

                    {/* 이름 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{m.name}</span>
                        {isMe && (
                          <span style={{
                            fontSize: 10, fontWeight: 800,
                            color: '#fff', background: c.bg,
                            padding: '2px 8px', borderRadius: 99,
                          }}>나</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 1 }}>
                        팀원 {i + 1}
                      </div>
                    </div>

                    {/* 버튼 */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingId(m.id); setEditingName(m.name) }}
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          background: c.light, color: c.bg,
                          fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                        }}
                      >수정</button>
                      <button
                        onClick={() => del(m.id)}
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          background: '#FEE2E2', color: '#EF4444',
                          fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                        }}
                      >삭제</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#C4B9AC', fontWeight: 500 }}>
          변경사항은 팀원 모두에게 실시간 반영됩니다
        </p>
      </div>
    </div>
  )
}
