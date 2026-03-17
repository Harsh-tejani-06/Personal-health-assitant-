# gemini.py
import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Image model
vision_model = genai.GenerativeModel("gemini-2.5-flash")

# Text LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.4
)
