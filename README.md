# 프로젝트 개요

온라인 교육 플랫폼의 수강 신청 흐름을 3단계 멀티스텝 폼으로 구현한 라이브클래스 과제입니다. 개인 신청과 단체 신청을 분기 처리하고, 스텝 단위 검증, 최종 제출 검증, 서버 에러 처리, 임시 저장 복구를 포함합니다.

# 기술 스택

- Next.js 16 App Router
- TypeScript
- React Hook Form + Zod
- TanStack Query
- Zustand
- Tailwind CSS v4
- Next Route Handler 기반 Mock API
- Vitest

# 실행 방법

- 권장 Node.js 버전: 20 이상

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

## 기타 스크립트

```bash
npm run test
npm run build
npm run start
```

# Mock 데이터/서버 구성 방법

- 별도 서버를 두지 않고 Next.js App Router의 route handler로 mock API를 구성했습니다.
- 강의 목록 조회는 src/app/api/courses/route.ts, 신청 제출은 src/app/api/enrollments/route.ts 에 구현했습니다.
- Mock 데이터와 인메모리 상태는 src/lib/mock-data.ts 에서 관리합니다.
- npm run dev 실행 시 프론트엔드와 mock API가 함께 구동됩니다.
- 서버를 재시작하면 신청 이력, 정원 상태, 중복 신청 기록은 초기화됩니다.

# 프로젝트 구조 설명

- src/app: App Router 페이지, 전역 레이아웃, route handler
- src/components: 멀티스텝 폼 메인 UI
- src/lib: 타입, 검증 스키마, mock 데이터, API 유틸
- src/store: Zustand 기반 UI 상태 저장소
- src/__tests__: 검증 및 payload 변환 테스트

# 요구사항 해석 및 가정

- 단체 신청에서 개인 신청으로 전환할 때 단체 입력값이 있으면 확인 모달을 띄우고, 확인 후 단체 정보를 초기화합니다.
- 참가자 이메일은 중복 불가로 해석했고 클라이언트/서버에서 모두 검증합니다.
- 정원이 거의 찬 강의는 잔여 좌석 배지를 별도로 표시하고, 정원 마감 강의는 선택 불가 처리했습니다.
- 제출 실패 시 입력 데이터는 유지되며, localStorage 초안도 남겨 재시도가 가능합니다.
- Mock API는 Next.js route handler로 구성했고 서버 재시작 전까지는 메모리 상태를 유지합니다.

# 설계 결정과 이유

- 폼 값은 React Hook Form 하나를 단일 소스로 유지했습니다. Zustand는 현재 스텝, 카테고리 필터, dirty 여부처럼 폼 외부 UI 상태만 관리합니다.
- App Router를 선택한 이유는 과제 권장사항을 반영하면서도 mock API를 같은 리포지토리 안에서 route handler로 단순하게 구현할 수 있기 때문입니다.
- TanStack Query는 강의 목록 조회와 제출 mutation의 로딩/에러 상태를 일관되게 다루기 위해 사용했습니다.
- Zod 스키마를 클라이언트와 서버에서 공유해 검증 규칙의 분산을 줄였습니다.

# 주요 검증 규칙

- 이메일: `local@domain.tld` 형식이며 TLD는 2자 이상이어야 합니다.
- 전화번호: 입력값에서 숫자만 추출한 뒤 한국 휴대폰 번호 패턴(010/011/016/017/018/019, 총 10~11자리)으로 검증합니다.
- 단체 신청: 참가자 이메일 중복 불가, 참가자 수와 신청 인원수 일치가 필요합니다.

# 미구현 / 제약사항

- 브라우저 내 뒤로가기 차단은 beforeunload 중심으로만 처리했습니다. 라우터 이동 차단 UX는 추가 구현 여지가 있습니다.
- Mock API는 인메모리 저장소이므로 서버 재시작 시 신청 이력과 정원 상태가 초기화됩니다.
- 서버 측 field error를 각 입력 필드에 자동 매핑하는 부분은 최소 수준으로 두고, 현재는 핵심 에러 코드를 중심으로 UI에 노출합니다.

# AI 활용 범위

- 초기 구조 설계, 컴포넌트 초안 작성, README 정리에 AI 도구를 사용했습니다.
- 상태 구조, 요구사항 해석, 예외 처리 정책, 최종 코드 수정 및 검증은 직접 판단해 반영했습니다.

