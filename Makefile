.PHONY: frontend backend

frontend:
	cd frontend && npm run dev

backend:
	cd backend && uvicorn main:app --reload --port 8000
