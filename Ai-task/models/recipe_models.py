# # recipe_models.py
# from pydantic import BaseModel
# from typing import List, Dict, Optional

# class RecipeState(BaseModel):
#     profile: Dict
#     previous_recipes: List
#     message: Optional[str] = ""
#     image_paths: List[str]
    
#     valid: bool = True
#     ingredients: List[str] = []
#     recipe: Dict = {}
#     warning: Optional[str] = None


from pydantic import BaseModel
from typing import Dict, List, Optional


# ===============================
# Main Recipe State (LangGraph)
# ===============================
# class RecipeState(BaseModel):
#     profile: Dict
#     previous_recipes: List
#     message: Optional[str] = ""
#     image_paths: List[str]

#     valid: bool = True
#     ingredients: List[str] = []
#     recipe: Dict = {}
#     warning: Optional[str] = None


# # ===============================
# # Structured Output Model
# # ===============================
# class RecipeOutput(BaseModel):
#     recipe_name: str
#     ingredients: List[str]
#     steps: List[str]
#     calories: int
#     protein: str
#     best_time: str
#     reason: str


# recipe_models.py

from pydantic import BaseModel
from typing import Dict, List, Optional


# ===============================
# LangGraph State Model
# ===============================
class RecipeState(BaseModel):
    profile: Dict
    previous_recipes: List
    message: Optional[str] = ""
    image_paths: List[str] = []

    # Internal pipeline state
    valid: bool = True
    ingredients: List[str] = []
    recipe: Dict = {}
    warning: Optional[str] = None


# ===============================
# Structured Output Model
# ===============================
class RecipeOutput(BaseModel):
    recipe_name: str
    ingredients: List[str]
    steps: List[str]
    calories: int
    protein: str
    best_time: str
    reason: str


# ===============================
# API Request Model
# ===============================
class RecipeRequest(BaseModel):
    health_profile: str       # JSON string → parsed as Dict
    previous_recipes: str     # JSON string → parsed as List
    message: Optional[str] = ""
    image_paths: Optional[List[str]] = []  # base64 strings or file paths


# ===============================
# API Response Models
# ===============================
class ValidationResponse(BaseModel):
    valid: bool
    warning: Optional[str] = None
    detected_ingredients: List[str] = []


class RecipeResponse(BaseModel):
    success: bool
    validation: ValidationResponse
    recipe: Optional[RecipeOutput] = None
    error: Optional[str] = None