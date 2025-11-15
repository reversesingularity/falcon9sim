# improved_falcon9_sim.py
import os
import jsbsim
import numpy as np
import matplotlib.pyplot as plt
import csv
import math

# === Paths ===
aircraft_path = os.path.abspath("C:/Users/cmodi.000/Falcon9Sim/aircraft")
engine_path = os.path.abspath("C:/Users/cmodi.000/Falcon9Sim/aircraft/Falcon9Booster")
systems_path = os.path.abspath("C:/Python313/Lib/site-packages/jsbsim/systems")
telemetry_dir = os.path.abspath("C:/Users/cmodi.000/Falcon9Sim/telemetry")
os.makedirs(telemetry_dir, exist_ok=True)

# === Initialize JSBSim ===
fdm = jsbsim.FGFDMExec(None)
fdm.set_debug_level(3)
fdm.set_aircraft_path(aircraft_path)
fdm.set_engine_path(engine_path)
fdm.set_systems_path(systems_path)

# Load model and check if successful
try:
    fdm.load_model('Falcon9Booster')
    print(f"Model loaded successfully. JSBSim version: {jsbsim.__version__}")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

# === Enhanced Initial Conditions ===
# More realistic Falcon 9 entry conditions
fdm['ic/h-sl-ft'] = 70000      # Entry altitude (feet) - reduced for more realistic scenario
fdm['ic/vc-fps'] = -400        # Initial downward velocity (fps) - more realistic entry speed
fdm['ic/pitch-deg'] = -10      # Slight nose down for controlled descent
fdm['ic/psi-true-deg'] = 0     # Heading (degrees)
fdm['ic/phi-deg'] = 0          # Roll (degrees)
fdm['ic/long-gc-deg'] = -80.6  # Cape Canaveral longitude
fdm['ic/lat-gc-deg'] = 28.6    # Cape Canaveral latitude

# Set velocity components more realistically
fdm['ic/u-fps'] = -50          # Small forward velocity component
fdm['ic/v-fps'] = 0            # No lateral velocity
fdm['ic/w-fps'] = -395         # Primarily downward velocity

# Initialize fuel state (partially depleted after ascent)
fdm['propulsion/tank[0]/contents-lbs'] = 50000  # Remaining RP-1
fdm['propulsion/tank[1]/contents-lbs'] = 120000 # Remaining LOX

# Deploy landing legs initially
fdm['gear/gear-cmd-norm'] = 1.0

fdm.run_ic()

# === Enhanced Simulation Parameters ===
dt = fdm.get_delta_t()
max_time = 500                 # Extended simulation time
steps = int(max_time / dt)
telemetry = []

# === Enhanced Control System ===
class Falcon9Controller:
    def __init__(self):
        # PID gains for attitude control (tuned for Falcon 9)
        self.pid_pitch = {'kp': 0.8, 'ki': 0.02, 'kd': 0.15}
        self.pid_yaw = {'kp': 0.6, 'ki': 0.015, 'kd': 0.12}
        self.pid_roll = {'kp': 0.4, 'ki': 0.01, 'kd': 0.08}
        
        # Error terms
        self.pitch_integral = 0
        self.yaw_integral = 0
        self.roll_integral = 0
        self.prev_pitch_error = 0
        self.prev_yaw_error = 0
        self.prev_roll_error = 0
        
        # Landing burn parameters
        self.burn_phases = {
            'entry': {'alt_start': 70000, 'alt_end': 45000, 'throttle': 0.0},
            'boostback': {'alt_start': 45000, 'alt_end': 25000, 'throttle': 0.0},
            'entry_burn': {'alt_start': 25000, 'alt_end': 15000, 'throttle': 0.3},
            'landing_burn': {'alt_start': 3000, 'alt_end': 0, 'throttle': 0.8}
        }
        
        self.burn_active = False
        self.current_phase = 'entry'
    
    def calculate_desired_attitude(self, altitude, velocity_vector):
        """Calculate desired attitude based on flight phase and trajectory"""
        if altitude > 15000:
            # High altitude - maintain vertical orientation for grid fin control
            desired_pitch = 0  # Nose up (vertical)
        elif altitude > 3000:
            # Entry phase - slight nose down for controlled descent
            desired_pitch = -15
        else:
            # Landing phase - nearly vertical with small corrections
            desired_pitch = -5
        
        desired_yaw = 0
        desired_roll = 0
        
        return desired_pitch, desired_yaw, desired_roll
    
    def update_control(self, fdm, dt):
        """Main control update function"""
        # Get current state
        altitude = fdm['position/h-sl-ft']
        pitch = fdm['attitude/pitch-deg']
        yaw = fdm['attitude/psi-true-deg']
        roll = fdm['attitude/phi-deg']
        vvert = -fdm['velocities/w-fps']  # Upward positive
        
        # Get velocity vector
        u = fdm['velocities/u-fps']
        v = fdm['velocities/v-fps']  
        w = fdm['velocities/w-fps']
        velocity_vector = np.array([u, v, w])
        
        # Calculate desired attitudes
        desired_pitch, desired_yaw, desired_roll = self.calculate_desired_attitude(altitude, velocity_vector)
        
        # Calculate errors
        pitch_error = desired_pitch - pitch
        yaw_error = desired_yaw - yaw
        roll_error = desired_roll - roll
        
        # Handle angle wrapping
        yaw_error = self._wrap_angle(yaw_error)
        roll_error = self._wrap_angle(roll_error)
        
        # Update integrals with windup protection
        max_integral = 10.0
        self.pitch_integral = np.clip(self.pitch_integral + pitch_error * dt, -max_integral, max_integral)
        self.yaw_integral = np.clip(self.yaw_integral + yaw_error * dt, -max_integral, max_integral)
        self.roll_integral = np.clip(self.roll_integral + roll_error * dt, -max_integral, max_integral)
        
        # Calculate derivatives
        pitch_deriv = (pitch_error - self.prev_pitch_error) / dt
        yaw_deriv = (yaw_error - self.prev_yaw_error) / dt
        roll_deriv = (roll_error - self.prev_roll_error) / dt
        
        # PID control outputs
        pitch_control = (self.pid_pitch['kp'] * pitch_error + 
                        self.pid_pitch['ki'] * self.pitch_integral + 
                        self.pid_pitch['kd'] * pitch_deriv)
        
        yaw_control = (self.pid_yaw['kp'] * yaw_error + 
                      self.pid_yaw['ki'] * self.yaw_integral + 
                      self.pid_yaw['kd'] * yaw_deriv)
        
        roll_control = (self.pid_roll['kp'] * roll_error + 
                       self.pid_roll['ki'] * self.roll_integral + 
                       self.pid_roll['kd'] * roll_deriv)
        
        # Clip control outputs
        pitch_control = np.clip(pitch_control, -1.0, 1.0)
        yaw_control = np.clip(yaw_control, -1.0, 1.0)
        roll_control = np.clip(roll_control, -1.0, 1.0)
        
        # Apply controls
        fdm['fcs/pitch-control'] = pitch_control
        fdm['fcs/yaw-control'] = yaw_control
        fdm['fcs/roll-control'] = roll_control
        
        # Engine throttle control
        throttle = self.calculate_throttle(altitude, vvert)
        fdm['propulsion/engine[0]/set-throttle'] = throttle
        
        # Grid fin control for atmospheric flight
        if altitude > 1000:  # Only use grid fins in atmosphere
            lateral_vel = fdm['velocities/v-fps']
            gridfin_cmd = np.clip(-0.1 * lateral_vel - 0.05 * yaw_error, -1.0, 1.0)
            fdm['fcs/gridfin-cmd-norm'] = gridfin_cmd
        else:
            fdm['fcs/gridfin-cmd-norm'] = 0.0
        
        # Store previous errors
        self.prev_pitch_error = pitch_error
        self.prev_yaw_error = yaw_error
        self.prev_roll_error = roll_error
        
        return {
            'throttle': throttle,
            'pitch_control': pitch_control,
            'yaw_control': yaw_control,
            'roll_control': roll_control,
            'gridfin_cmd': fdm['fcs/gridfin-cmd-norm'] if altitude > 1000 else 0.0
        }
    
    def calculate_throttle(self, altitude, vvert):
        """Calculate engine throttle based on altitude and vertical velocity"""
        if altitude > 25000:
            # High altitude - no thrust
            return 0.0
        elif altitude > 15000:
            # Entry burn phase - light thrust to slow down
            if vvert < -200:  # Too fast
                return 0.4
            else:
                return 0.0
        elif altitude > 3000:
            # Descent phase - minimal thrust
            if vvert < -100:
                return 0.3
            else:
                return 0.0
        else:
            # Landing burn phase - aggressive control
            target_velocity = self._calculate_target_velocity(altitude)
            velocity_error = target_velocity - vvert
            
            # Throttle based on velocity error and altitude
            base_throttle = 0.6 + 0.4 * (altitude / 3000)  # Higher throttle at higher altitude
            velocity_correction = np.clip(velocity_error * 0.02, -0.3, 0.4)
            
            throttle = base_throttle + velocity_correction
            return np.clip(throttle, 0.4, 1.0)
    
    def _calculate_target_velocity(self, altitude):
        """Calculate target velocity for landing approach"""
        if altitude > 1000:
            # Linear deceleration from current to landing velocity
            return -20 - (altitude / 1000) * 30  # -50 fps at 1000ft, -20 fps at ground
        else:
            # Final approach - very slow descent
            return -10 - (altitude / 100) * 10   # -20 fps at 100ft, -10 fps at ground
    
    def _wrap_angle(self, angle):
        """Wrap angle to [-180, 180] range"""
        while angle > 180:
            angle -= 360
        while angle < -180:
            angle += 360
        return angle

# === Main Simulation Loop ===
controller = Falcon9Controller()
landed = False

print("Starting Falcon 9 landing simulation...")
print(f"Initial conditions: Alt={fdm['position/h-sl-ft']:.0f}ft, VVel={-fdm['velocities/w-fps']:.1f}fps")

for step in range(steps):
    time = step * dt
    
    # Get current state
    altitude = fdm['position/h-sl-ft']
    vvert = -fdm['velocities/w-fps']
    pitch = fdm['attitude/pitch-deg']
    yaw = fdm['attitude/psi-true-deg']
    roll = fdm['attitude/phi-deg']
    fuel_mass = fdm['propulsion/tank[0]/contents-lbs']
    
    # Update controller
    control_outputs = controller.update_control(fdm, dt)
    
    # Run simulation step
    try:
        fdm.run()
    except Exception as e:
        print(f"Simulation error at t={time:.1f}s: {e}")
        break
    
    # Log telemetry
    telemetry.append([
        time, altitude, vvert, pitch, yaw, roll,
        control_outputs['throttle'], fuel_mass,
        fdm['velocities/v-fps'],  # lateral velocity
        control_outputs.get('gridfin_cmd', 0.0),
        control_outputs['pitch_control'],
        control_outputs['yaw_control'],
        control_outputs['roll_control']
    ])
    
    # Progress reporting
    if step % 1000 == 0:
        print(f"t={time:.1f}s: Alt={altitude:.0f}ft, VVel={vvert:.1f}fps, Throttle={control_outputs['throttle']:.2f}")
    
    # Check for landing or crash
    if altitude <= 0.0:
        landing_velocity = abs(vvert)
        if landing_velocity < 10:  # 10 fps = ~6.8 mph
            print(f"🎉 SUCCESSFUL LANDING! Touchdown velocity: {landing_velocity:.2f} fps ({landing_velocity*0.682:.1f} mph)")
        elif landing_velocity < 20:
            print(f"⚠️  HARD LANDING! Touchdown velocity: {landing_velocity:.2f} fps ({landing_velocity*0.682:.1f} mph)")
        else:
            print(f"💥 CRASH! Touchdown velocity: {landing_velocity:.2f} fps ({landing_velocity*0.682:.1f} mph)")
        
        landed = True
        break
    
    # Safety check - stop if simulation goes too long or something goes wrong
    if time > max_time or altitude > 100000:
        print("Simulation stopped - exceeded limits")
        break

# === Enhanced Data Analysis and Visualization ===
print(f"Simulation completed. Total time: {time:.1f}s")

# Save telemetry
telemetry_file = os.path.join(telemetry_dir, "falcon9_landing_telemetry.csv")
with open(telemetry_file, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow([
        "Time (s)", "Altitude (ft)", "Vertical Speed (fps)", "Pitch (deg)", 
        "Yaw (deg)", "Roll (deg)", "Throttle", "Fuel Mass (lbs)", 
        "Lateral Vel (fps)", "GridFin Cmd", "Pitch Control", "Yaw Control", "Roll Control"
    ])
    writer.writerows(telemetry)

print(f"Telemetry saved to: {telemetry_file}")

# Enhanced plotting
if telemetry:
    data = np.array(telemetry)
    time_data = data[:, 0]
    alt_data = data[:, 1]
    vvert_data = data[:, 2]
    throttle_data = data[:, 6]
    pitch_data = data[:, 3]
    
    # Create comprehensive plots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    
    # Altitude and velocity profile
    ax1.plot(time_data, alt_data, 'b-', label='Altitude (ft)', linewidth=2)
    ax1_twin = ax1.twinx()
    ax1_twin.plot(time_data, vvert_data, 'r-', label='Vertical Speed (fps)', linewidth=2)
    ax1.set_xlabel('Time (s)')
    ax1.set_ylabel('Altitude (ft)', color='b')
    ax1_twin.set_ylabel('Vertical Speed (fps)', color='r')
    ax1.set_title('Altitude and Vertical Speed vs Time')
    ax1.grid(True, alpha=0.3)
    
    # Engine throttle
    ax2.plot(time_data, throttle_data * 100, 'g-', label='Engine Throttle (%)', linewidth=2)
    ax2.set_xlabel('Time (s)')
    ax2.set_ylabel('Throttle (%)')
    ax2.set_title('Engine Throttle vs Time')
    ax2.grid(True, alpha=0.3)
    ax2.set_ylim(0, 100)
    
    # Attitude
    ax3.plot(time_data, pitch_data, 'purple', label='Pitch (deg)', linewidth=2)
    ax3.set_xlabel('Time (s)')
    ax3.set_ylabel('Pitch Angle (deg)')
    ax3.set_title('Pitch Attitude vs Time')
    ax3.grid(True, alpha=0.3)
    
    # Trajectory (altitude vs vertical speed)
    ax4.plot(vvert_data, alt_data, 'orange', linewidth=2)
    ax4.set_xlabel('Vertical Speed (fps)')
    ax4.set_ylabel('Altitude (ft)')
    ax4.set_title('Descent Trajectory')
    ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plot_path = os.path.join(telemetry_dir, "falcon9_landing_analysis.png")
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Analysis plots saved to: {plot_path}")
    plt.show()

print("Simulation complete!")