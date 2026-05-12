# 프로젝트 개요

온라인 교육 플랫폼의 수강 신청 흐름을 3단계 멀티스텝 폼으로 구현한 라이브클래스 과제입니다. 개인 신청과 단체 신청을 분기 처리하고, 단계별 유효성 검증, 최종 제출 검증, 서버 에러 처리, 임시 저장 복구까지 포함합니다.

# 기술 스택

- Next.js 16 App Router
- TypeScript
- React Hook Form + Zod
- TanStack Query
- Zustand
- Tailwind CSS v4
- Next Route Handler 기반 Mock API
- Vitest

# 기술 스택 선택 이유

- Next.js 16 App Router: UI와 API(route handler)를 한 저장소에서 관리할 수 있어 과제 범위에서 개발/검증 속도를 높일 수 있습니다.
- TypeScript: 폼 데이터, API 응답, 검증 스키마의 타입을 일관되게 유지해 리팩터링 안전성을 확보할 수 있습니다.
- React Hook Form + Zod: 입력 상태 관리와 스키마 기반 검증을 결합해 복잡한 다단계 폼에서도 선언적으로 규칙을 유지할 수 있습니다.
- TanStack Query: 강의 목록 조회와 제출 mutation의 로딩/에러/재시도 상태를 표준화해 비동기 흐름을 단순화할 수 있습니다.
- Zustand: 현재 스텝, 카테고리, dirty 여부 같은 폼 외부 UI 상태를 가볍게 분리해 컴포넌트 결합도를 낮출 수 있습니다.
- Tailwind CSS v4: 빠른 UI 반복과 일관된 디자인 토큰 관리에 유리하며, 컴포넌트 단위 스타일 수정 비용이 낮습니다.
- Next Route Handler 기반 Mock API: 별도 백엔드 없이도 서버 검증/에러 코드를 흉내 내며 프론트 요구사항을 완결적으로 검증할 수 있습니다.
- Vitest: TypeScript 친화적인 빠른 테스트 러너로 스키마/변환 로직 회귀 테스트를 짧은 피드백 루프로 운영할 수 있습니다.

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

- `npm run test`: 검증 스키마와 payload 변환 로직 테스트를 실행합니다.
- `npm run build`: 프로덕션 빌드를 생성하며 타입 및 라우팅 구성을 함께 검증합니다.
- `npm run start`: 빌드된 결과물을 기준으로 프로덕션 서버를 실행합니다.

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
- 참가자 이메일은 중복 불가로 해석했고, 클라이언트와 서버 양쪽에서 모두 검증합니다.
- 정원이 거의 찬 강의는 잔여 좌석 배지를 별도로 표시하고, 정원 마감 강의는 선택 불가 처리했습니다.
- 제출 실패 시 입력 데이터는 유지되며, localStorage 초안도 남겨 재시도가 가능하도록 했습니다.
- Mock API는 Next.js route handler로 구성했고, 서버 재시작 전까지 메모리 상태를 유지합니다.

# 설계 결정과 이유

- 폼 상태는 React Hook Form을 단일 소스로 유지하고, 흐름 상태(스텝/카테고리/dirty)는 별도 스토어로 분리해 관심사를 나눴습니다.
- 검증 규칙은 클라이언트와 서버에서 공유 가능한 공통 스키마를 기반으로 두고, Step1/Step2 전환 검증에는 별도 step schema를 사용해 단계별 책임을 분리했습니다.
- Step 전환 검증과 최종 제출 검증을 분리해, 사용자는 단계별 피드백을 받고 서버 제출 직전에도 한 번 더 안전장치를 거치도록 설계했습니다.
- 제출 실패 시 입력값을 보존하고 localStorage 초안을 유지해 재시도 UX를 우선했습니다.

# 주요 검증 규칙

- 이메일: `local@domain.tld` 형식이며 TLD는 2자 이상이어야 합니다.
- 전화번호: 입력값에서 숫자만 추출한 뒤 한국 휴대폰 번호 패턴(010/011/016/017/018/019, 총 10~11자리)으로 검증합니다.
- 단체 신청: 참가자 이메일 중복 불가, 참가자 수와 신청 인원수 일치가 필요합니다.

# 미구현 / 제약사항

- 브라우저 새로고침/닫기(beforeunload)와 브라우저 뒤로가기(popstate)에 대해서는 이탈 방지 확인 대화상자를 제공하지만, 앱 라우터 전환 전반을 포괄하는 커스텀 차단 UX는 추가 구현 여지가 있습니다.
- Mock API는 인메모리 저장소이므로 서버 재시작 시 신청 이력과 정원 상태가 초기화됩니다.
- 서버 측 field error는 `details`를 기준으로 가능한 입력 필드에 매핑하지만, 서버가 내려주는 모든 경로를 UI 친화적으로 재가공하는 고도화는 추가 구현 여지가 있습니다.

# AI 활용 범위

- 초기 구조 설계, 컴포넌트 초안 작성, README 정리에 github copilot의 GPT-5.4 모델을 사용했습니다.
- 상태 구조, 요구사항 해석, 예외 처리 정책, 최종 코드 수정 및 검증에서도 copilot의 조언과 코드 수정 능력을 통해 과제의 요구사항과 사용자 경험을 모두 충족시키려 노력했습니다.
- copilot의 제안 기술들 및 제작된 코드를 이해하기 위해 끈임없이 질문하고 분석하며 가장 타당하다고 생각되는 최종 코드와 애플리케이션 구조를 선택하였습니다.
- 일관된 커밋 메세지를 작성하기 위해서도 copilot을 사용했습니다.
