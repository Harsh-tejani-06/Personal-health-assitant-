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


# ============================================================
# NODE 1: Validate uploaded images are actually food
# ============================================================
def validate_images_node(state: RecipeState):
    if not state.image_paths:
        # No images uploaded — text-only recipe request, skip validation
        return state

    for path in state.image_paths:
        try:
            img = Image.open(path)

            # Step 1: STRICT validation — is this a food image?
            validation_result = vision_model.generate_content([
                validate_food_prompt(),
                img
            ])

            try:
                data = extract_json(validation_result.text)
            except (json.JSONDecodeError, Exception) as e:
                print(f"[ERROR] JSON parse failed for validation: {e}")
                print(f"[DEBUG] Raw response: {validation_result.text}")
                state.valid = False
                state.warning = "Could not analyze the image. Please upload a clear photo of food or ingredients."
                return state

            is_food = data.get("is_food", False)
            confidence = data.get("confidence", 0)

            print(f"[INFO] Image validation: is_food={is_food}, confidence={confidence}, path={path}")

            # Reject if not food OR confidence is too low
            if not is_food or confidence < 0.7:
                state.valid = False
                detected = data.get("detected_content", "unknown content")
                state.warning = f"This doesn't look like food. We detected: {detected}. Please upload a clear photo of food items, vegetables, fruits, or ingredients."
                return state

        except Exception as e:
            print(f"[ERROR] Image validation failed for {path}: {e}")
            state.valid = False
            state.warning = "Failed to process the image. Please try a different photo."
            return state

    return state


# ============================================================
# NODE 2: Extract ingredients from validated food images
# ============================================================
def extract_node(state: RecipeState):
    if not state.image_paths:
        return state

    items = []

    for path in state.image_paths:
        try:
            img = Image.open(path)
            res = vision_model.generate_content([extract_ingredients_prompt(), img])
            data = extract_json(res.text)
            items.extend(data.get("ingredients", []))
        except Exception as e:
            print(f"[ERROR] extract_node failed for {path}: {e}")
            state.valid = False
            state.warning = "Failed to identify ingredients from the image."
            return state

    if not items:
        state.valid = False
        state.warning = "Could not identify any food items or ingredients in the image. Please upload a clearer photo."
        return state

    state.ingredients = items
    return state


# ============================================================
# NODE 3: Generate recipe
# ============================================================
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
        state.warning = "Recipe generation failed. Please try again."

    return state


# ============================================================
# ROUTING
# ============================================================
def route_after_validation(state: RecipeState):
    """After validation: if invalid, stop. If no images, skip extraction and go to generate. Otherwise extract."""
    if not state.valid:
        return "end"
    if not state.image_paths:
        return "generate"
    return "extract"


def route_after_extraction(state: RecipeState):
    """After extraction: if invalid, stop. Otherwise generate recipe."""
    if not state.valid:
        return "end"
    return "generate"


# ============================================================
# PROMPTS
# ============================================================
def validate_food_prompt():
    return """You are an extremely strict food image validator. Your job is to determine whether an image contains food, ingredients, or cooking-related items.

CLASSIFY the image into one of these categories:
- FOOD: Cooked dishes, meals, prepared food
- INGREDIENTS: Raw vegetables, fruits, grains, spices, meat, dairy, etc.
- COOKING: Kitchen utensils with food, cooking in progress
- NOT_FOOD: Anything else (people, animals, landscapes, documents, screenshots, objects, selfies, memes, text, vehicles, buildings, etc.)

IMPORTANT RULES:
1. Be VERY strict. If there is ANY doubt, classify as NOT_FOOD.
2. An image of a person holding food is NOT_FOOD.
3. A restaurant menu or recipe text is NOT_FOOD.
4. A blurry or unclear image is NOT_FOOD.
5. A screenshot of food from the internet is NOT_FOOD.
6. Only classify as food if the PRIMARY subject of the image is clearly real food/ingredients.

Return ONLY this JSON (no extra text):
{
  "is_food": true/false,
  "confidence": 0.0 to 1.0,
  "detected_content": "brief description of what you see in the image",
  "category": "FOOD" or "INGREDIENTS" or "COOKING" or "NOT_FOOD"
}"""


def extract_ingredients_prompt():
    return """You are a food ingredient identifier. The image has already been verified to contain food.

Identify all visible food items, ingredients, vegetables, fruits, grains, proteins, and other edible items in the image.

Return ONLY this JSON:
{
  "ingredients": ["item1", "item2", "item3"]
}

Be specific (e.g., "red bell pepper" not just "pepper", "basmati rice" not just "rice").
List every distinct food item you can see."""


def recipe_prompt(profile, ingredients, previous, message):
    ingredients_section = ""
    if ingredients:
        ingredients_section = f"""
Ingredients from image: {ingredients}

Use the identified ingredients as the PRIMARY basis for the recipe."""
    else:
        ingredients_section = """
No image was provided. Create a recipe based on the user message and profile."""

    return f"""User Profile: {profile}

User Message: {message}
{ingredients_section}

Rules:
- Healthy and nutritious
- Budget friendly
- Under 30 minutes preparation
- Do not repeat previous recipes
- Match user's dietary preferences from profile
- Return step headings in plain text without any markdown formatting (no ** or * symbols)

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
}}"""


# ============================================================
# BUILD GRAPH
# ============================================================
builder = StateGraph(RecipeState)

builder.add_node("validate", validate_images_node)
builder.add_node("extract", extract_node)
builder.add_node("generate", generate_recipe_node)

builder.set_entry_point("validate")

# validate → (if valid) → extract → (if valid) → generate → END
# validate → (if invalid) → END
# extract → (if invalid) → END
builder.add_conditional_edges("validate", route_after_validation, {
    "extract": "extract",
    "generate": "generate",
    "end": END
})
builder.add_conditional_edges("extract", route_after_extraction, {
    "generate": "generate",
    "end": END
})
builder.add_edge("generate", END)

recipe_graph = builder.compile()

