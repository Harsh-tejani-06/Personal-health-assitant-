from fastapi import FastAPI
from routers.recipe_router import router as recipe_router
from routers.question_router import router as question_router
from routers.recipe_stream_router import router as recipe_stream_router


app = FastAPI(title="AI Health Backend")

app.include_router(recipe_router, prefix="/recipe", tags=["Recipe"])
app.include_router(question_router, prefix="/questions", tags=["Questions"])
app.include_router(recipe_stream_router, prefix="/recipe", tags=["Recipe Stream"])




@app.get("/")
def root():
    return {"status": "AI Backend Running"}
