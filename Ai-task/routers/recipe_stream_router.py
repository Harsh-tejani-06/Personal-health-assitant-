# from fastapi import APIRouter, UploadFile, File, Form
# from fastapi.responses import StreamingResponse
# import json
# import os
# import asyncio
# from typing import List, Optional
# from graphs.recipe_graph import recipe_graph
# from models.recipe_models import RecipeState
# from dotenv import load_dotenv

# load_dotenv()

# router = APIRouter()

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)


# async def save_images(files: List[UploadFile]) -> List[str]:
#     paths = []
#     for file in files:
#         path = os.path.join(UPLOAD_DIR, file.filename)
#         with open(path, "wb") as f:
#             f.write(await file.read())
#         paths.append(path)
#     return paths


# async def recipe_stream_generator(state: RecipeState, has_images: bool):
#     if has_images:
#         yield f"data: {json.dumps({'status': 'Analyzing images...'})}\n\n"
    
#     result = recipe_graph.invoke(state)
    
#     # Only check validity if images were provided
#     if has_images and not result.valid:
#         yield f"data: {json.dumps({'error': result.warning})}\n\n"
#         return
    
#     yield f"data: {json.dumps({'status': 'Generating recipe...'})}\n\n"
    
#     recipe_text = json.dumps(result.recipe, indent=2)
    
#     for chunk in recipe_text.split("\n"):
#         yield f"data: {json.dumps({'chunk': chunk})}\n\n"
#         await asyncio.sleep(0.05)
    
#     yield f"data: {json.dumps({'done': True})}\n\n"


# @router.post("/generate-stream")
# async def generate_recipe_stream(
#     health_profile: str = Form(...),
#     previous_recipes: str = Form(...),
#     message: str = Form(""),
#     images: Optional[List[UploadFile]] = File(None)
# ):
#     profile = json.loads(health_profile)
#     previous = json.loads(previous_recipes)
    
#     paths = []
#     has_images = images is not None and len(images) > 0
    
#     if has_images:
#         paths = await save_images(images)
    
#     state = RecipeState(
#         profile=profile,
#         previous_recipes=previous,
#         message=message,
#         image_paths=paths
#     )
    
#     return StreamingResponse(
#         recipe_stream_generator(state, has_images),
#         media_type="text/event-stream"
#     )


# recipe_stream_router.py

import json
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import base64

from models.recipe_models import (
    RecipeRequest,
    RecipeResponse,
    RecipeState,
    RecipeOutput,
    ValidationResponse,
)
from graphs.recipe_graph import recipe_graph


router = APIRouter(prefix="/recipe", tags=["Recipe"])


# ===============================
# Helpers
# ===============================
def _parse_request(
    health_profile: str,
    previous_recipes: str,
    message: str = "",
) -> tuple[dict, list]:
    """Parse JSON strings from form/body into Python objects."""
    try:
        profile = json.loads(health_profile)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="health_profile must be valid JSON")

    try:
        previous = json.loads(previous_recipes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="previous_recipes must be valid JSON")

    return profile, previous


def _build_state(
    profile: dict,
    previous: list,
    message: str,
    image_b64_list: list[str],
) -> RecipeState:
    return RecipeState(
        profile=profile,
        previous_recipes=previous,
        message=message,
        image_paths=image_b64_list,
    )


def _build_response(result: RecipeState) -> RecipeResponse:
    validation = ValidationResponse(
        valid=result.valid,
        warning=result.warning,
        detected_ingredients=result.ingredients,
    )
    recipe_out = RecipeOutput(**result.recipe) if result.recipe else None
    return RecipeResponse(
        success=bool(result.recipe),
        validation=validation,
        recipe=recipe_out,
        error=result.warning if not result.recipe else None,
    )


# ===============================
# SSE streaming helper
# ===============================
async def _stream_graph(state: RecipeState) -> AsyncGenerator[str, None]:
    """
    Run LangGraph node-by-node and yield SSE events so the client
    can observe progress in real time.
    """
    yield _sse("status", {"step": "validate", "message": "Validating images…"})
    await asyncio.sleep(0)   # let the event loop flush

    # Stream nodes via langgraph .astream()
    current_state = state
    async for chunk in recipe_graph.astream(state.model_dump()):
        node_name = list(chunk.keys())[0]
        node_output: dict = chunk[node_name]

        if node_name == "validate":
            current_state = current_state.model_copy(update=node_output)
            if current_state.valid:
                yield _sse("validation", {
                    "valid": True,
                    "detected_ingredients": current_state.ingredients,
                })
            else:
                yield _sse("validation", {
                    "valid": False,
                    "warning": current_state.warning,
                })
                if not (current_state.message and current_state.message.strip()):
                    yield _sse("error", {"message": current_state.warning})
                    return
                yield _sse("status", {"step": "fallback", "message": "Image invalid — generating from text prompt…"})

        elif node_name == "generate":
            current_state = current_state.model_copy(update=node_output)
            yield _sse("status", {"step": "generate", "message": "Recipe generated!"})

            recipe = current_state.recipe
            if recipe:
                yield _sse("recipe", recipe)
            else:
                yield _sse("error", {"message": current_state.warning or "Recipe generation failed"})

        await asyncio.sleep(0)

    yield _sse("done", {"message": "Stream complete"})


def _sse(event: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# ===============================
# Route 1 — JSON (non-streaming)
# POST /recipe/generate
# ===============================
@router.post("/generate", response_model=RecipeResponse, summary="Generate recipe (JSON)")
async def generate_recipe(
    health_profile: str = Form(..., description="JSON string of user health profile"),
    previous_recipes: str = Form(..., description="JSON string of list of previous recipe names"),
    message: str = Form("", description="Optional user message / dietary preferences"),
    images: list[UploadFile] = File(default=[], description="Food/ingredient images (optional)"),
):
    """
    Generate a recipe based on health profile, previous recipes, an optional
    text message, and optional food images.

    **Example health_profile:**
    ```json
    {"age": 28, "weight_kg": 70, "goal": "muscle gain", "allergies": ["nuts"], "diet": "non-veg"}
    ```

    **Example previous_recipes:**
    ```json
    ["Grilled Chicken Salad", "Oats Porridge"]
    ```
    """
    profile, previous = _parse_request(health_profile, previous_recipes, message)

    # Read & encode images to base64
    image_b64_list: list[str] = []
    for img in images:
        raw = await img.read()
        image_b64_list.append(base64.b64encode(raw).decode())

    state = _build_state(profile, previous, message, image_b64_list)

    # Run graph synchronously (invoke)
    result_dict = recipe_graph.invoke(state.model_dump())
    result = RecipeState(**result_dict)

    return _build_response(result)


# ===============================
# Route 2 — SSE Streaming
# POST /recipe/generate/stream
# ===============================
@router.post("/generate/stream", summary="Generate recipe (SSE streaming)")
async def generate_recipe_stream(
    health_profile: str = Form(...),
    previous_recipes: str = Form(...),
    message: str = Form(""),
    images: list[UploadFile] = File(default=[]),
):
    """
    Same as `/generate` but streams progress via **Server-Sent Events**.

    Events emitted (in order):
    - `status`     → pipeline step updates
    - `validation` → image validation result
    - `recipe`     → final recipe JSON
    - `error`      → any error
    - `done`       → stream finished
    """
    profile, previous = _parse_request(health_profile, previous_recipes, message)

    image_b64_list: list[str] = []
    for img in images:
        raw = await img.read()
        image_b64_list.append(base64.b64encode(raw).decode())

    state = _build_state(profile, previous, message, image_b64_list)

    return StreamingResponse(
        _stream_graph(state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ===============================
# Route 3 — Health check
# GET /recipe/health
# ===============================
@router.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "service": "Chef Vision Recipe API"}