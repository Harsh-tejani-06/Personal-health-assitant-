from fastapi import APIRouter, Form
from fastapi.responses import StreamingResponse
import json, os, asyncio
from graphs.recipe_graph import recipe_graph
from models.recipe_models import RecipeState

router = APIRouter()

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

    async def stream():
        try:
            # Step 1
            yield f"data: {json.dumps({'status': 'Analyzing images...'})}\n\n"
            await asyncio.sleep(0.2)

            state = RecipeState(
                profile=profile,
                previous_recipes=previous,
                message=message,
                image_paths=paths
            )

            result = recipe_graph.invoke(state)

            if not result["valid"]:
                yield f"data: {json.dumps({'error': result.get('warning')})}\n\n"
                return

            # Step 2
            yield f"data: {json.dumps({'status': 'Generating recipe...'})}\n\n"
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