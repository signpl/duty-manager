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

-- 4. Row Level Security - 로그인 없이 누구나 읽기/쓰기 가능
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- anon(비로그인) 사용자도 모두 허용
CREATE POLICY "public_all_team_members" ON team_members
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "public_all_schedules" ON schedules
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;

-- ================================================
-- [마이그레이션] 권한(role) 컬럼 추가
-- 이미 team_members 테이블이 있는 경우 아래 SQL을 실행하세요
-- ================================================

-- 6. role 컬럼 추가 (admin / editor / viewer)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer';

-- 7. 장정아를 관리자로 설정 (이미 등록된 경우)
UPDATE team_members SET role = 'admin' WHERE name = '장정아';

-- ※ 장정아가 아직 추가되지 않은 경우, 앱에서 팀원 추가 후 아래 SQL을 따로 실행하세요:
-- UPDATE team_members SET role = 'admin' WHERE name = '장정아';
