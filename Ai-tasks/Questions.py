from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END

load_dotenv()

app = FastAPI()

# ===============================
# Structured Output Models
# ===============================

class Question(BaseModel):
    question: str = Field(description="Question text")
    options: List[str] = Field(description="List of options")

class QuestionResponse(BaseModel):
    questions: List[Question]



# ===============================
# Request Model
# ===============================

class UserData(BaseModel):
    healthProfile: dict


# ===============================
# LLM
# ===============================

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.4
)

structured_llm = llm.with_structured_output(QuestionResponse)


# ===============================
# LangGraph State
# ===============================

class GraphState(dict):
    healthProfile: dict
    result: dict


def generate_questions(state: GraphState):
    profile = state["healthProfile"]

    prompt = f"""
You are a health assistant.

Based on the user profile below, generate 10 personalized follow‑up questions.

Each question must have 3‑5 options.

User Profile:
{profile}
"""

    response = structured_llm.invoke(prompt)

    return {
        "result": response.dict()
    }


# ===============================
# Build Graph
# ===============================

graph = StateGraph(GraphState)
graph.add_node("generate", generate_questions)
graph.set_entry_point("generate")
graph.add_edge("generate", END)

workflow = graph.compile()


# ===============================
# API Endpoint
# ===============================

@app.post("/generate")
def generate(data: UserData):
    try:
        result = workflow.invoke({
            "healthProfile": data.healthProfile
        })

        return result["result"]

    except Exception as e:
        return {
            "error": str(e)
        }
