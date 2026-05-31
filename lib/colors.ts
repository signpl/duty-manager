// 팀원마다 고유 색상 (배경, 글자색 쌍)
export const MEMBER_COLORS = [
  { bg: '#FF6B6B', text: '#fff', light: '#FFF0F0' },
  { bg: '#4DABF7', text: '#fff', light: '#E8F4FF' },
  { bg: '#51CF66', text: '#fff', light: '#EBFBEE' },
  { bg: '#CC5DE8', text: '#fff', light: '#F8ECFF' },
  { bg: '#FF922B', text: '#fff', light: '#FFF4E6' },
  { bg: '#20C997', text: '#fff', light: '#E6FCF5' },
  { bg: '#F06595', text: '#fff', light: '#FFF0F6' },
  { bg: '#339AF0', text: '#fff', light: '#E7F5FF' },
]

export function getMemberColor(index: number) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length]
}
