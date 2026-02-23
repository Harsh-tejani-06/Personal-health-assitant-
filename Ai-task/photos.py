from fastapi import APIRouter, File, UploadFile, Form
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import os
import json
from typing import List, Optional

# ---------------- LOAD ENV ----------------
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Gemini 2.5 Flash
model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- STRUCTURED OUTPUT SCHEMA ----------------

def structured_prompt_extract():
    return """
Analyze the image.

If image contains food, vegetables, fruits or ingredients:
Return JSON:
{
  "valid": true,
  "ingredients": ["item1", "item2"]
}

If image is NOT food:
Return JSON:
{
  "valid": false,
  "ingredients": []
}

Return ONLY JSON.
"""


def structured_prompt_recipe(profile, ingredients, previous_recipes, user_message):
    return f"""
You are a professional diet planner.

User Profile:
{profile}

Available Ingredients:
{ingredients}

Previous Recipes (last 14 days):
{previous_recipes}

User Request:
{user_message}

Rules:
- Follow user's health goal strictly
- Respect dietType and restrictions
- Do NOT repeat previous recipes
- Keep cooking time under 30 minutes
- Budget friendly
- Healthy for the goal

Return JSON only:

{{
  "recipe_name": "",
  "ingredients": [],
  "steps": [],
  "calories": "",
  "protein": "",
  "best_time": "",
  "reason": ""
}}
"""

# ---------------- IMAGE → INGREDIENT EXTRACTION ----------------

def extract_from_image(path):
    img = Image.open(path)

    response = model.generate_content([
        structured_prompt_extract(),
        img
    ])

    text = response.text.strip()

    # -------- CLEAN RESPONSE --------
    text = text.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(text)
        print("Extracted:", data)
        return data
    except Exception as e:
        print("JSON Error:", text)
        return {"valid": False, "ingredients": []}

# ---------------- RECIPE GENERATION ----------------

def generate_recipe(profile, ingredients, previous_recipes, message):
    prompt = structured_prompt_recipe(profile, ingredients, previous_recipes, message)

    response = model.generate_content(prompt)

    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except:
        print("Recipe JSON Error:", text)
        return {"error": "Failed to parse recipe"}


# ---------------- API ENDPOINT ----------------

@router.post("/generate-recipe")
async def generate_recipe_api(
    user_id: str = Form(...),
    health_profile: str = Form(...),
    previous_recipes: str = Form(...),
    message: Optional[str] = Form(""),
    files: List[UploadFile] = File(...)
):
    try:
        profile = json.loads(health_profile)
        previous = json.loads(previous_recipes)

        all_ingredients = []

        # Limit handled by Node (recommended)
        for file in files:
            path = os.path.join(UPLOAD_FOLDER, file.filename)

            with open(path, "wb") as f:
                f.write(await file.read())

            result = extract_from_image(path)

            if not result["valid"]:
                return {
                    "success": False,
                    "message": "Invalid image. Please upload food or vegetable photos only."
                }

            all_ingredients.extend(result["ingredients"])

        # Generate recipe
        recipe = generate_recipe(
            profile,
            all_ingredients,
            previous,
            message
        )

        return {
            "success": True,
            "ingredients": all_ingredients,
            "recipe": recipe
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

# Health check removed - use main app root endpoint
