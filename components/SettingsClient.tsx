'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Member {
  id: string
  name: string
}

interface Props {
  user: User
  initialMembers: Member[]
}

export default function SettingsClient({ user, initialMembers }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const refreshMembers = async () => {
    const { data } = await supabase.from('team_members').select('*').order('name')
    setMembers(data || [])
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('team_members').insert({ name: newName.trim() })
    setNewName('')
    await refreshMembers()
    setLoading(false)
  }

  const handleEdit = (member: Member) => {
    setEditingId(member.id)
    setEditingName(member.name)
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    setLoading(true)
    await supabase.from('team_members').update({ name: editingName.trim() }).eq('id', id)
    setEditingId(null)
    await refreshMembers()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠어요? 해당 팀원이 배정된 스케줄도 영향을 받을 수 있어요.')) return
    setLoading(true)
    await supabase.from('team_members').delete().eq('id', id)
    await refreshMembers()
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/calendar" className="text-gray-400 hover:text-gray-600 text-xl transition-colors">‹</Link>
            <h1 className="text-xl font-bold text-gray-800">팀원 관리</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={user.user_metadata?.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              <span className="text-sm text-gray-600 hidden sm:block">{user.user_metadata?.name || user.email}</span>
            </div>
            <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">새 팀원 추가</h2>
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
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            팀원 목록
            <span className="ml-2 text-sm font-normal text-gray-400">({members.length}명)</span>
          </h2>

          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm">팀원을 추가해주세요</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {members.map(member => (
                <li key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 group">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
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
                        className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <button
                        onClick={() => handleUpdate(member.id)}
                        className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-800">{member.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(member)}
                          className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          팀원 정보는 모든 로그인 사용자와 공유됩니다
        </p>
      </main>
    </div>
  )
}
