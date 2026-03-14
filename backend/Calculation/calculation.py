import math

def calculate_fs(row):
    c = float(row['cohesion'])
    sigma = float(row['normalStress'])
    phi = math.radians(float(row['frictionAngle']))
    tau = float(row['shearStress'])
    
    # Factor of Safety Formula
    fs = (c + sigma * math.tan(phi)) / tau
    return fs