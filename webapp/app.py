"""
Falcon 9 Simulation Web Application Server
Flask backend for serving the simulation web app
"""

from flask import Flask, render_template, jsonify, send_from_directory
import os
import sys
import pandas as pd
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'falcon9-simulation-key'

# Paths
TELEMETRY_DIR = os.path.join(os.path.dirname(__file__), '..', 'telemetry')
UTILS_DIR = os.path.join(os.path.dirname(__file__), '..', 'utils')
AIRCRAFT_DIR = os.path.join(os.path.dirname(__file__), '..', 'aircraft', 'Falcon9Booster')


@app.route('/')
def index():
    """Serve the 2D simulation page (new default)"""
    return render_template('index2d.html')


@app.route('/3d')
def index_3d():
    """Serve the 3D simulation page"""
    return render_template('index.html')


@app.route('/api/telemetry')
def get_telemetry():
    """Get telemetry data from CSV files"""
    try:
        telemetry_files = [
            'falcon9_descent_telemetry.csv',
            'falcon9_pitch_tuning_telemetry.csv'
        ]
        
        telemetry_data = {}
        
        for filename in telemetry_files:
            filepath = os.path.join(TELEMETRY_DIR, filename)
            if os.path.exists(filepath):
                df = pd.read_csv(filepath)
                # Convert DataFrame to list of dictionaries
                telemetry_data[filename] = df.to_dict('records')
        
        return jsonify({
            'success': True,
            'data': telemetry_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/booster-config')
def get_booster_config():
    """Get Falcon 9 booster configuration from parsed XML data"""
    try:
        # Import the parser
        sys.path.insert(0, UTILS_DIR)
        from parse_falcon9_data import load_booster_data
        
        # Load booster data
        booster_data = load_booster_data(AIRCRAFT_DIR)
        
        return jsonify({
            'success': True,
            'data': booster_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/mission-parameters')
def get_mission_parameters():
    """Get mission parameters for the simulation"""
    parameters = {
        'initial_conditions': {
            'altitude': 80000,  # meters (80 km - typical stage separation altitude)
            'velocity': 2000,    # m/s
            'mass': 25400 + 136078 + 317515,  # kg (dry + fuel + oxidizer)
            'position': {
                'latitude': 28.5729,   # Cape Canaveral
                'longitude': -80.6490,
                'altitude': 80000
            }
        },
        'target_conditions': {
            'landing_site': {
                'latitude': 28.4858,
                'longitude': -80.5444,
                'name': 'Landing Zone 1'
            },
            'landing_velocity': 2.0,  # m/s (target touchdown velocity)
            'landing_accuracy': 10    # meters (target landing accuracy)
        },
        'constraints': {
            'max_g_force': 6.0,
            'max_dynamic_pressure': 50000,  # Pa
            'min_fuel_reserve': 0.05,       # 5% fuel reserve
            'max_heating_rate': 1000        # W/cm^2
        },
        'vehicle_specs': {
            'dry_mass': 25400,              # kg
            'fuel_mass': 136078,            # kg (RP-1)
            'oxidizer_mass': 317515,        # kg (LOX)
            'max_thrust': 7607000,          # N
            'isp_vacuum': 311,              # seconds
            'isp_sea_level': 282,           # seconds
            'number_of_engines': 9,
            'throttle_range': [0.4, 1.0]
        }
    }
    
    return jsonify({
        'success': True,
        'data': parameters
    })


@app.route('/api/simulation-status')
def get_simulation_status():
    """Get current simulation status"""
    # This would be expanded to track actual simulation state
    status = {
        'running': False,
        'time': 0,
        'phase': 'Pre-Launch',
        'telemetry': {
            'altitude': 0,
            'velocity': 0,
            'fuel_remaining': 100
        }
    }
    
    return jsonify({
        'success': True,
        'data': status
    })


@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Falcon 9 Simulation API'
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print("="*60)
    print("Falcon 9 Simulation Web Application")
    print("="*60)
    print(f"Server starting...")
    print(f"Application will be available at: http://localhost:5000")
    print(f"Telemetry directory: {TELEMETRY_DIR}")
    print(f"Aircraft directory: {AIRCRAFT_DIR}")
    print("="*60)
    
    # Run the Flask development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )
