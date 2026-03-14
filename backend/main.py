# main.py
import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

from Calculation.calculation import calculate_fs, calculate_bearing_capacity

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY     = os.getenv("QWEN2.5_API_KEY", "sk-kF-Xeh7a8MPt-IL3bgOy1w")
AI_ENDPOINT = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions"

db = []


class FoundationData(BaseModel):
    # identification
    buildingType:     str
    soilType:         str = "Unknown"
    sptN:             str = "0"
    # mohr-coulomb
    cohesion:         str
    normalStress:     str
    frictionAngle:    str
    shearStress:      str
    porePressure:     str = "0"
    # terzaghi extras
    unitWeight:       str = "18"
    foundationWidth:  str = "1.5"
    foundationDepth:  str = "1.5"
    groundwaterDepth: str = "999"
    appliedLoad:      str = "0"
    # spatial
    posX:             str
    posY:             str
    depth:            str
    # results
    fs:               str = "0"
    ultimate_bc:      str = "0"
    allowable_bc:     str = "0"
    ai_advice:        str = ""


def get_ai_advice(entry: FoundationData, bc: dict) -> str:
    prompt = (
        f"Analyze this foundation data for a {entry.buildingType}:\n\n"
        f"SOIL PROFILE\n"
        f"  Soil type:       {entry.soilType}\n"
        f"  SPT N-value:     {entry.sptN}\n"
        f"  Cohesion (c'):   {entry.cohesion} kPa\n"
        f"  Friction angle:  {entry.frictionAngle} degrees\n"
        f"  Unit weight (y): {entry.unitWeight} kN/m3\n"
        f"  Pore pressure:   {entry.porePressure} kPa\n"
        f"  Groundwater:     {entry.groundwaterDepth} m depth\n\n"
        f"LOADING\n"
        f"  Normal stress:   {entry.normalStress} kPa\n"
        f"  Shear stress:    {entry.shearStress} kPa\n"
        f"  Applied load:    {entry.appliedLoad} kN/m2\n\n"
        f"FOUNDATION GEOMETRY\n"
        f"  Width (B):  {entry.foundationWidth} m\n"
        f"  Depth (Df): {entry.foundationDepth} m\n"
        f"  Location:   X={entry.posX}, Y={entry.posY}\n\n"
        f"CALCULATED RESULTS\n"
        f"  Factor of Safety (Mohr-Coulomb):  {entry.fs}\n"
        f"  Ultimate bearing capacity (qu):   {bc['ultimate_bc']} kN/m2\n"
        f"  Allowable bearing capacity (qa):  {bc['allowable_bc']} kN/m2\n"
        f"  Bearing capacity factors: Nc={bc['Nc']}, Nq={bc['Nq']}, Ng={bc['Ngamma']}\n\n"
        "Do NOT recalculate. Based on these results, provide:\n"
        "1. Risk level (Low / Moderate / High)\n"
        "2. Key soil-related risks\n"
        "3. Recommended foundation type\n"
        "4. Engineering steps to increase stability\n\n"
        "The FS was calculated using Mohr-Coulomb: Fs = (c' + (σ - u) × tan(φ')) / τ"
    )

    payload = {
        "model": "qwen2.5",
        "messages": [
            {
                "role": "system",
                "content": "You are a geotechnical expert. Analyse the provided data and give concise, practical engineering recommendations."
            },
            {"role": "user", "content": prompt}
        ],
        "max_completion_tokens": 2000,
        "temperature": 0.1,
        "top_p": 0.9
    }

    try:
        response = requests.post(
            AI_ENDPOINT,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=60
        )

        # --- DEBUG ---
        print(f"\n--- AI Connection Debug ---")
        print(f"Target Endpoint: {AI_ENDPOINT}")
        print(f"HTTP Status Code: {response.status_code}")

        response.raise_for_status()

        ai_message = response.json()['choices'][0]['message']['content']
        print(f"AI Response: {ai_message[:120]}...")
        print(f"---------------------------\n")
        # -------------

        return ai_message

    except Exception as e:
        print(f"!!! AI CONNECTION FAILED: {str(e)}")
        return f"AI Analysis Error: {str(e)}"


@app.post("/api/data-ingest")
async def save_data(data: List[FoundationData]):
    global db

    for entry in data:
        entry_dict = entry.model_dump()

        # 1 — Mohr-Coulomb FS
        try:
            entry.fs = f"{calculate_fs(entry_dict):.2f}"
        except Exception as e:
            print(f"FS Error: {e}")
            entry.fs = "Error"

        # 2 — Terzaghi bearing capacity
        try:
            bc = calculate_bearing_capacity(entry_dict)
            entry.ultimate_bc  = str(bc["ultimate_bc"])
            entry.allowable_bc = str(bc["allowable_bc"])
        except Exception as e:
            print(f"BC Error: {e}")
            bc = {"ultimate_bc": 0, "allowable_bc": 0, "Nc": 0, "Nq": 0, "Ngamma": 0}

        # 3 — AI advice
        entry.ai_advice = get_ai_advice(entry, bc)
        db.append(entry)

    return {
        "status": "success",
        "processed_count": len(data),
        "latest_ai_advice": data[-1].ai_advice if data else ""
    }


@app.get("/api/get-foundation-data")
async def get_data():
    return db


@app.get("/health")
def health():
    return {"status": "ok"}
