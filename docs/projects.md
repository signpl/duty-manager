# 배포 프로젝트 구분

같은 코드베이스(이 저장소)를 Vercel 프로젝트 2개에 각각 배포해서 지점별로 독립된
서비스로 운영한다. 코드는 공유하지만 **Supabase 프로젝트(DB)와 Vercel 배포는 완전히
분리**되어 있다.

| 구분 | 용도 | 화면 표시 이름 | Vercel 프로젝트 | Supabase 프로젝트 | 배포 명령 |
|---|---|---|---|---|---|
| **duty-manager** | 화성지점 | `e - Mt` | `prj_UE5sGaJCMQS7PO4qn01b1Hrt5Ltl` (duty-manager.vercel.app) | (화성지점용 Supabase project) | `npm run deploy:main` |
| **duty-manager-2** | 분점 | `easy` | `prj_OWoqiX7HRwalBZz7vqod0MoFAYmk` (duty-manager-2.vercel.app) | `qqxjaakunjaytzrngttu` | `npm run deploy:branch` |

> **화면 표시 이름**은 스케줄러(달력) 상단 타이틀 위에 작은 라벨로 표시된다.
> 지점별로 다르게 나오도록 Vercel 환경변수 `NEXT_PUBLIC_APP_NAME`(Production)으로 관리하며,
> 라벨은 대문자 스타일이라 실제 화면에는 `E - MT` / `EASY`로 보인다.
> 값을 바꾸면 `NEXT_PUBLIC_` 변수 특성상 반드시 해당 프로젝트를 **재배포**해야 반영된다.

두 프로젝트 모두 org: `team_r5fa93CNscOnBSRQGjiiE4mt` (signpls-projects) 소속.

## 배포 방법

`.vercel/project.json`을 손으로 바꿔가며 `vercel --prod`를 직접 돌리지 말 것.
실수로 다른 지점에 잘못 배포되는 사고([fix-2026-07-01-team-member-add-bug.md](fix-2026-07-01-team-member-add-bug.md)
참고 — 환경변수 BOM 오염 사고와는 별개로, 배포 대상 자체를 헷갈리는 것도 위험 요소)를
막기 위해 아래 스크립트만 사용한다.

```bash
npm run deploy:main    # 화성지점(duty-manager)에 배포
npm run deploy:branch  # 분점(duty-manager-2)에 배포
```

이 스크립트는 `.vercel-configs/duty-manager.json` 또는 `.vercel-configs/duty-manager-2.json`을
`.vercel/project.json`으로 복사한 뒤, 어느 프로젝트로 배포되는지 콘솔에 출력하고
`vercel --prod --yes --force`를 실행한다.

## 환경변수 관리 시 주의

- 환경변수 값을 재등록할 때 PowerShell/텍스트 에디터에서 복사-붙여넣기하면
  BOM이나 개행이 섞여 들어갈 수 있다. 반드시 `printf '%s' 'value' | npx vercel env add ...`
  방식으로 등록할 것.
- `duty-manager`와 `duty-manager-2`는 서로 다른 Supabase 프로젝트를 쓰므로,
  환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를
  절대 서로 섞어서 등록하지 말 것.
