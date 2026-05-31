'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Member { id: string; name: string }

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
    const { data } = await supabase.from('team_members').select('*').order('name')
    setMembers(data || [])
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('team_members').insert({ name: newName.trim() })
    setNewName('')
    await fetchMembers()
    setLoading(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    setLoading(true)
    const old = members.find(m => m.id === id)
    await supabase.from('team_members').update({ name: editingName.trim() }).eq('id', id)
    if (old && userName === old.name) {
      localStorage.setItem('duty_user_name', editingName.trim())
      setUserName(editingName.trim())
    }
    setEditingId(null)
    await fetchMembers()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제할까요?')) return
    setLoading(true)
    await supabase.from('team_members').delete().eq('id', id)
    await fetchMembers()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/calendar"
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-light transition-colors touch-manipulation">
            ‹
          </Link>
          <h1 className="text-lg font-bold text-gray-800 flex-1">팀원 관리</h1>
          {userName && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">{userName[0]}</span>
              <span className="hidden sm:block">{userName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* 추가 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">새 팀원 추가</p>
          <div className="flex gap-2">
            <input
              type="text" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="이름 입력"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
            />
            <button onClick={handleAdd} disabled={loading || !newName.trim()}
              className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 touch-manipulation">
              추가
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              팀원 목록 <span className="font-normal normal-case text-gray-300 ml-1">{members.length}명</span>
            </p>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-300">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">팀원을 추가해주세요</p>
            </div>
          ) : (
            <ul>
              {members.map((member, idx) => (
                <li key={member.id}
                  className={`${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2 p-4">
                      <input
                        type="text" value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate(member.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        className="flex-1 border-2 border-indigo-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      />
                      <button onClick={() => handleUpdate(member.id)}
                        className="px-3 py-2.5 bg-indigo-500 text-white text-xs font-semibold rounded-xl touch-manipulation">저장</button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-2.5 bg-gray-100 text-gray-600 text-xs rounded-xl touch-manipulation">취소</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                        {member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{member.name}</span>
                        {userName === member.name && (
                          <span className="ml-2 text-xs text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-full">나</span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(member.id); setEditingName(member.name) }}
                          className="px-3 py-2 text-xs text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium touch-manipulation transition-colors">
                          수정
                        </button>
                        <button onClick={() => handleDelete(member.id)}
                          className="px-3 py-2 text-xs text-red-400 bg-red-50 hover:bg-red-100 rounded-lg touch-manipulation transition-colors">
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-center text-gray-300 pb-4">모든 사용자와 실시간으로 공유됩니다</p>
      </main>
    </div>
  )
}
