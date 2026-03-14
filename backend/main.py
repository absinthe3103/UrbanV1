# main.py
import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

from Calculation.calculation import calculate_fs
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


API_KEY = os.getenv("QWEN2.5_API_KEY")
AI_ENDPOINT = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions"

db = []

# FIX 2: Added porePressure field
class FoundationData(BaseModel):
    buildingType: str
    cohesion: str
    normalStress: str
    frictionAngle: str
    shearStress: str
    porePressure: str = "0"  
    posX: str
    posY: str
    depth: str
    fs: str = "0"
    ai_advice: str = ""

def get_ai_advice(entry: FoundationData):
    """Formats data and calls the AI model for engineering advice."""
    prompt = (
        f"Analyze this foundation data for a {entry.buildingType}:\n"
        f"- Cohesion: {entry.cohesion} kPa\n"
        f"- Normal Stress: {entry.normalStress} kPa\n"
        f"- Friction Angle: {entry.frictionAngle}°\n"
        f"- Shear Stress: {entry.shearStress} kPa\n"
        f"- Pore Pressure: {entry.porePressure} kPa\n"
        f"- Depth: {entry.depth} m\n"
        f"- Location: X={entry.posX}, Y={entry.posY}\n\n"
        f"Calculated Factor of Safety (FS): {entry.fs}\n\n"
        "The FS was calculated using the Mohr-Coulomb formula: "
        "Fs = (c' + (σ - u) × tan(φ')) / τ where u is the pore pressure.\n\n"
        "Do NOT recalculate. Based on these results, what engineering steps "
        "should be taken to increase the stability of this foundation?"
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

        response.raise_for_status()

        ai_message = response.json()['choices'][0]['message']['content']
        print(f"AI Response: {ai_message[:100]}...")
        print(f"---------------------------\n")
        # ---------------------

        return ai_message

    except Exception as e:
        print(f"!!! AI CONNECTION FAILED: {str(e)}")
        return f"AI Analysis Error: {str(e)}"

@app.post("/api/data-ingest")
async def save_data(data: List[FoundationData]):
    global db

    for entry in data:
        entry_dict = entry.model_dump()

        # Calculate Factor of Safety
        try:
            fs_val = calculate_fs(entry_dict)
            entry.fs = f"{fs_val:.2f}"
        except Exception as e:
            print(f"Calculation Error: {e}")
            entry.fs = "Error"

        # Get AI advice using post-calculated FS
        entry.ai_advice = get_ai_advice(entry)

        # Store complete entry
        db.append(entry)

    return {
        "status": "success",
        "processed_count": len(data),
        "latest_ai_advice": data[-1].ai_advice
    }

@app.get("/api/get-foundation-data")
async def get_data():
    return db