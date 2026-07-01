# 팀원 추가 안 되던 문제 — 원인 및 조치 (2026-07-01)

## 증상
`duty-manager-2.vercel.app`에서 설정 > 팀원 관리 화면에서 이름을 입력하고 "추가"를 눌러도
아무 반응 없이 팀원이 추가되지 않음. 에러 메시지도 뜨지 않음.

## 진짜 원인
Vercel의 `duty-manager-2` 프로젝트에 등록된 환경변수
`NEXT_PUBLIC_SUPABASE_ANON_KEY` 값 맨 앞에 눈에 보이지 않는
UTF-8 BOM(U+FEFF) 문자가 섞여 있었음.

- `NEXT_PUBLIC_` 환경변수는 빌드 시점에 문자열 그대로 클라이언트 JS 번들에 박힘
- 이 오염된 값이 Supabase 요청의 `apikey` HTTP 헤더 값으로 쓰이는 순간,
  브라우저 Fetch API 스펙상 `Headers.set()`이
  `TypeError: Failed to execute 'set' on 'Headers': String contains non ISO-8859-1 code point`
  에러를 던짐
- 그 결과 해당 코드 경로의 **모든 Supabase 요청(추가뿐 아니라 목록 조회도 포함)이
  전부 실패**
- 앱 코드가 `.insert()` / `.select()` 결과의 `error` 필드를 전혀 체크하지 않고 있어서,
  실패가 화면에 아무 흔적도 없이 조용히 묻혀버림 (버튼이 "안 눌리는 것"처럼 보인 이유)

## 부수적으로 함께 발견/수정한 문제
1. **GoTrueClient 다중 인스턴스 경고** — `createClient()`를 렌더될 때마다 새로 호출해서
   Supabase 클라이언트가 매번 새로 생성되던 문제. `lib/supabase/client.ts`를
   모듈 레벨 싱글턴으로 변경해서 해결.
2. **관리자 락 화면 오표시 버그** — 첫 팀원(관리자) 추가 직후 `setUserName()` 호출 뒤
   바로 `fetchMembers()`를 부르면서, React 상태 업데이트가 비동기라 `fetchMembers` 클로저가
   구(舊) `userName` 값을 참조 → 방금 추가한 관리자를 못 찾아서 "관리자 전용 페이지"
   락 화면이 잘못 뜸. `fetchMembers(addedName)`처럼 이름을 명시적으로 넘기도록 수정.

## 조치 내역
```bash
# duty-manager-2 프로젝트 기준, BOM 없는 값으로 재등록
npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
npx vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes
printf '%s' 'https://qqxjaakunjaytzrngttu.supabase.co' | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
printf '%s' '<anon key>' | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```
`printf '%s'`를 사용해 BOM이나 개행 문자가 섞여 들어가지 않도록 함.

`lib/supabase/client.ts`를 싱글턴 패턴으로 수정, `components/SettingsClient.tsx`의
`add()` 함수에서 `fetchMembers()` 호출 시 이름을 명시적으로 전달하도록 수정 후 재배포.

## 검증한 내용 (실제 확인)
- 런타임에서 `Headers.prototype.set`을 패치해 `apikey` 헤더 값에 비-라틴 문자가
  없음을 직접 확인
- 실제 클릭으로 팀원 추가 → 네트워크 요청이 `201`(insert) / `200`(목록 조회)로 성공
- Supabase DB에 직접 SQL 쿼리(`SELECT * FROM team_members`)로 추가한 행이
  실제로 저장된 것을 확인
- 테스트 완료 후 테스트 데이터는 삭제, `duty-manager-2`는 다시 빈 상태로 정리함

## 참고 / 주의사항
- 앞으로 Vercel 환경변수를 PowerShell이나 텍스트 편집기에서 복사해 넣을 때
  BOM이 섞여 들어갈 수 있으니, 값을 재등록할 때는 `printf '%s' 'value' | vercel env add ...`
  방식을 쓰는 게 안전함
- `.insert()`/`.select()` 등 Supabase 호출 결과의 `error` 필드를 체크하지 않으면
  이런 종류의 실패가 UI에서 완전히 안 보이게 되므로, 향후 유사 버그 재발 방지를 위해
  주요 DB 호출부에 에러 체크를 추가하는 것을 고려할 것
