import json
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

_SYSTEM_PROMPT = """You are Dr. GreenSpectra, a world-renowned plant pathologist with 30 years of field experience diagnosing crop diseases across 50+ countries. You have personally examined over 1 million infected crops and your diagnoses have saved billions of dollars in agricultural yield.

You think like a real doctor — you observe, reason, and give confident specific advice. You never give generic answers. Every recommendation you make is based on real agricultural science and real commercially available products with correct dosages.

When you analyze a crop image you naturally notice:
- The exact color, texture, shape and distribution of any abnormalities
- Whether lesions are fungal, bacterial or viral in origin
- The stage of infection and how fast it is likely spreading
- The exact environmental conditions that favor this disease
- The precise treatment protocol a real agronomist would prescribe

You have deep expertise in matching treatments to diseases:
- You know which fungicides work for which pathogens
- You know correct application rates from memory
- You know the biological timeline of each disease
- You give farmers advice they can act on today

You always respond in valid JSON only. Your reasoning is specific to what you actually see in the image, never generic. Your treatment recommendations are always real products with real dosages that actually work for the specific disease you diagnosed."""

_USER_PROMPT = """Disease identified: {disease}
Model confidence: {confidence:.1%}
All class probabilities: {all_probs_str}

Analyze this crop image carefully. Respond ONLY with valid JSON, absolutely no text outside the JSON brackets. Fill every single field with specific real information, never leave anything generic or empty:

{{
  "disease": "disease name",
  "confidence": 0.95,
  "reasoning": "specific visual evidence you see in this exact image",
  "visual_evidence": ["specific thing 1", "specific thing 2", "specific thing 3"],
  "summary": "2-3 sentence expert summary in simple farmer language",
  "severity": "mild or moderate or severe",
  "urgency": "Act within X hours/days",
  "urgency_label": "short urgency badge text",
  "what_is_this": ["bullet 1 about disease cause", "bullet 2 about how it spreads", "bullet 3 about impact on crop"],
  "action_plan": [
    {{"step": 1, "action": "specific action", "product": "real product name", "dosage": "exact dosage", "method": "exactly how to apply"}},
    {{"step": 2, "action": "specific action", "product": "real product name", "dosage": "exact dosage", "method": "exactly how to apply"}},
    {{"step": 3, "action": "specific action", "product": "real product name", "dosage": "exact dosage", "method": "exactly how to apply"}},
    {{"step": 4, "action": "specific action", "product": "real product name", "dosage": "exact dosage", "method": "exactly how to apply"}}
  ],
  "timeline": [
    {{"period": "Day 1", "action": "what to do today", "expected": "what you will see"}},
    {{"period": "Day 3", "action": "what to do", "expected": "what you will see"}},
    {{"period": "Week 2", "action": "what to do", "expected": "what you will see"}},
    {{"period": "Week 4", "action": "what to do", "expected": "what you will see"}}
  ],
  "yield_loss_risk": "X-Y% if untreated",
  "treatment_cost": "$X-Y per acre",
  "time_to_act": "X hours/days",
  "recovery_signals": ["sign 1", "sign 2", "sign 3", "sign 4"],
  "warning_signals": ["sign 1", "sign 2", "sign 3", "sign 4"],
  "prevention": [
    {{"tip": "tip name", "icon": "emoji", "description": "one sentence"}},
    {{"tip": "tip name", "icon": "emoji", "description": "one sentence"}},
    {{"tip": "tip name", "icon": "emoji", "description": "one sentence"}}
  ]
}}"""


def _urgency_enum(urgency_str: str) -> str:
    s = urgency_str.lower()
    if any(x in s for x in ["24 hour", "immediat", "today", "right now", "asap"]):
        return "immediate"
    if any(x in s for x in ["3 day", "three day", "48", "72"]):
        return "within_3_days"
    if any(x in s for x in ["week"]):
        return "within_week"
    return "monitor"


def _map_response(data: dict) -> dict:
    urgency_str = data.get("urgency") or ""
    action_plan = data.get("action_plan") or []
    prevention_items = data.get("prevention") or []
    what_is_this = data.get("what_is_this") or []

    treatment_steps = [
        {"step": s.get("step", i + 1), "action": s.get("action", ""), "product": s.get("product")}
        for i, s in enumerate(action_plan)
    ]

    if isinstance(prevention_items, list):
        prevention_str = " ".join(
            f"{p.get('tip', '')}: {p.get('description', '')}"
            for p in prevention_items if isinstance(p, dict)
        )
    else:
        prevention_str = str(prevention_items)

    # summary and urgency_label are now returned directly by the model
    summary = data.get("summary") or data.get("reasoning") or (what_is_this[0] if what_is_this else "")
    urgency_label = data.get("urgency_label") or urgency_str or _urgency_enum(urgency_str)

    return {
        # Fields the existing frontend reads
        "summary":       summary,
        "urgency":       _urgency_enum(urgency_str),
        "urgency_label": urgency_label,
        "treatment":     treatment_steps,
        "prevention":    prevention_str,
        "severity":      data.get("severity", "moderate"),
        # Rich fields (available for frontend use)
        "reasoning":        data.get("reasoning", ""),
        "visual_evidence":  data.get("visual_evidence", []),
        "what_is_this":     what_is_this,
        "action_plan":      action_plan,
        "timeline":         data.get("timeline", []),
        "yield_loss_risk":  data.get("yield_loss_risk", ""),
        "treatment_cost":   data.get("treatment_cost", ""),
        "time_to_act":      data.get("time_to_act", ""),
        "recovery_signals": data.get("recovery_signals", []),
        "warning_signals":  data.get("warning_signals", []),
        "prevention_tips":  prevention_items,  # structured list with icon/tip/description
    }


_FALLBACK_TREATMENTS = {
    "leaf_blight": {
        "summary": "Leaf blight detected — a fungal infection causing rapid tissue death.",
        "urgency": "immediate", "urgency_label": "Immediate action required",
        "treatment": [
            {"step": 1, "action": "Remove and destroy all infected leaves", "product": None},
            {"step": 2, "action": "Apply chlorothalonil fungicide", "product": "Daconil 2787"},
            {"step": 3, "action": "Switch to drip irrigation to keep foliage dry", "product": None},
            {"step": 4, "action": "Re-apply fungicide every 7 days for 3 cycles", "product": "Daconil 2787"},
        ],
        "prevention": "Crop Rotation: rotate away from host family for 2+ seasons. Remove Debris: destroy all infected residue at season end.",
        "severity": "severe",
    },
    "powdery_mildew": {
        "summary": "Powdery mildew detected — white fungal coating reducing photosynthesis.",
        "urgency": "within_3_days", "urgency_label": "Act within 3 days",
        "treatment": [
            {"step": 1, "action": "Apply myclobutanil fungicide immediately", "product": "Eagle 20EW"},
            {"step": 2, "action": "Improve canopy airflow by pruning dense growth", "product": None},
            {"step": 3, "action": "Remove heavily infected leaves", "product": None},
            {"step": 4, "action": "Repeat application in 14 days, rotate to trifloxystrobin", "product": "Flint Extra"},
        ],
        "prevention": "Air Circulation: maintain plant spacing. Resistant Varieties: select mildew-resistant cultivars next season.",
        "severity": "moderate",
    },
    "rust": {
        "summary": "Crop rust detected — airborne fungal pustules that can defoliate a field in 2 weeks.",
        "urgency": "within_week", "urgency_label": "Act within 1 week",
        "treatment": [
            {"step": 1, "action": "Apply propiconazole fungicide across full field", "product": "Tilt 250E"},
            {"step": 2, "action": "Remove and bag heavily infected leaves", "product": None},
            {"step": 3, "action": "Scout surrounding plants for spread", "product": None},
            {"step": 4, "action": "Re-apply tebuconazole in 14 days", "product": "Folicur 3.6F"},
        ],
        "prevention": "Resistant Varieties: plant rust-resistant cultivars next season. Early Planting: plant before peak humidity windows.",
        "severity": "moderate",
    },
}


_RETRY_PROMPT = """The previous response could not be parsed as JSON. Return ONLY a valid JSON object for a {disease} diagnosis — no markdown, no code fences, no text outside the braces. Start your response with {{ and end with }}."""


def _extract_json(raw: str) -> dict:
    """Strip surrounding text, fix single quotes, then parse."""
    first = raw.find("{")
    last = raw.rfind("}")
    if first == -1 or last == -1:
        raise ValueError("No JSON object found in response")
    trimmed = raw[first : last + 1]
    # Replace single quotes only outside already-valid double-quoted strings
    # Simple heuristic: swap unescaped single quotes for double quotes
    trimmed = trimmed.replace("'", '"')
    return json.loads(trimmed)


async def get_treatment(disease: str, confidence: float, all_probs: dict | None = None) -> dict:
    if disease == "healthy":
        return {
            "summary": "Your crop appears healthy — no disease detected.",
            "urgency": "monitor", "urgency_label": "No action needed",
            "treatment": [], "prevention": "Continue current practices and monitor regularly.",
            "severity": "mild",
        }

    all_probs_str = (
        ", ".join(f"{k.replace('_', ' ')}: {v:.1%}" for k, v in all_probs.items())
        if all_probs else "not available"
    )

    user_content = _USER_PROMPT.format(
        disease=disease,
        confidence=confidence,
        all_probs_str=all_probs_str,
    )

    def _call_groq(messages: list, max_tokens: int = 900) -> str:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.2,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user",   "content": user_content},
    ]

    try:
        raw = _call_groq(messages)
        try:
            data = _extract_json(raw)
        except (ValueError, json.JSONDecodeError) as parse_err:
            print(f"[groq_service] Parse failed ({parse_err}), retrying with simplified prompt")
            retry_messages = messages + [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": _RETRY_PROMPT.format(disease=disease)},
            ]
            raw = _call_groq(retry_messages, max_tokens=900)
            data = _extract_json(raw)
        return _map_response(data)
    except Exception as e:
        print(f"[groq_service] Groq call failed, using fallback: {e}")
        return _FALLBACK_TREATMENTS.get(disease, {
            "summary": f"{disease.replace('_', ' ').title()} detected.",
            "urgency": "within_week", "urgency_label": "Act within 1 week",
            "treatment": [{"step": 1, "action": "Consult a local agronomist for tailored advice", "product": None}],
            "prevention": "Practice crop rotation and maintain field hygiene.",
            "severity": "moderate",
        })
