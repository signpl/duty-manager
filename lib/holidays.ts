// 한국 공휴일 데이터

// 고정 공휴일 (매년 동일)
const FIXED: { date: string; name: string }[] = [
  { date: '01-01', name: '신정' },
  { date: '03-01', name: '삼일절' },
  { date: '05-05', name: '어린이날' },
  { date: '06-06', name: '현충일' },
  { date: '08-15', name: '광복절' },
  { date: '10-03', name: '개천절' },
  { date: '10-09', name: '한글날' },
  { date: '12-25', name: '성탄절' },
]

// 음력 기반 공휴일 (연도별 고정)
const LUNAR: Record<string, { date: string; name: string }[]> = {
  '2024': [
    { date: '02-09', name: '설날연휴' },
    { date: '02-10', name: '설날' },
    { date: '02-11', name: '설날연휴' },
    { date: '02-12', name: '설날대체' },
    { date: '05-15', name: '부처님오신날' },
    { date: '09-16', name: '추석연휴' },
    { date: '09-17', name: '추석' },
    { date: '09-18', name: '추석연휴' },
  ],
  '2025': [
    { date: '01-28', name: '설날연휴' },
    { date: '01-29', name: '설날' },
    { date: '01-30', name: '설날연휴' },
    { date: '05-05', name: '부처님오신날' },
    { date: '10-05', name: '추석연휴' },
    { date: '10-06', name: '추석' },
    { date: '10-07', name: '추석연휴' },
    { date: '10-08', name: '추석대체' },
  ],
  '2026': [
    { date: '02-16', name: '설날연휴' },
    { date: '02-17', name: '설날' },
    { date: '02-18', name: '설날연휴' },
    { date: '05-24', name: '부처님오신날' },
    { date: '09-24', name: '추석연휴' },
    { date: '09-25', name: '추석' },
    { date: '09-26', name: '추석연휴' },
  ],
  '2027': [
    { date: '02-06', name: '설날연휴' },
    { date: '02-07', name: '설날' },
    { date: '02-08', name: '설날연휴' },
    { date: '05-13', name: '부처님오신날' },
    { date: '10-14', name: '추석연휴' },
    { date: '10-15', name: '추석' },
    { date: '10-16', name: '추석연휴' },
  ],
}

// dateStr: 'YYYY-MM-DD' 형식으로 공휴일 이름 반환, 없으면 null
export function getHolidayName(dateStr: string): string | null {
  const [year, month, day] = dateStr.split('-')
  const md = `${month}-${day}`

  // 고정 공휴일 확인
  const fixed = FIXED.find(h => h.date === md)
  if (fixed) return fixed.name

  // 음력 공휴일 확인
  const lunar = LUNAR[year]?.find(h => h.date === md)
  if (lunar) return lunar.name

  return null
}

// 공휴일 or 일요일이면 true (빨간 날)
export function isRedDay(dateStr: string, dayOfWeek: number): boolean {
  return dayOfWeek === 0 || getHolidayName(dateStr) !== null
}
