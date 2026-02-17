# recipe_router.py
from fastapi import APIRouter, Form
from typing import List, Optional          # ✅ Added Optional
import os, json, re
from graphs.recipe_graph import recipe_graph
from models.recipe_models import RecipeState

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ Dynamic base path — works on any machine
BASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")


@router.post("/generate")
async def generate_recipe(
    health_profile: str = Form(...),
    previous_recipes: str = Form(...),
    message: str = Form(""),
    image_paths: Optional[str] = Form(None)   # ✅ Optional now works
):
    try:
        profile = json.loads(health_profile)
        previous = json.loads(previous_recipes)
    except json.JSONDecodeError as e:
        return {"success": False, "message": f"Invalid JSON input: {e}"}

    full_paths = []

    if image_paths:
        try:
            filenames = json.loads(image_paths)
            full_paths = [os.path.join(UPLOAD_FOLDER, name) for name in filenames]
             
            print("[INFO] Received paths:", full_paths)

            # ✅ Verify files actually exist before proceeding
            missing = [p for p in full_paths if not os.path.exists(p)]
            if missing:
                print(f"[WARN] Missing files: {missing}")
                full_paths = [p for p in full_paths if os.path.exists(p)]
        except Exception as e:
            print(f"[ERROR] image_paths parsing: {e}")

    state = RecipeState(
        profile=profile,
        previous_recipes=previous,
        message=message,
        image_paths=full_paths
    )

    try:
        result = recipe_graph.invoke(state)
    except Exception as e:
        print(f"[ERROR] Graph invocation failed: {e}")
        return {"success": False, "message": "Recipe graph failed"}

    if not result["valid"]:
        return {"success": False, "message": result.get("warning", "Unknown error")}

    return {
        "success": True,
        "ingredients": result["ingredients"],
        "recipe": result["recipe"]
    }