"""AI verification service. Supports OpenAI, Gemini, and a deterministic stub."""
from __future__ import annotations
import json
import os
import re
from typing import Any, Dict, List
import requests
from django.conf import settings

CATEGORY_PROMPTS: Dict[str, str] = {
    "reading": "Generate exactly 5 short comprehension questions about the user's reading. Return strict JSON: {\"questions\":[\"...\"]}",
    "coding": "Given the project description and repo URL, generate 5 technical questions to verify the user wrote and understands the code. Return strict JSON: {\"questions\":[...]}",
    "gym": "Generate 3 verification questions about the workout (intensity, exercises, form). Return strict JSON: {\"questions\":[...]}",
    "running": "Generate 3 questions to verify the run (pace, route, perceived effort). Return strict JSON: {\"questions\":[...]}",
    "meditation": "Generate 3 reflection questions about the meditation session. Return strict JSON: {\"questions\":[...]}",
    "fasting": "Generate 3 questions to verify the fast (hunger waves, hydration, energy). Return strict JSON: {\"questions\":[...]}",
}


def _openai_chat(messages: list, model: str = "gpt-4o-mini") -> str:
    key = settings.OPENAI_API_KEY
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": model, "messages": messages, "temperature": 0.4},
        timeout=45,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _gemini_chat(prompt: str) -> str:
    key = settings.GEMINI_API_KEY
    r = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=45,
    )
    r.raise_for_status()
    parts = r.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])
    return parts[0].get("text", "")


def _ai(prompt: str) -> str:
    if settings.AI_PROVIDER == "openai":
        return _openai_chat([{"role": "user", "content": prompt}])
    if settings.AI_PROVIDER == "gemini":
        return _gemini_chat(prompt)
    # stub
    return json.dumps({"questions": [f"Stub question {i+1} about your submission." for i in range(5)]})


def _parse_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return {"questions": []}


def generate_questions(category_slug: str, payload: Dict[str, Any]) -> List[str]:
    base = CATEGORY_PROMPTS.get(category_slug, "Generate 3 verification questions for the user's submitted habit proof.")
    prompt = f"{base}\n\nUser submission:\n{json.dumps(payload, default=str)}"
    raw = _ai(prompt)
    data = _parse_json(raw)
    questions = data.get("questions") or []
    return [str(q)[:300] for q in questions][:5]


def score_answers(category_slug: str, questions: List[str], answers: List[str], payload: Dict[str, Any]) -> Dict[str, Any]:
    prompt = (
        "You are verifying a user's habit completion. Grade their answers strictly.\n"
        f"Category: {category_slug}\nSubmission: {json.dumps(payload, default=str)}\n"
        f"Questions: {json.dumps(questions)}\nAnswers: {json.dumps(answers)}\n"
        "Return strict JSON: {\"score\": 0-100, \"confidence\": 0-100, \"feedback\": \"...\"}"
    )
    raw = _ai(prompt)
    data = _parse_json(raw)
    try:
        score = int(data.get("score", 0))
        conf = int(data.get("confidence", 0))
    except Exception:
        score, conf = 0, 0
    return {
        "score": max(0, min(100, score)),
        "confidence": max(0, min(100, conf)),
        "feedback": str(data.get("feedback", ""))[:1000],
    }
