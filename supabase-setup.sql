-- ================================================
-- 당번 관리 앱 - Supabase 초기 설정 SQL
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ================================================

-- 1. 팀원 테이블
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 스케줄 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  member1_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  member2_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  is_off BOOLEAN DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security (로그인한 사용자만 접근 가능)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 팀원 테이블: 로그인한 사용자 모두 읽기/쓰기 가능
CREATE POLICY "authenticated_all_team_members" ON team_members
  FOR ALL USING (auth.role() = 'authenticated');

-- 스케줄 테이블: 로그인한 사용자 모두 읽기/쓰기 가능
CREATE POLICY "authenticated_all_schedules" ON schedules
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
