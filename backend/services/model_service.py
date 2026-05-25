import base64
import io
import json
import os

from groq import Groq
from PIL import Image

CLASS_NAMES = ["healthy", "leaf_blight", "powdery_mildew", "rust"]

_SYSTEM_PROMPT = """You are Dr. GreenSpectra, a world-class plant pathologist with 30 years of field experience diagnosing crop diseases across 50+ countries. You have analyzed over 1 million crop disease cases and published research in Nature and Science journals. You see what other experts miss.

When analyzing a crop image, you examine:
- Lesion shape, color, texture, and distribution pattern
- Presence of fungal structures (spores, mycelium, fruiting bodies)
- Color changes: chlorosis, necrosis, bleaching
- Pattern of spread: circular, angular, random, vein-limited
- Surface texture: powdery, waxy, water-soaked, crusty
- Affected plant parts and how disease progresses

You MUST classify into exactly one of: healthy, leaf_blight, powdery_mildew, rust

Key visual signatures:
- powdery_mildew: white or gray powdery coating, circular patches, black fruiting bodies (cleistothecia), starts on upper leaf surface
- leaf_blight: brown or tan irregular lesions, water-soaked margins, yellowing halo around lesions, spreads rapidly
- rust: orange, brown or yellow pustules on leaf underside, powdery spore masses, circular uredinia
- healthy: uniform green color, no lesions, no discoloration, no abnormal textures

here is an example
Respond ONLY with valid JSON, no explanation outside JSON:
{
  'disease': 'powdery_mildew',
  'confidence': 0.97,
  'reasoning': 'detailed reasoning here',
  'visual_evidence': ['white powdery patches', 'black cleistothecia visible', 'circular spread pattern']
}"""

_client = Groq(api_key=os.environ["GROQ_API_KEY"])

print("✅ Groq vision classifier ready (meta-llama/llama-4-scout-17b-16e-instruct)")


def _image_to_base64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def predict(image: Image.Image) -> dict:
    b64 = _image_to_base64(image)

    response = _client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                    {"type": "text", "text": "Diagnose this crop image."},
                ],
            },
        ],
        temperature=0.1,
        max_tokens=512,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown fences if the model wraps the JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    # The system prompt uses single-quoted JSON as an example; normalise to double quotes
    data = json.loads(raw.replace("'", '"'))

    disease = data.get("disease", "healthy")
    if disease not in CLASS_NAMES:
        disease = "healthy"

    confidence = float(data.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))

    # Distribute remaining probability evenly across the other three classes
    other_prob = (1.0 - confidence) / 3
    all_probs = {c: other_prob for c in CLASS_NAMES}
    all_probs[disease] = confidence

    return {
        "disease": disease,
        "confidence": confidence,
        "all_probs": all_probs,
        "reasoning": data.get("reasoning", ""),
        "visual_evidence": data.get("visual_evidence", []),
    }
