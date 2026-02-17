# recipe_graph.py
from langgraph.graph import StateGraph, END
from PIL import Image
import json
from config.gemini import vision_model
from models.recipe_models import RecipeState
import re

def extract_json(text: str) -> dict:
    text = re.sub(r"```json\s*", "", text).strip()
    text = re.sub(r"```\s*", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def extract_node(state: RecipeState):
    if not state.image_paths:
        return state

    items = []

    for path in state.image_paths:
        try:
            img = Image.open(path)
            res = vision_model.generate_content([extract_prompt(), img])
            data = extract_json(res.text)

            if not data.get("valid", False):
                state.valid = False
                state.warning = "Invalid or unsupported image"
                return state

            items.extend(data.get("ingredients", []))

        except Exception as e:
            print("[ERROR]", e)
            state.valid = False
            state.warning = "Image processing failed"
            return state

    state.ingredients = items
    return state

    if not state.image_paths:
        return state

    items = []
    for path in state.image_paths:
        try:
            img = Image.open(path)
            res = vision_model.generate_content([extract_prompt(), img])
            data = extract_json(res.text)           # ✅ robust parsing

            if not data.get("valid", False):
                state.valid = False
                state.warning = "Invalid image detected"
                return state

            items.extend(data.get("ingredients", []))
        except Exception as e:
            print(f"[ERROR] extract_node failed for {path}: {e}")
            state.valid = False
            state.warning = "Image processing error"
            return state

    state.ingredients = items
    return state

def extract_prompt():
    return """
You are a strict food image validator.

Check if image clearly contains:
- Vegetables
- Fruits
- Grains
- Cooked food
- Ingredients

If image is:
- Person
- Document
- Screenshot
- Landscape
- Random object
- Blurry or unclear

Return:
{
 "valid": false,
 "ingredients": []
}

If valid food image:
{
 "valid": true,
 "ingredients": ["item1", "item2"]
}

Return ONLY JSON.
"""


def recipe_prompt(profile, ingredients, previous, message):
    return f"""
User Profile: {profile}

User Message: {message}

Ingredients from image (if any): {ingredients}

If ingredients list is empty:
- Create recipe based on user message and profile.

Rules:
- Healthy
- Budget friendly
- Under 30 minutes
- Do not repeat previous recipes

Previous Recipes:
{previous}

Return JSON:
{{
 "recipe_name":"",
 "ingredients":[],
 "steps":[],
 "calories":"",
 "protein":"",
 "best_time":"",
 "reason":""
}}
"""


def check_images(state: RecipeState):
    # Images are optional now
    return state




def generate_recipe_node(state: RecipeState):
    prompt = recipe_prompt(
        state.profile,
        state.ingredients,
        state.previous_recipes,
        state.message
    )

    try:
        res = vision_model.generate_content(prompt)
        state.recipe = extract_json(res.text)
    except Exception as e:
        print("[ERROR] Recipe generation:", e)
        state.valid = False
        state.warning = "Recipe generation failed"

    return state


def route(state: RecipeState):
    if not state.valid:
        return "end"
    return "generate"


builder = StateGraph(RecipeState)

builder.add_node("check", check_images)
builder.add_node("extract", extract_node)
builder.add_node("generate", generate_recipe_node)

builder.set_entry_point("check")
builder.add_edge("check", "extract")
builder.add_conditional_edges("extract", route, {
    "generate": "generate",
    "end": END
})
builder.add_edge("generate", END)

recipe_graph = builder.compile()
