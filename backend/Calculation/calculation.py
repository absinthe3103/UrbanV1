# calculation.py
import math

def calculate_fs(row):
    c     = float(row['cohesion'])
    sigma = float(row['normalStress'])
    phi   = math.radians(float(row['frictionAngle']))
    tau   = float(row['shearStress'])
    u     = float(row.get('porePressure', 0))

    # Factor of Safety (FS) calculation using the Mohr-Coulomb failure criterion
    fs = (c + (sigma - u) * math.tan(phi)) / tau
    return fs

