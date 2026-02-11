import os
import json
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from google import genai
from google.genai import types

DEFAULT_PROMPT = (
    "You are a nutrition assistant. From this photo, estimate what the food is and give an approximate nutrition breakdown.\n\n"
    "Return two parts:\n"
    "1. A detailed markdown summary for the user. Include a title, portion estimate, and a friendly nutritional note.\n"
    "2. A structured JSON block delimited by ```json ... ``` containing the following fields: "
    "'dish_name', 'portion_size_g', 'calories_kcal', 'protein_g', 'carbs_g', 'fats_g', 'ingredients' (list of strings).\n\n"
    "Ensure the JSON is valid and accurate based on your visual estimation."
)

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY environment variable")

client = genai.Client(api_key=API_KEY)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_json(text):
    """Extracts JSON from markdown code blocks."""
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None

def clean_markdown(text):
    """Removes the JSON block from the markdown for clean display."""
    return re.sub(r'```json\s*.*?\s*```', '', text, flags=re.DOTALL).strip()

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

        full_text = response.text
        structured_data = extract_json(full_text)
        markdown_summary = clean_markdown(full_text)

        return {
            "filename": image.filename,
            "content_type": mime,
            "markdown": markdown_summary,
            "nutrition_data": structured_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))