import os
import json
import re
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

from google import genai
from google.genai import types
from google.genai.errors import APIError

DEFAULT_PROMPT = (
    "You are a nutrition assistant. From this photo, estimate what the food is and give an approximate nutrition breakdown.\n\n"
    "Return two parts:\n"
    "1. A detailed markdown summary for the user. Include a title, portion estimate, and a friendly nutritional note.\n"
    "2. A structured JSON block delimited by ```json ... ``` containing the following fields: "
    "'dish_name', 'portion_size_g', 'calories_kcal', 'protein_g', 'carbs_g', 'fats_g', 'ingredients' (list of strings).\n\n"
    "Ensure the JSON is valid and accurate based on your visual estimation."
)

load_dotenv()

logger = logging.getLogger(__name__)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY environment variable")

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

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
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None


def clean_markdown(text):
    """Removes the JSON block from the markdown for clean display."""
    return re.sub(r"```json\s*.*?\s*```", "", text, flags=re.DOTALL).strip()


def response_text_or_fallback(response) -> str:
    text = getattr(response, "text", None)
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) if content else None
        if not parts:
            continue

        chunks = []
        for part in parts:
            part_text = getattr(part, "text", None)
            if part_text:
                chunks.append(part_text)
        if chunks:
            return "\n".join(chunks)

    return ""


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
            model=MODEL_NAME,
            contents=[final_prompt, img_part],
        )

        full_text = response_text_or_fallback(response)
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
    except APIError as e:
        logger.exception("Gemini API error on /analyze")
        raise HTTPException(
            status_code=e.code or 502,
            detail=e.message or "Gemini API request failed",
        )
    except Exception as e:
        logger.exception("Unhandled error on /analyze")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Text-only analysis endpoint
# ---------------------------------------------------------------------------


class AnalyzeTextRequest(BaseModel):
    food_name: str
    portion_g: float = 100.0
    diet_goal_hint: Optional[str] = None
    todays_meals: Optional[List[str]] = None
    prompt: Optional[str] = None


def build_text_prompt(
    food_name: str,
    portion_g: float,
    diet_goal_hint: Optional[str],
    todays_meals: Optional[List[str]],
) -> str:
    context = ""
    if diet_goal_hint:
        context += f"User's diet goal: {diet_goal_hint}\n\n"
    if todays_meals:
        context += (
            f"Meals already eaten today: {', '.join(todays_meals)}. "
            "Factor this into your verdict and summary_note — mention whether this meal complements or conflicts with what was already eaten, "
            "and suggest what the user should prioritise in later meals.\n\n"
        )

    return (
        f'You are a nutrition assistant. The user is searching for: "{food_name}" with a portion size of {portion_g}g.\n\n'
        + context
        + "Return a single JSON block delimited by ```json ... ```. Do not include any text outside the JSON block.\n\n"
        "The JSON must contain these fields:\n"
        "  'dish_name' (string),\n"
        "  'portion_size_g' (number),\n"
        "  'calories_kcal' (number),\n"
        "  'protein_g' (number),\n"
        "  'carbs_g' (number),\n"
        "  'fats_g' (number),\n"
        "  'confidence' (string) — 'low', 'medium', or 'high',\n"
        "  'diet_iverdict' (string) — 'excellent', 'good', 'moderate', or 'limit',\n"
        "  'summary_note' (string) — exactly 1-2 plain-text sentences explaining the verdict. No markdown, no emojis.\n"
        "  'ingredients' (array) — each item has 'name' (string), 'calories_kcal' (number), 'weight_g' (number), 'icon_key' (string).\n"
        "The sum of ingredient calories_kcal should approximately equal total calories_kcal. "
        "Return valid JSON only."
    )


@app.post("/analyze-text")
async def analyze_text(body: AnalyzeTextRequest):
    try:
        prompt = (
            body.prompt.strip()
            if body.prompt and body.prompt.strip()
            else build_text_prompt(
                body.food_name,
                body.portion_g,
                body.diet_goal_hint,
                body.todays_meals,
            )
        )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
        )

        full_text = response_text_or_fallback(response)
        structured_data = extract_json(full_text)

        return {
            "filename": "",
            "content_type": "text/plain",
            "markdown": "",
            "nutrition_data": structured_data,
        }

    except HTTPException:
        raise
    except APIError as e:
        logger.exception("Gemini API error on /analyze-text")
        raise HTTPException(
            status_code=e.code or 502,
            detail=e.message or "Gemini API request failed",
        )
    except Exception as e:
        logger.exception("Unhandled error on /analyze-text")
        raise HTTPException(status_code=500, detail=str(e))
