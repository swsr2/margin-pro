# 🛒 Shopee Margin Pro

> 쇼피(Shopee) 글로벌 셀러를 위한 마진 계산기

## 🌐 배포 사이트

**https://shopee-margin-pro.web.app**

---

## 📋 프로젝트 소개

Shopee Margin Pro는 동남아시아 및 남미 8개국 쇼피 마켓플레이스에서 판매하는 셀러들을 위한 마진 계산 도구입니다.

### ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🧮 **마진 계산** | 매입가, 판매가, 배송비, 환율, 수수료율 입력 → 순수익/마진율 자동 계산 |
| 🌏 **8개국 지원** | 싱가포르, 말레이시아, 필리핀, 베트남, 태국, 대만, 브라질, 멕시코 |
| 💾 **자동 저장** | Firebase Firestore에 계산 기록 자동 저장 |
| 📊 **엑셀 다운로드** | 전체 또는 국가별 필터링된 기록을 `.xlsx` 파일로 다운로드 |
| 🔍 **국가 필터** | 드롭다운으로 특정 국가 기록만 조회 |
| 🗑️ **삭제 기능** | 개별 기록 삭제 가능 |
| 📱 **반응형 디자인** | 모바일/태블릿/데스크탑 모두 지원 |

---

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Firebase Firestore (서버리스)
- **Hosting**: Firebase Hosting
- **Export**: SheetJS (xlsx)

---

## 🚀 로컬 실행 방법

### 사전 요구사항
- Node.js 18+

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# Firebase 배포
firebase deploy
```

---

## 📁 프로젝트 구조

```
shopee-seller-margin-pro/
├── App.tsx           # 메인 앱 컴포넌트 (Firebase 연동 포함)
├── types.ts          # TypeScript 타입 정의
├── utils/
│   └── formatters.ts # 통화/퍼센트 포맷 유틸리티
├── index.html        # HTML 템플릿
├── index.tsx         # React 엔트리포인트
├── firebase.json     # Firebase 호스팅 설정
├── vite.config.ts    # Vite 설정
└── package.json      # 의존성 관리
```

---

## 📄 라이선스

MIT License

---

## 👨‍💻 개발자

**swsr2**

