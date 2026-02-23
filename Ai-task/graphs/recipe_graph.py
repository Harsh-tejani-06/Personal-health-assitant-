# # recipe_graph.py
# from langgraph.graph import StateGraph, END
# from PIL import Image
# import json
# from config.gemini import vision_model
# from models.recipe_models import RecipeState
# import re

# def extract_json(text: str) -> dict:
#     text = re.sub(r"```json\s*", "", text).strip()
#     text = re.sub(r"```\s*", "", text).strip()
#     match = re.search(r"\{.*\}", text, re.DOTALL)
#     if match:
#         return json.loads(match.group())
#     return json.loads(text)


# def extract_node(state: RecipeState):
#     # If no images, skip extraction
#     if not state.image_paths:
#         return state

#     items = []

#     for path in state.image_paths:
#         try:
#             img = Image.open(path)

#             res = vision_model.generate_content([
#                 extract_ingredients_prompt(),  # use correct prompt
#                 img
#             ])

#             data = extract_json(res.text)

#             # If no ingredients found → treat as invalid
#             ingredients = data.get("ingredients", [])

#             if not ingredients:
#                 state.valid = False
#                 state.warning = "Could not detect any food items in the image. Please upload a clearer food image."
#                 return state

#             items.extend(ingredients)

#         except Exception as e:
#             print(f"[ERROR] extract_node failed for {path}: {e}")
#             state.valid = False
#             state.warning = "Image processing failed during ingredient extraction."
#             return state

#     state.ingredients = items
#     return state


# def extract_prompt():
#     return """
# You are a strict food image validator.

# Check if image clearly contains:
# - Vegetables
# - Fruits
# - Grains
# - Cooked food
# - Ingredients

# If image is:
# - Person
# - Document
# - Screenshot
# - Landscape
# - Random object
# - Blurry or unclear

# Return:
# {
#  "valid": false,
#  "ingredients": []
# }

# If valid food image:
# {
#  "valid": true,
#  "ingredients": ["item1", "item2"]
# }

# Return ONLY JSON.
# """


# def recipe_prompt(profile, ingredients, previous, message):
#     return f"""
# User Profile: {profile}

# User Message: {message}

# Ingredients from image (if any): {ingredients}

# If ingredients list is empty:
# - Create recipe based on user message and profile.

# Rules:
# - Healthy
# - Budget friendly
# - Under 30 minutes
# - Do not repeat previous recipes

# Previous Recipes:
# {previous}

# Return JSON:
# {{
#  "recipe_name":"",
#  "ingredients":[],
#  "steps":[],
#  "calories":"",
#  "protein":"",
#  "best_time":"",
#  "reason":""
# }}
# """


# def check_images(state: RecipeState):
#     # Images are optional now
#     return state




# def generate_recipe_node(state: RecipeState):
#     # Safety guard: don't generate if validation failed
#     if not state.valid:
#         return state

#     prompt = recipe_prompt(
#         state.profile,
#         state.ingredients,
#         state.previous_recipes,
#         state.message
#     )

#     try:
#         res = vision_model.generate_content(prompt)
#         state.recipe = extract_json(res.text)
#     except Exception as e:
#         print("[ERROR] Recipe generation:", e)
#         state.valid = False
#         state.warning = "Recipe generation failed. Please try again."

#     return state


# def route(state: RecipeState):
#     if not state.valid:
#         return "end"
#     return "generate"


# builder = StateGraph(RecipeState)

# builder.add_node("check", check_images)
# builder.add_node("extract", extract_node)
# builder.add_node("generate", generate_recipe_node)

# builder.set_entry_point("check")
# builder.add_edge("check", "extract")
# builder.add_conditional_edges("extract", route, {
#     "generate": "generate",
#     "end": END
# })
# builder.add_edge("generate", END)

# recipe_graph = builder.compile()

# from langgraph.graph import StateGraph, END
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain.schema import HumanMessage
# from models.recipe_models import RecipeState, RecipeOutput
# from config.gemini import vision_model
# from PIL import Image
# from dotenv import load_dotenv

# load_dotenv()


# # Gemini Model
# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     temperature=0.4
# )


# # ===============================
# # Node 1: Image Validation
# # ===============================
# def validate_images(state: RecipeState) -> RecipeState:
#     # Skip validation if no images provided (text-only mode)
#     if not state.image_paths:
#         state.valid = True
#         return state

#     # Load actual images
#     images = []
#     for path in state.image_paths:
#         try:
#             img = Image.open(path)
#             images.append(img)
#         except Exception as e:
#             print(f"[ERROR] Failed to load image {path}: {e}")
#             state.valid = False
#             state.warning = "Failed to load one or more images."
#             return state

#     prompt = """
# You are a strict food image validator.

# Check if the provided image(s) contain FOOD items like:
# - Vegetables, fruits, grains
# - Raw or cooked food
# - Kitchen ingredients

# If images show:
# - People, documents, screenshots, landscapes
# - Non-food objects, blurry/unrecognizable items
# - Random objects not related to food

# Return exactly: INVALID

# If images contain valid food/ingredients:
# Return exactly: VALID

# Answer with only one word: VALID or INVALID
# """

#     # Use vision model with actual images
#     response = vision_model.generate_content([prompt] + images)
    
#     response_text = response.text.strip().upper()
#     print(f"[DEBUG] Validation response: {response_text}")
    
#     # Strict check: must contain VALID and NOT contain INVALID
#     if "INVALID" in response_text:
#         state.valid = False
#         state.warning = "Uploaded images are not food related."
#     elif "VALID" in response_text:
#         state.valid = True
#     else:
#         # Default to invalid if unclear
#         state.valid = False
#         state.warning = "Could not validate images. Please upload clear food photos."

#     return state


# # ===============================
# # Node 2: Generate Recipe
# # ===============================
# def generate_recipe(state: RecipeState) -> RecipeState:
#     if not state.valid:
#         return state

#     structured_llm = llm.with_structured_output(RecipeOutput)

#     prompt = f"""
# You are a smart nutrition AI.

# User profile:
# {state.profile}

# Previously generated recipes:
# {state.previous_recipes}

# User message:
# {state.message}

# Images (ingredients):
# {state.image_paths}

# Rules:
# - Avoid repeating previous recipes
# - Consider health profile
# - Use images as ingredients
# - Return JSON format only
# """

#     result = structured_llm.invoke(prompt)

#     state.recipe = result.model_dump()
#     state.ingredients = result.ingredients

#     return state


# # ===============================
# # Router Logic
# # ===============================
# def route_after_validation(state: RecipeState):
#     if state.valid:
#         return "generate"
#     return END


# # ===============================
# # Build Graph
# # ===============================
# def build_recipe_graph():
#     workflow = StateGraph(RecipeState)

#     workflow.add_node("validate", validate_images)
#     workflow.add_node("generate", generate_recipe)

#     workflow.set_entry_point("validate")
#     workflow.add_conditional_edges(
#         "validate",
#         route_after_validation,
#         {
#             "generate": "generate",
#             END: END
#         }
#     )

#     workflow.add_edge("generate", END)

    # return workflow.compile()


# recipe_graph = build_recipe_graph()

# recipe_graph.py

import json
import re
import base64
import os
from typing import Any

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

from models.recipe_models import RecipeState, RecipeOutput

# Load environment variables from .env file
load_dotenv()


# ===============================
# LLM Singleton
# ===============================
def get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.environ.get("GOOGLE_API_KEY", ""),
        temperature=0.7,
    )


# ===============================
# Helpers
# ===============================
def _load_image_content(image_path: str) -> dict:
    """
    Accept either:
      - a raw base64 string
      - a file path on disk
    and return a LangChain image_url content block.
    """
    if os.path.isfile(image_path):
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        mime = "image/jpeg"
        if image_path.lower().endswith(".png"):
            mime = "image/png"
        elif image_path.lower().endswith(".webp"):
            mime = "image/webp"
    else:
        # Assume raw base64
        b64 = image_path
        mime = "image/jpeg"

    return {
        "type": "image_url",
        "image_url": {"url": f"data:{mime};base64,{b64}"},
    }


def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a string."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"No JSON found in LLM response: {text[:300]}")


# ===============================
# Node 1 — Validate Images
# ===============================
def validate_images_node(state: RecipeState) -> RecipeState:
    """
    If images are provided, ask Gemini whether they contain food/ingredients.
    Populate state.ingredients and state.valid accordingly.
    """
    if not state.image_paths:
        # No images → skip validation, rely on message alone
        return state.model_copy(update={"valid": True, "warning": None})

    llm = get_llm()
    content: list[Any] = []

    for img in state.image_paths:
        try:
            content.append(_load_image_content(img))
        except Exception as e:
            return state.model_copy(update={
                "valid": False,
                "warning": f"Could not load image: {e}",
            })

    content.append({
        "type": "text",
        "text": (
            "Analyze every image above.\n"
            "Decide if each image shows food, ingredients, produce, spices, "
            "a dish, or any cooking-related item.\n\n"
            "Respond ONLY with a single JSON object:\n"
            "{\n"
            '  "valid": true or false,\n'
            '  "reason": "brief explanation",\n'
            '  "detected_ingredients": ["item1", "item2", ...]\n'
            "}\n"
            "Set valid=false if ANY image is completely unrelated to food."
        ),
    })

    response = llm.invoke([HumanMessage(content=content)])
    try:
        data = _extract_json(response.content)
        return state.model_copy(update={
            "valid": bool(data.get("valid", False)),
            "warning": None if data.get("valid") else data.get("reason", "Invalid image"),
            "ingredients": data.get("detected_ingredients", []),
        })
    except Exception as e:
        return state.model_copy(update={
            "valid": False,
            "warning": f"Validation parse error: {e}",
        })


# ===============================
# Node 2 — Generate Recipe
# ===============================
def generate_recipe_node(state: RecipeState) -> RecipeState:
    """
    Build a structured recipe using the user profile, previous recipes,
    detected ingredients, and optional message.
    """
    llm = get_llm()

    system = SystemMessage(content=(
        "You are a world-class nutrition AI and chef. "
        "Always respond with a single valid JSON object matching the schema exactly. "
        "No markdown, no code fences, no extra text."
    ))

    prompt = f"""
You are a smart nutrition AI.

User profile:
{json.dumps(state.profile, indent=2)}

Previously generated recipes (avoid repeating these):
{json.dumps(state.previous_recipes, indent=2)}

User message / special request:
{state.message or "None"}

Detected ingredients from uploaded images:
{json.dumps(state.ingredients) if state.ingredients else "Not provided — use message context"}

Rules:
- Avoid repeating previous recipes
- Consider health profile (allergies, diet, conditions, goals)
- If ingredients are detected from images, build the recipe around them
- Return ONLY a JSON object with this exact schema:

{{
  "recipe_name": "string",
  "ingredients": ["string", ...],
  "steps": ["string", ...],
  "calories": integer,
  "protein": "e.g. 35g",
  "best_time": "breakfast | lunch | dinner | snack",
  "reason": "why this recipe suits the user profile"
}}
"""

    msg = HumanMessage(content=[{"type": "text", "text": prompt}])

    response = llm.invoke([system, msg])
    try:
        data = _extract_json(response.content)
        recipe = RecipeOutput(**data)
        return state.model_copy(update={"recipe": recipe.model_dump()})
    except Exception as e:
        return state.model_copy(update={
            "recipe": {},
            "warning": (state.warning or "") + f" | Recipe parse error: {e}",
        })


# ===============================
# Router
# ===============================
def route_after_validation(state: RecipeState) -> str:
    """
    - valid image (or no image)  → generate
    - invalid image              → end (return error, do not generate)
    """
    if state.valid:
        return "generate"
    return "end"


# ===============================
# Build & Compile Graph
# ===============================
def build_recipe_graph():
    g = StateGraph(RecipeState)

    g.add_node("validate", validate_images_node)
    g.add_node("generate", generate_recipe_node)

    g.set_entry_point("validate")
    g.add_conditional_edges(
        "validate",
        route_after_validation,
        {"generate": "generate", "end": END},
    )
    g.add_edge("generate", END)

    return g.compile()


# Compiled graph (import this in the router)
recipe_graph = build_recipe_graph()