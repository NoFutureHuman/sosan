# sosan

캡스톤 — 소상공인 AI 창업·운영 분석

## 로컬 실행 (2개 터미널)

**요구사항:** JDK 17, Node.js

기존 사장님·신생 창업자 분석 모두 **Spring Boot 내부 LangGraph4j**에서 처리합니다.

### 1) Spring Boot (8081)

MySQL 없이 개발할 때:

```powershell
cd sosan-main
.\gradlew.bat bootRun -Pdev
```

MySQL 사용 시 `sosan-main\src\main\resources\application.properties` 의 DB 설정 후:

```powershell
cd sosan-main
.\gradlew.bat bootRun
```

### 2) 프론트 (5173)

```powershell
cd demo\frontend
copy .env.example .env
npm install
npm run dev
```

`.env` 예:

```
VITE_API_BASE=http://localhost:8081
```

---

## API 흐름

| 구분 | API | 엔진 |
|------|-----|------|
| 기존 사장님 | `POST /api/analysis/run` | Java LangGraph4j (`existinggraph`) |
| 신생 창업자 | `POST /api/analysis/evaluate`, `/new` | Java LangGraph4j (`NewStartupAnalysisService`) |

---

## 프로젝트 구조

```
demo/frontend/          ← React (npm run dev)
sosan-main/             ← Spring Boot 실행 (gradlew bootRun -Pdev)
src/main/java/          ← Java 소스 (공유)
sosan-main/src/main/resources/  ← 설정 파일
```

---

## 설정

| 파일 | 용도 |
|------|------|
| `sosan-main/src/main/resources/application.properties` | 공통 설정 (키는 비워 두고 local/env 사용) |
| `sosan-main/src/main/resources/application-local.properties` | 로컬 API 키 (Git 제외) |
| `sosan-main/src/main/resources/application-dev.properties` | `-Pdev` 시 H2 메모리 DB |
| `demo/frontend/.env` | `VITE_API_BASE=http://localhost:8081` |

`application.properties.example` 참고. **API 키는 GitHub에 올리지 마세요.**

---

## 포트

- 프론트: **5173**
- Spring: **8081**
