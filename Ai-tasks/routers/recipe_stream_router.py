#Recipie Stream route
from fastapi import APIRouter, Form
from fastapi.responses import StreamingResponse
import json, os, asyncio
from graphs.recipe_graph import recipe_graph
from models.recipe_models import RecipeState

router = APIRouter()

# Base path for uploads - pointing to actual image storage location
BASE_PATH = r"D:\personal-health\Personal-health-assitant-\backend"

@router.post("/generate-stream")
async def generate_recipe_stream(
    health_profile: str = Form(...),
    previous_recipes: str = Form(...),
    message: str = Form(""),
    image_paths: str = Form("[]")
):
    profile = json.loads(health_profile)
    previous = json.loads(previous_recipes)
    paths = json.loads(image_paths)

    # Convert relative paths to absolute paths
    full_paths = [os.path.join(BASE_PATH, p) if not os.path.isabs(p) else p for p in paths]

    async def stream():
        try:
            has_images = len(full_paths) > 0

            # Step 1: Show appropriate status based on whether images are provided
            if has_images:
                yield f"data: {json.dumps({'status': 'Analyzing images...'})}\n\n"
            else:
                yield f"data: {json.dumps({'status': 'Generating recipe from your request...'})}\n\n"
            await asyncio.sleep(0.2)

            state = RecipeState(
                profile=profile,
                previous_recipes=previous,
                message=message,
                image_paths=full_paths
            )

            result = recipe_graph.invoke(state)

            if not result["valid"]:
                yield f"data: {json.dumps({'error': result.get('warning')})}\n\n"
                return

            # Step 2
            yield f"data: {json.dumps({'status': 'Recipe ready! Sending...'})}\n\n"
            await asyncio.sleep(0.2)

            recipe_text = json.dumps(result["recipe"], indent=2)

            # Stream text chunk by chunk
            for chunk in recipe_text.split("\n"):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                await asyncio.sleep(0.05)

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")