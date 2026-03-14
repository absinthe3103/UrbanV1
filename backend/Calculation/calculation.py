# calculation.py
import math


# ──────────────────────────────────────────────
# 1. MOHR-COULOMB  →  Factor of Safety
# ──────────────────────────────────────────────
def calculate_fs(row):
    """
    Mohr-Coulomb failure criterion:
        FS = (c' + (σ - u) · tan φ') / τ
    """
    c     = float(row['cohesion'])
    sigma = float(row['normalStress'])
    phi   = math.radians(float(row['frictionAngle']))
    tau   = float(row['shearStress'])
    u     = float(row.get('porePressure', 0))

    fs = (c + (sigma - u) * math.tan(phi)) / tau
    return round(fs, 2)


# ──────────────────────────────────────────────
# 2. TERZAGHI  →  Bearing Capacity
# ──────────────────────────────────────────────
def calculate_bearing_capacity(row):
    """
    Terzaghi general bearing capacity (strip footing):
        qu = c·Nc + γ·Df·Nq + 0.5·γ·B·Nγ

    Returns a dict with:
        ultimate_bc   – qu  (kN/m²)
        allowable_bc  – qa = qu / 3  (kN/m²)
        Nc, Nq, Ngamma
    """
    c     = float(row['cohesion'])
    phi   = math.radians(float(row.get('frictionAngle', 0)))
    gamma = float(row.get('unitWeight', 18))        # γ  kN/m³
    Df    = float(row.get('foundationDepth', 1.5))  # Df m
    B     = float(row.get('foundationWidth', 1.5))  # B  m
    gw    = float(row.get('groundwaterDepth', 999)) # groundwater depth m

    # Bearing-capacity factors
    if float(row.get('frictionAngle', 0)) == 0:
        Nc, Nq, Ng = 5.14, 1.0, 0.0
    else:
        Nq = math.exp(math.pi * math.tan(phi)) * (math.tan(math.radians(45 + float(row.get('frictionAngle', 0)) / 2)) ** 2)
        Nc = (Nq - 1) / math.tan(phi)
        Ng = 2 * (Nq + 1) * math.tan(phi)

    qu = c * Nc + gamma * Df * Nq + 0.5 * gamma * B * Ng

    # Groundwater correction
    if gw <= Df:
        qu *= 0.5
    elif gw <= Df + B:
        factor = 0.5 + 0.5 * (gw - Df) / B
        qu *= factor

    qa = qu / 3.0

    return {
        "ultimate_bc":  round(qu, 2),
        "allowable_bc": round(qa, 2),
        "Nc":           round(Nc, 3),
        "Nq":           round(Nq, 3),
        "Ngamma":       round(Ng,  3),
    }
