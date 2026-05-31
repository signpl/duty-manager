'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Member { id:string; name:string }
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
const colorOf = (name:string) => COLORS[name.charCodeAt(0)%COLORS.length]

export default function SettingsClient() {
  const [members,setMembers] = useState<Member[]>([])
  const [newName,setNewName] = useState('')
  const [editingId,setEditingId] = useState<string|null>(null)
  const [editingName,setEditingName] = useState('')
  const [loading,setLoading] = useState(false)
  const [userName,setUserName] = useState<string|null>(null)
  const supabase = createClient()

  useEffect(()=>{ setUserName(localStorage.getItem('duty_user_name')); fetchMembers() },[])

  const fetchMembers = async () => {
    const {data} = await supabase.from('team_members').select('*').order('name')
    setMembers(data||[])
  }

  const add = async () => {
    if(!newName.trim()) return
    setLoading(true)
    await supabase.from('team_members').insert({name:newName.trim()})
    setNewName(''); await fetchMembers(); setLoading(false)
  }

  const update = async (id:string) => {
    if(!editingName.trim()) return
    setLoading(true)
    const old = members.find(m=>m.id===id)
    await supabase.from('team_members').update({name:editingName.trim()}).eq('id',id)
    if(old&&userName===old.name){ localStorage.setItem('duty_user_name',editingName.trim()); setUserName(editingName.trim()) }
    setEditingId(null); await fetchMembers(); setLoading(false)
  }

  const del = async (id:string) => {
    if(!confirm('정말 삭제할까요?')) return
    setLoading(true)
    await supabase.from('team_members').delete().eq('id',id)
    await fetchMembers(); setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{background:'#f5f5f7'}}>
      <header style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}
        className="sticky top-0 z-10 border-b border-black/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/calendar"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900 flex-1">팀원 관리</h1>
          {userName&&(
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{background:colorOf(userName)}}>
              {userName[0]}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* 추가 */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">새 팀원 추가</p>
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&add()}
              placeholder="이름 입력"
              className="flex-1 bg-gray-50 border-2 border-transparent focus:border-indigo-200 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors"/>
            <button onClick={add} disabled={loading||!newName.trim()}
              className="px-5 py-3 rounded-2xl text-white text-sm font-bold touch-manipulation active:opacity-90 disabled:opacity-40"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
              추가
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-black/5">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">팀원 목록</p>
            <span className="text-xs text-gray-300 font-medium">{members.length}명</span>
          </div>

          {members.length===0?(
            <div className="text-center py-16 text-gray-300">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-sm">팀원을 추가해주세요</p>
            </div>
          ):(
            <ul>
              {members.map((m,i)=>(
                <li key={m.id} className={i?'border-t border-gray-50':''}>
                  {editingId===m.id?(
                    <div className="flex items-center gap-2 px-4 py-3">
                      <input type="text" value={editingName} onChange={e=>setEditingName(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') update(m.id); if(e.key==='Escape') setEditingId(null) }}
                        autoFocus
                        className="flex-1 bg-gray-50 border-2 border-indigo-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"/>
                      <button onClick={()=>update(m.id)}
                        className="px-3 py-2.5 text-xs font-bold text-white rounded-xl touch-manipulation"
                        style={{background:'#6366f1'}}>저장</button>
                      <button onClick={()=>setEditingId(null)}
                        className="px-3 py-2.5 text-xs text-gray-500 bg-gray-100 rounded-xl touch-manipulation">취소</button>
                    </div>
                  ):(
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm"
                        style={{background:colorOf(m.name)}}>
                        {m.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                        {userName===m.name&&(
                          <span className="ml-2 text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">나</span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={()=>{setEditingId(m.id);setEditingName(m.name)}}
                          className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-xl font-medium touch-manipulation active:bg-gray-200">수정</button>
                        <button onClick={()=>del(m.id)}
                          className="px-3 py-2 text-xs text-red-400 bg-red-50 rounded-xl touch-manipulation active:bg-red-100">삭제</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-center text-gray-300 pb-6">변경사항은 팀원 모두에게 실시간 반영됩니다</p>
      </main>
    </div>
  )
}
