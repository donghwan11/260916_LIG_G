# 🧬 LIG DNA DOTO APP (스마트 업무 & 목표 관리 웹앱)

> **LIG 혁신 DNA와 업무 자동화를 결합한 생산성 To-Do & 프로젝트 관리 웹 애플리케이션**

Python Flask와 SQLite로 구축된 빠르고 세련된 고성능 웹 애플리케이션입니다.  
방위산업 R&D, RPA 업무자동화, 디지털 혁신, 경영기획 과제를 체계적으로 관리할 수 있습니다.

---

## 🌟 주요 기능

1. **🧬 LIG DNA 특화 카테고리 관리**
   - `⚡ 업무자동화 (RPA/스크립트)`
   - `🛡️ 방위산업/R&D (SW 아키텍처/무인기/알고리즘)`
   - `🧬 디지털혁신 (사내 프롬프트 경진대회/DNA 포털)`
   - `📊 경영기획 (SCM 공급망 리스크/사업분석)`
   - `📝 일반업무 (운영 가이드라인/체크리스트)`

2. **📊 실시간 KPI 대시보드 & 완수율 프로그레스 바**
   - 전체 과제 수, 진행 중, 완료됨, 오늘 마감/지연 과제 수 자동 집계
   - 목표 완수율(%) 시각화 게이지

3. **⚡ 원클릭 상태 순환 토글 (Status Cycle)**
   - 체크박스 클릭 시 `[대기 중 ➔ 진행 중 ➔ 완료]` 순서로 스마트 순환

4. **💡 AI 업무 추천 템플릿 (AI Assistant Preset)**
   - LIG 실무 및 업무자동화 시나리오 기반 맞춤형 과제 원클릭 자동 추가

5. **🔍 강력한 실시간 필터 & 검색**
   - 카테고리 탭 필터링
   - 상태(대기/진행/완료) 및 우선순위(긴급/높음/보통/낮음) 다중 필터
   - 업무명 및 설명 실시간 디바운스 검색

6. **📥 데이터 내보내기 & 복원**
   - Excel 호환 한글 UTF-8 BOM CSV 내보내기
   - JSON 백업 데이터 내보내기
   - 샘플 데이터 원클릭 복원 기능

7. **🌙 다크 모드 / 라이트 모드 지원**
   - 사용자 환경설정 로컬스토리지 자동 저장

8. **📈 KPI 관리 툴 (`/kpi`)**
   - LIG DNA 카테고리별 KPI 등록 (목표치/실적치/단위)
   - 실적치 입력 시 달성률(%) 자동 계산 및 달성/순항/위험 상태 자동 분류
   - 전체 KPI 평균 달성률 및 상태별 집계 대시보드

---

## 🚀 실행 방법

### 방법 1: `run.bat` 더블 클릭 (가장 쉬운 방법)
`LIG_DNA_DOTO_APP` 폴더 안의 **`run.bat`** 파일을 더블 클릭하면 자동으로 Flask 서버가 실행되고 웹 브라우저가 열립니다.

### 방법 2: 터미널 명령어로 실행
```bash
# 1. 폴더 이동
cd LIG_DNA_DOTO_APP

# 2. Flask 서버 실행
python app.py
```
서버 실행 후 브라우저에서 **`http://127.0.0.1:5000`** 으로 접속합니다.

---

## 📁 폴더 구조

```text
LIG_DNA_DOTO_APP/
├── app.py              # Flask 메인 애플리케이션 및 REST API 엔드포인트
├── database.py         # SQLite 데이터베이스 레이어 (CRUD & 통계)
├── requirements.txt    # 필요 파이썬 패키지 목록 (Flask)
├── run.bat             # 원클릭 실행 스크립트
├── README.md           # 설명 문서
├── templates/
│   ├── index.html      # 시맨틱 반응형 메인 UI 템플릿 (업무 관리)
│   └── kpi.html        # KPI 관리 페이지 템플릿
└── static/
    ├── css/
    │   ├── style.css   # 글래스모피즘 & 모던 테크 디자인 시스템
    │   └── kpi.css     # KPI 카드 & 진행률 바 스타일
    └── js/
        ├── app.js      # 비동기 통신 및 반응형 인터랙션 로직 (업무 관리)
        └── kpi.js      # KPI CRUD 및 대시보드 로직
```

---

## 🔌 REST API 엔드포인트

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/todos` | 업무 목록 조회 (카테고리, 상태, 우선순위, 검색어 필터 지원) |
| `POST` | `/api/todos` | 새 업무 등록 |
| `GET` | `/api/todos/<id>` | 특정 업무 상세 조회 |
| `PUT` | `/api/todos/<id>` | 업무 내용 수정 |
| `PATCH`| `/api/todos/<id>/toggle` | 업무 상태 순환 (대기 ➔ 진행 ➔ 완료) |
| `DELETE`| `/api/todos/<id>` | 업무 삭제 |
| `GET` | `/api/stats` | 대시보드 통계 요약 (완수율, 카테고리별 집계 등) |
| `POST` | `/api/reset` | LIG DNA 샘플 데이터로 복원 |
| `GET` | `/api/export` | CSV / JSON 데이터 다운로드 |
| `GET` | `/kpi` | KPI 관리 페이지 |
| `GET` | `/api/kpis` | KPI 목록 조회 (카테고리, 검색어 필터 지원) |
| `POST` | `/api/kpis` | 새 KPI 등록 |
| `GET` | `/api/kpis/<id>` | 특정 KPI 상세 조회 |
| `PUT` | `/api/kpis/<id>` | KPI 목표치/실적치 등 수정 |
| `DELETE`| `/api/kpis/<id>` | KPI 삭제 |
| `GET` | `/api/kpis/stats` | KPI 대시보드 통계 (평균 달성률, 상태별 집계) |
