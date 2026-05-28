# LangGraph Service

Spring 백엔드의 분석 파이프라인에서 LLM 단계를 실제 LangGraph 런타임으로 처리하기 위한 서비스입니다.

## 실행

```bash
cd langgraph_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set OPENAI_API_KEY=YOUR_KEY
uvicorn app:app --host 0.0.0.0 --port 8001
```

## 연동

- Spring은 기본값으로 `http://localhost:8001/run` 호출
- 변경 시 `application.properties`에 아래 추가:

```properties
app.langgraph.base-url=http://localhost:8001
```
