'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getMemberColor } from '@/lib/colors'

interface Member { id:string; name:string }

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
    const {data} = await supabase.from('team_members').select('*').order('created_at')
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
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white" style={{boxShadow:'0 1px 0 #f0f0f0'}}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/calendar"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-xl font-black text-gray-900 flex-1">팀원 관리</h1>
          <span className="text-sm text-gray-400 font-medium">{members.length}명</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {/* 팀원 추가 */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">새 팀원 추가</p>
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&add()}
              placeholder="이름 입력"
              className="flex-1 rounded-2xl px-4 py-4 text-base font-semibold focus:outline-none"
              style={{background:'#F5F5F5',border:'2px solid transparent'}}
              onFocus={e=>{e.target.style.borderColor='#6366f1'}}
              onBlur={e=>{e.target.style.borderColor='transparent'}}/>
            <button onClick={add} disabled={loading||!newName.trim()}
              className="px-6 rounded-2xl text-base font-bold text-white touch-manipulation active:opacity-90 disabled:opacity-40"
              style={{background:'#6366f1'}}>
              추가
            </button>
          </div>
        </div>

        {/* 팀원 목록 */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">팀원 목록</p>

          {members.length===0?(
            <div className="text-center py-16 text-gray-300">
              <div className="text-5xl mb-3">👥</div>
              <p>팀원을 추가해주세요</p>
            </div>
          ):(
            <div className="space-y-2">
              {members.map((m,i)=>{
                const c = getMemberColor(i)
                return (
                  <div key={m.id} className="rounded-2xl overflow-hidden"
                    style={{background:'#FAFAFA',border:'1px solid #F0F0F0'}}>
                    {editingId===m.id?(
                      <div className="flex items-center gap-2 p-3">
                        <input type="text" value={editingName} onChange={e=>setEditingName(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter') update(m.id); if(e.key==='Escape') setEditingId(null) }}
                          autoFocus
                          className="flex-1 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none"
                          style={{background:'#fff',border:`2px solid ${c.bg}`}}/>
                        <button onClick={()=>update(m.id)}
                          className="px-4 py-3 rounded-xl text-sm font-bold text-white touch-manipulation"
                          style={{background:c.bg}}>저장</button>
                        <button onClick={()=>setEditingId(null)}
                          className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 touch-manipulation"
                          style={{background:'#EFEFEF'}}>취소</button>
                      </div>
                    ):(
                      <div className="flex items-center gap-3 p-3">
                        {/* 컬러 아바타 */}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                          style={{background:c.bg}}>
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-gray-800">{m.name}</span>
                            {userName===m.name&&(
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                                style={{background:c.bg}}>나</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={()=>{setEditingId(m.id);setEditingName(m.name)}}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold touch-manipulation"
                            style={{background:c.light,color:c.bg}}>수정</button>
                          <button onClick={()=>del(m.id)}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 touch-manipulation"
                            style={{background:'#FFF0F0'}}>삭제</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
