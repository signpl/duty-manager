'use client'

import { useEffect } from 'react'

const EMOJIS = [
  // 표시/상태
  '✅','❌','⚠️','📌','🔔','💡','⭐','🔥','❗','❓','💯','🎯',
  // 표정/사람
  '😊','😅','😢','😡','🙏','👍','👎','💪','👏','🤝','😴','🤒',
  // 업무/사물
  '📋','📝','📞','📅','📂','🔑','💊','🏥','🚗','🏠','🍽️','⏰',
  // 자연/날씨
  '☀️','🌙','🌸','🍀','❄️','🌈','💧','🎉','🎊','🌿','🌺','🍁',
]

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
  // 바깥 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999 }}>
      {/* 딤 */}
      <div
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* 피커 패널 */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'#fff', colorScheme:'light',
        borderRadius:'20px 20px 0 0',
        padding:'16px 16px 36px',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',
      }}>
        {/* 핸들 */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:'#D1D5DB' }}/>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#1F2937' }}>이모지 선택</div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'50%',
            background:'#F3F4F6', border:'none', cursor:'pointer',
            fontSize:16, color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>

        {/* 이모지 그리드 */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:4,
          maxHeight:220, overflowY:'auto',
        }}>
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose() }}
              style={{
                fontSize:26, background:'#F9FAFB', border:'none',
                borderRadius:10, padding:'8px 0', cursor:'pointer',
                lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background 0.1s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#EEF2FF' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#F9FAFB' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
