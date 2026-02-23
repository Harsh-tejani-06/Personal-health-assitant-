from pydantic import BaseModel, Field
from typing import List


class QuestionResponse(BaseModel):
    questions: List[dict]

class UserData(BaseModel):
    healthProfile: dict
