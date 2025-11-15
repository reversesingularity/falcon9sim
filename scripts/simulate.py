import jsbsim
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import os

# Initialize JSBSim with custom paths
fdm = jsbsim.FGFDMExec(None)
fdm.set_aircraft_path('C:/Users/cmodi.000/Falcon9Sim/aircraft')
fdm.set_engine_path('C:/Users/cmodi.000/Falcon9Sim/aircraft/Falcon9Booster')
fdm.set_systems_path('C:/Python313/Lib/site-packages/jsbsim/systems')

# Load model
fdm.load_model('Falcon9Booster')

# Initial conditions
fdm['ic/h-sl-ft'] = 70_000 / 0.3048
fdm['ic/vc-kts'] = 1500 / 0.514444
fdm['ic/lat-gc-deg'] = 28.5
fdm['ic/long-gc-deg'] = -80.5
fdm['ic/psi-true-deg'] = 0
fdm['ic/theta-deg'] = 0
fdm['ic/phi-deg'] = 0

# Environmental conditions
fdm['atmosphere/wind-mag-fps'] = 10 / 0.3048
fdm['atmosphere/density-slugft3'] = 0.002377

# Simulation parameters
fdm.set_dt(0.01)
t_max = 120
t = np.arange(0, t_max, fdm.get_delta_t())
telemetry = []

# Control logic
def control_logic(t):
    if 10 <= t < 20:  # Boostback
        return {'throttle': 0.5, 'gridfin': 0}
    elif 60 <= t < 70:  # Reentry
        return {'throttle': 0.3, 'gridfin': 0.5}  # 10 deg
    elif 100 <= t < 110:  # Landing
        return {'throttle': 0.7, 'gridfin': 0.25}  # 5 deg
    else:
        return {'throttle': 0, 'gridfin': 0}

# Run simulation
for i, t_i in enumerate(t):
    controls = control_logic(t_i)
    fdm['propulsion/engine/throttle'] = controls['throttle']
    fdm['fcs/gridfin-cmd-norm'] = controls['gridfin']
    fdm.run()
    telemetry.append({
        'time_s': t_i,
        'x_m': fdm['position/x-gc-m'],
        'y_m': fdm['position/y-gc-m'],
        'z_m': fdm['position/h-sl-m'],
        'vx_mps': fdm['velocities/vc-mps'],
        'vy_mps': fdm['velocities/vn-mps'],
        'vz_mps': fdm['velocities/vd-mps'],
        'pitch_deg': fdm['attitude/pitch-deg'],
        'yaw_deg': fdm['attitude/heading-deg'],
        'roll_deg': fdm['attitude/roll-deg'],
        'thrust_N': fdm['propulsion/engine/thrust-lbs'] * 4.44822,
        'gridfin_deg': fdm['fcs/gridfin-angle-deg']
    })

# Save telemetry
df = pd.DataFrame(telemetry)
df.to_csv('output/telemetry.csv', index=False)

# Plot 3D trajectory
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.plot(df['x_m']/1000, df['y_m']/1000, df['z_m']/1000)
ax.set_xlabel('X (km)')
ax.set_ylabel('Y (km)')
ax.set_zlabel('Altitude (km)')
ax.set_title('Falcon 9 Booster Trajectory')
plt.show()