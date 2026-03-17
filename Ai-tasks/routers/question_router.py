from fastapi import APIRouter
from models.question_models import UserData
from graphs.question_graph import question_graph

router = APIRouter()

@router.post("/generate")
def generate_questions(data: UserData):
    result = question_graph.invoke({
        "healthProfile": data.healthProfile
    })

    return result["result"]
