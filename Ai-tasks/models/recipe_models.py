# recipe_models.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class RecipeState(BaseModel):
    profile: Dict
    previous_recipes: List
    message: Optional[str] = ""
    image_paths: List[str]
    
    valid: bool = True
    ingredients: List[str] = []
    recipe: Dict = {}
    warning: Optional[str] = None
