import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# Import your specific calculation logic
from Calculation.calculation import calculate_fs
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - Ensure these are in your .env file
API_KEY = os.getenv("QWEN2.5_API_KEY")
AI_ENDPOINT = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions"

db = []

class FoundationData(BaseModel):
    buildingType: str
    cohesion: str
    normalStress: str
    frictionAngle: str
    shearStress: str
    posX: str
    posY: str
    depth: str
    fs: str = "0"
    ai_advice: str = "" # New field to store the AI's response

def get_ai_advice(entry: FoundationData):
    """Formats data and calls the AI model for engineering advice."""
    prompt = (
        f"Analyze this foundation data for a {entry.buildingType}:\n"
        f"Cohesion: {entry.cohesion}, Normal Stress: {entry.normalStress}, "
        f"Friction Angle: {entry.frictionAngle}, Shear Stress: {entry.shearStress}.\n"
        f"Calculated Factor of Safety (FS): {entry.fs}.\n\n"
        "What engineering steps should be taken to increase stability?"
    )

    payload = {
        "model": "qwen2.5",
        "messages": [
            {"role": "system", "content": "You are a geotechnical expert. Pls tell me what should i do to increase the stability of the foundation."},
            {"role": "user", "content": prompt}
        ],
        "max_completion_tokens": 508,
        "temperature": 0.1,
        "top_p": 0.9
    }

    try:
        response = requests.post(
            AI_ENDPOINT,
            headers={"Authorization": f"Bearer {API_KEY}"},
            json=payload,
            timeout=60
        )
        
        # --- DEBUG SECTION ---
        print(f"\n--- AI Connection Debug ---")
        print(f"Target Endpoint: {AI_ENDPOINT}")
        print(f"HTTP Status Code: {response.status_code}") 
        
        response.raise_for_status() # This will trigger the 'except' block if status is not 200
        
        ai_message = response.json()['choices'][0]['message']['content']
        print(f"AI Response: {ai_message[:100]}...") # Prints the first 100 characters
        print(f"---------------------------\n")
        # ---------------------

        return ai_message
        
    except Exception as e:
        print(f"!!! AI CONNECTION FAILED: {str(e)}")
        return f"AI Analysis Error: {str(e)}"
    
@app.post("/api/data-ingest")
async def save_data(data: List[FoundationData]):
    global db
    
    # 1. Process each row
    for entry in data:
        entry_dict = entry.model_dump()
        
        # Calculate Factor of Safety using your formula
        try:
            fs_val = calculate_fs(entry_dict)
            entry.fs = f"{fs_val:.2f}"
        except Exception as e:
            print(f"Calculation Error: {e}")
            entry.fs = "Error"
        
        # 2. FETCH AND ATTACH ADVICE TO EACH ENTRY
        # This ensures the 'ai_advice' is saved in the 'db' list
        entry.ai_advice = get_ai_advice(entry)
        
        # 3. Store the complete entry (with FS and AI advice)
        db.append(entry)
    
    return {
        "status": "success",
        "processed_count": len(data),
        "latest_ai_advice": data[-1].ai_advice 
    }

@app.get("/api/get-foundation-data")
async def get_data():
    return db