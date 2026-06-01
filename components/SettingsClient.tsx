'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Member {
  id: string
  name: string
  is_admin: boolean
}

export default function SettingsClient() {
  const [members, setMembers] = useState<Member[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const name = localStorage.getItem('duty_user_name')
    setUserName(name)
    fetchMembers(name)
  }, [])

  const fetchMembers = async (currentName?: string | null) => {
    const { data } = await supabase.from('team_members').select('*').order('name')
    const list = data || []
    setMembers(list)
    const nameToCheck = currentName !== undefined ? currentName : userName
    if (nameToCheck) {
      const member = list.find((m: Member) => m.name === nameToCheck)
      setIsAdmin(member?.is_admin || false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('team_members').insert({ name: newName.trim() })
    setNewName('')
    await fetchMembers(null)
    setLoading(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    setLoading(true)
    await supabase.from('team_members').update({ name: editingName.trim() }).eq('id', id)
    // localStorage에 저장된 이름도 갱신
    const old = members.find(m => m.id === id)
    let newUserName = userName
    if (old && userName === old.name) {
      localStorage.setItem('duty_user_name', editingName.trim())
      setUserName(editingName.trim())
      newUserName = editingName.trim()
    }
    setEditingId(null)
    await fetchMembers(newUserName)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제할까요?')) return
    setLoading(true)
    await supabase.from('team_members').delete().eq('id', id)
    await fetchMembers(null)
    setLoading(false)
  }

  const handleToggleAdmin = async (id: string, current: boolean) => {
    setLoading(true)
    await supabase.from('team_members').update({ is_admin: !current }).eq('id', id)
    await fetchMembers(null)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/calendar" className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light">‹</Link>
          <h1 className="text-xl font-bold text-gray-800">팀원 관리</h1>
          {userName && (
            <span className="ml-auto text-sm text-gray-400 flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-semibold">
                {userName[0]}
              </span>
              {userName}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* 추가 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">새 팀원 추가</h2>
          {isAdmin ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="이름 입력"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleAdd}
                disabled={loading || !newName.trim()}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
              >
                추가
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              <span>🔒</span>
              <span>관리자만 팀원을 추가할 수 있습니다</span>
            </div>
          )}
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            팀원 목록 <span className="font-normal normal-case text-gray-400">({members.length}명)</span>
          </h2>

          {members.length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">팀원을 추가해주세요</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {members.map(member => (
                <li key={member.id} className="flex items-center gap-3 py-3 group">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {member.name[0]}
                  </div>

                  {editingId === member.id ? (
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate(member.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        className="flex-1 border-2 border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                      />
                      <button onClick={() => handleUpdate(member.id)} className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg">저장</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">취소</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">
                          {member.name}
                          {userName === member.name && (
                            <span className="ml-2 text-xs text-indigo-400 font-normal">나</span>
                          )}
                        </span>
                        {member.is_admin && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">관리자</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleAdmin(member.id, member.is_admin)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              member.is_admin
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {member.is_admin ? '권한 회수' : '관리자 지정'}
                          </button>
                          <button
                            onClick={() => { setEditingId(member.id); setEditingName(member.name) }}
                            className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-center text-gray-300">팀원 정보는 모든 사용자와 공유됩니다</p>
      </main>
    </div>
  )
}
