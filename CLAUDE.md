# 🌿 GreenSpectra — CLAUDE.md
> Coding conventions, API patterns, and architecture decisions for the dev team.
> Read this before writing any code.

---

## 📁 Project Structure

```
greenspectra/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload/        # UploadZone, DemoGallery
│   │   │   ├── Diagnosis/     # DiagnosisCard, HeatmapViewer
│   │   │   ├── Auth/          # LoginPage, AuthGuard
│   │   │   └── Dashboard/     # HistoryList, HistoryItem
│   │   ├── lib/
│   │   │   ├── supabase.js    # Supabase client singleton
│   │   │   └── api.js         # FastAPI client calls
│   │   ├── hooks/
│   │   │   ├── useAuth.js     # Auth state management
│   │   │   └── useDiagnosis.js
│   │   └── App.jsx
│   └── .env                   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│
├── backend/                   # FastAPI app
│   ├── main.py                # App entry point, CORS, routers
│   ├── routers/
│   │   ├── diagnose.py        # /api/diagnose endpoint
│   │   └── history.py         # /api/history endpoint
│   ├── services/
│   │   ├── model_service.py   # EfficientNet inference
│   │   ├── heatmap_service.py # Grad-CAM + NDVI overlay
│   │   └── groq_service.py    # Groq LLM recommendations
│   ├── models/
│   │   └── efficientnet.onnx  # Exported model (from Colab)
│   ├── demo_images/           # 5 curated demo images + pre-generated heatmaps
│   └── requirements.txt
│
└── colab/
    └── train_efficientnet.ipynb  # Training notebook
```

---

## 🔐 Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key   # NOT anon key — use service key for backend
MODEL_PATH=./models/efficientnet.onnx
DEMO_MODE_IMAGES_PATH=./demo_images
```

---

## 🤖 ML Model Conventions

### Training (Colab)
```python
# Model: EfficientNet-B0 (torchvision)
# Dataset: PlantVillage (3 classes: powdery_mildew, leaf_blight, rust + healthy)
# Input size: 224x224 RGB
# Output: 4-class softmax (3 diseases + healthy)

import torchvision.models as models
model = models.efficientnet_b0(pretrained=True)
model.classifier[1] = nn.Linear(1280, 4)  # 4 classes

# Class index mapping (MUST match between training and inference)
CLASS_NAMES = ["healthy", "leaf_blight", "powdery_mildew", "rust"]
# Index:           0           1               2               3
```

### ONNX Export (run at end of Colab training)
```python
dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model, dummy_input, "efficientnet_greenspectra.onnx",
    input_names=["input"], output_names=["output"],
    dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
    opset_version=11
)
```

### Inference (backend/services/model_service.py)
```python
import onnxruntime as ort
import numpy as np
from PIL import Image
import torchvision.transforms as transforms

CLASS_NAMES = ["healthy", "leaf_blight", "powdery_mildew", "rust"]

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

session = ort.InferenceSession("models/efficientnet.onnx")

def predict(image: Image.Image) -> dict:
    tensor = TRANSFORM(image).unsqueeze(0).numpy()
    outputs = session.run(None, {"input": tensor})[0]
    probs = softmax(outputs[0])
    top_idx = np.argmax(probs)
    return {
        "disease": CLASS_NAMES[top_idx],
        "confidence": float(probs[top_idx]),
        "all_probs": {CLASS_NAMES[i]: float(probs[i]) for i in range(4)}
    }
```

---

## 🗺️ Heatmap Generation

### Grad-CAM (requires PyTorch model, not ONNX)
```python
# Keep a PyTorch version of model loaded alongside ONNX for Grad-CAM
# Use pytorch-grad-cam library: pip install grad-cam

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image

def generate_gradcam(model, image_tensor, target_class):
    target_layers = [model.features[-1]]  # Last conv layer
    cam = GradCAM(model=model, target_layers=target_layers)
    grayscale_cam = cam(input_tensor=image_tensor)[0]
    return grayscale_cam  # Shape: (224, 224), values 0-1
```

### NDVI Simulation Overlay
```python
import cv2
import numpy as np

def apply_ndvi_colormap(gradcam_mask: np.ndarray, original_rgb: np.ndarray) -> np.ndarray:
    """
    Simulate NDVI: high activation = diseased (red), low = healthy (green)
    This is the 'honest simulation' — we tell judges this represents
    what a hyperspectral NDVI band would show.
    """
    # Invert for NDVI convention: diseased areas have LOW NDVI
    ndvi_sim = 1.0 - gradcam_mask
    
    # Apply RdYlGn colormap (red=diseased, green=healthy)
    colored = cv2.applyColorMap(
        (ndvi_sim * 255).astype(np.uint8),
        cv2.COLORMAP_RdYlGn  # or use COLORMAP_JET for dramatic effect
    )
    
    # Blend with original image
    overlay = cv2.addWeighted(original_rgb, 0.5, colored, 0.5, 0)
    return overlay

def heatmap_to_base64(image_array: np.ndarray) -> str:
    import base64
    _, buffer = cv2.imencode('.png', image_array)
    return base64.b64encode(buffer).decode('utf-8')
```

---

## 🤖 Groq API Pattern

```python
# backend/services/groq_service.py
from groq import Groq
import os

client = Groq(api_key=os.environ["GROQ_API_KEY"])

TREATMENT_PROMPT = """You are an expert agricultural pathologist AI for GreenSpectra.
A farmer's crop has been diagnosed with {disease} at {confidence:.0%} confidence.

Provide a treatment recommendation in this EXACT JSON format:
{{
  "summary": "One sentence diagnosis summary",
  "urgency": "immediate|within_3_days|within_week|monitor",
  "urgency_label": "Human readable urgency e.g. 'Act within 3 days'",
  "treatment": [
    {{"step": 1, "action": "specific action", "product": "product name if applicable"}},
    {{"step": 2, "action": "...", "product": "..."}}
  ],
  "prevention": "One sentence prevention tip",
  "severity": "mild|moderate|severe"
}}

Disease: {disease}
Confidence: {confidence:.0%}
Respond ONLY with valid JSON. No markdown, no explanation."""

async def get_treatment(disease: str, confidence: float) -> dict:
    if disease == "healthy":
        return {"summary": "Your crop appears healthy!", "urgency": "monitor", "treatment": []}
    
    response = client.chat.completions.create(
        model="llama3-70b-8192",          # Fast, accurate, free tier
        messages=[{
            "role": "user",
            "content": TREATMENT_PROMPT.format(disease=disease, confidence=confidence)
        }],
        temperature=0.3,                   # Low temp for consistent medical advice
        max_tokens=500
    )
    
    import json
    return json.loads(response.choices[0].message.content)
```

---

## 🌐 FastAPI Endpoint Patterns

### Main diagnose endpoint
```python
# backend/routers/diagnose.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api", tags=["diagnose"])

@router.post("/diagnose")
async def diagnose_crop(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)  # Supabase JWT verification
):
    # 1. Validate image
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Invalid image format")
    
    # 2. Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # 3. Run inference
    prediction = predict(image)
    
    # 4. Generate heatmap
    heatmap_b64 = generate_heatmap(image, prediction["disease"])
    
    # 5. Get treatment from Groq
    treatment = await get_treatment(prediction["disease"], prediction["confidence"])
    
    # 6. Save to Supabase
    await save_diagnosis(current_user["sub"], prediction, treatment)
    
    return JSONResponse({
        "disease": prediction["disease"],
        "confidence": prediction["confidence"],
        "all_probs": prediction["all_probs"],
        "heatmap": heatmap_b64,          # base64 PNG
        "treatment": treatment,
        "timestamp": datetime.utcnow().isoformat()
    })
```

### Supabase JWT Verification
```python
# backend/middleware/auth.py
from supabase import create_client
import jwt
import os

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ")[1]
    try:
        # Supabase JWTs are verified with your JWT secret
        payload = jwt.decode(token, os.environ["SUPABASE_JWT_SECRET"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
```

### CORS Config (main.py)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ⚛️ Frontend API Client

```javascript
// frontend/src/lib/api.js
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

export async function diagnoseCrop(imageFile) {
  const headers = await getAuthHeader()
  const formData = new FormData()
  formData.append('file', imageFile)
  
  const response = await fetch(`${API_URL}/api/diagnose`, {
    method: 'POST',
    headers,           // No Content-Type — let browser set multipart boundary
    body: formData
  })
  
  if (!response.ok) throw new Error('Diagnosis failed')
  return response.json()
}

export async function getHistory() {
  const headers = await getAuthHeader()
  const response = await fetch(`${API_URL}/api/history`, { headers })
  return response.json()
}
```

---

## 🗄️ Supabase Schema

```sql
-- Run in Supabase SQL editor

CREATE TABLE diagnosis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  disease TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  treatment JSONB,
  image_url TEXT,
  heatmap_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only see their own diagnoses
ALTER TABLE diagnosis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own diagnoses" ON diagnosis_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## 📋 Requirements Files

### backend/requirements.txt
```
fastapi==0.111.0
uvicorn==0.30.0
python-multipart==0.0.9
onnxruntime==1.18.0
torch==2.3.0
torchvision==0.18.0
grad-cam==1.4.8
Pillow==10.3.0
opencv-python-headless==4.9.0.80
numpy==1.26.4
groq==0.9.0
supabase==2.4.3
python-jose==3.3.0
PyJWT==2.8.0
python-dotenv==1.0.1
```

### frontend/package.json dependencies
```json
{
  "@supabase/supabase-js": "^2.43.0",
  "react": "^18.3.0",
  "react-router-dom": "^6.23.0",
  "react-dropzone": "^14.2.3",
  "framer-motion": "^11.2.0",
  "tailwindcss": "^3.4.0"
}
```

---

## 🎨 Disease Display Names

```javascript
// frontend/src/lib/constants.js
export const DISEASE_META = {
  healthy: {
    label: "Healthy Crop",
    color: "#22c55e",
    emoji: "✅",
    urgency: null
  },
  powdery_mildew: {
    label: "Powdery Mildew",
    color: "#f59e0b",
    emoji: "🍄",
    urgency: "Act within 3 days"
  },
  leaf_blight: {
    label: "Leaf Blight",
    color: "#ef4444",
    emoji: "🍂",
    urgency: "Immediate action required"
  },
  rust: {
    label: "Crop Rust",
    color: "#b45309",
    emoji: "🟤",
    urgency: "Act within 1 week"
  }
}
```

---

## 🚦 Demo Mode Convention

```python
# backend — pre-generated demo responses cached in memory at startup
DEMO_CACHE = {}  # filename -> full diagnosis response

@app.on_event("startup")
async def preload_demo():
    for demo_file in Path("demo_images").glob("*.jpg"):
        image = Image.open(demo_file).convert("RGB")
        prediction = predict(image)
        heatmap = generate_heatmap(image, prediction["disease"])
        treatment = await get_treatment(prediction["disease"], prediction["confidence"])
        DEMO_CACHE[demo_file.stem] = {
            "disease": prediction["disease"],
            "confidence": prediction["confidence"],
            "heatmap": heatmap,
            "treatment": treatment
        }

@router.get("/api/demo/{image_name}")
async def get_demo_diagnosis(image_name: str):
    if image_name not in DEMO_CACHE:
        raise HTTPException(404, "Demo image not found")
    return DEMO_CACHE[image_name]    # Instant response — no inference needed
```

---

## ⚡ Dev Commands

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev

# Expose for mobile demo (ngrok)
ngrok http 8000   # Share backend URL with frontend .env
ngrok http 5173   # Share frontend URL with judges
```