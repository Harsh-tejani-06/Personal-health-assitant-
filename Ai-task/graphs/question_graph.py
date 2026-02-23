from langgraph.graph import StateGraph, END
from config.gemini import llm
from models.question_models import QuestionResponse

structured_llm = llm.with_structured_output(QuestionResponse)


class GraphState(dict):
    healthProfile: dict
    result: dict


def generate_questions(state: GraphState):
    prompt = f""" You are professional Health assistant Doctor you have 20 years of experience.
Based on user Profile below provided you have to Generate 10 Question Our system releted to helth we will generate Diet Excercise and skin Care routine Based on user have Provided User So asked user Proper Questions which will Help US to make Personilzed diet Plan.

Each question must have:
- question (string)
- options (list of 3-5 strings)

Return JSON format:
{{
 "questions": [
   {{
     "question": "",
     "options": ["", "", ""]
   }}
 ]
}}

User Profile:
{state['healthProfile']}
"""

    res = structured_llm.invoke(prompt)

    return {"result": res.dict()}


builder = StateGraph(GraphState)
builder.add_node("generate", generate_questions)
builder.set_entry_point("generate")
builder.add_edge("generate", END)

question_graph = builder.compile()
