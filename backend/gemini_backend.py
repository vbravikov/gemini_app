import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from google import genai
from google.genai import types

DEFAULT_PROMPT = (
    "You are a nutrition assistant. From this photo, estimate what the food is and give an approximate nutrition breakdown. "
    "Return: (1) what it looks like, (2) assumed portion size, (3) estimated calories (kcal) and protein (g), and (4) a short note about uncertainty."
)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY environment variable")

client = genai.Client(api_key=API_KEY)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(image: UploadFile = File(...), prompt: str = Form("")):
    try:
        img_bytes = await image.read()
        if not img_bytes:
            raise HTTPException(status_code=400, detail="Empty image file")

        final_prompt = prompt.strip() or DEFAULT_PROMPT
        mime = image.content_type or "image/jpeg"

        img_part = types.Part.from_bytes(data=img_bytes, mime_type=mime)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[final_prompt, img_part],
        )

        return {
            "filename": image.filename,
            "content_type": mime,
            "result": response.text,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
