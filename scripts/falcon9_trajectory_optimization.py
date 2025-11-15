import os
from lxml import etree
import openmdao.api as om
import dymos as dm
import numpy as np
import matplotlib.pyplot as plt

# Define the base directory where XML files are located
BASE_DIR = r"C:\Users\cmodi.000\Falcon9Sim\aircraft\Falcon9Booster"

# Conversion factors from imperial to metric
CONVERSION_FACTORS = {
    'mass': {'LBS': 0.453592},  # pounds to kilograms
    'length': {'FT': 0.3048, 'IN': 0.0254},  # feet to meters, inches to meters
    'area': {'FT2': 0.092903},  # square feet to square meters
    'force': {'LBF': 4.44822},  # pounds-force to newtons
}

# Function to get the metric unit based on the category
def get_metric_unit(category):
    if category == 'mass':
        return 'kg'
    elif category == 'length':
        return 'm'
    elif category == 'area':
        return 'm2'
    elif category == 'force':
        return 'N'
    return None

# Function to convert the data to metric units
def convert_to_metric(data):
    for section in data.values():
        for prop in section.values():
            if isinstance(prop, dict) and 'value' in prop and 'unit' in prop:
                unit = prop['unit']
                for category, units in CONVERSION_FACTORS.items():
                    if unit in units:
                        prop['value'] *= units[unit]
                        prop['unit'] = get_metric_unit(category)
                        break
            elif isinstance(prop, list):
                for item in prop:
                    if 'value' in item and 'unit' in item:
                        unit = item['unit']
                        for category, units in CONVERSION_FACTORS.items():
                            if unit in units:
                                item['value'] *= units[unit]
                                item['unit'] = get_metric_unit(category)
                                break
    return data

# Parsing function for Falcon9Booster.xml
def parse_falcon9booster(booster_data):
    try:
        tree = etree.parse(os.path.join(BASE_DIR, 'Falcon9Booster.xml'))
        root = tree.getroot()
        
        # Parse physical properties
        physical_props = root.find('physical_properties')
        if physical_props is not None:
            for elem in physical_props:
                booster_data['physical_properties'][elem.tag] = {
                    'value': float(elem.text),
                    'unit': elem.get('unit')
                }
        
        # Parse propulsion
        propulsion = root.find('propulsion')
        if propulsion is not None:
            booster_data['propulsion']['engines'] = []
            for engine in propulsion.findall('engine'):
                engine_file = engine.get('file')
                if engine_file:
                    engine_data = parse_engine_data(engine_file)
                    booster_data['propulsion']['engines'].append(engine_data)
    except (FileNotFoundError, etree.XMLSyntaxError):
        # Fallback default values if XML is not found or invalid
        booster_data['physical_properties']['mass'] = {'value': 10000, 'unit': 'kg'}
        booster_data['propulsion']['engines'] = [{'thrust': {'value': 100000, 'unit': 'N'}}]

# Parsing function for engine data
def parse_engine_data(engine_file):
    try:
        tree = etree.parse(os.path.join(BASE_DIR, engine_file))
        root = tree.getroot()
        engine_data = {
            'thrust': {
                'value': float(root.find('thrust').text),
                'unit': root.find('thrust').get('unit')
            }
        }
        return engine_data
    except (FileNotFoundError, etree.XMLSyntaxError):
        return {'thrust': {'value': 100000, 'unit': 'N'}}

# Main function to load all booster data
def load_booster_data(unit_system='imperial'):
    booster_data = {
        'physical_properties': {},
        'propulsion': {},
        'aerodynamics': {},
        'control_systems': {},
        'initial_conditions': {}
    }
    
    parse_falcon9booster(booster_data)
    
    if unit_system == 'metric':
        booster_data = convert_to_metric(booster_data)
    
    return booster_data

# Define the ODE system for the booster
class BoosterODE(om.ExplicitComponent):
    def initialize(self):
        self.options.declare('num_nodes', types=int)
        self.options.declare('g', types=float, default=9.81)
        self.options.declare('mass', types=float)
        self.options.declare('max_thrust', types=float)

    def setup(self):
        nn = self.options['num_nodes']
        self.add_input('h', shape=(nn,), units='m', desc='altitude')
        self.add_input('v', shape=(nn,), units='m/s', desc='velocity')
        self.add_input('throttle', shape=(nn,), units=None, desc='throttle setting')
        self.add_output('hdot', shape=(nn,), units='m/s', desc='altitude rate')
        self.add_output('vdot', shape=(nn,), units='m/s**2', desc='velocity rate')
        self.declare_partials('*', '*', method='fd')

    def compute(self, inputs, outputs):
        v = inputs['v']
        throttle = inputs['throttle']
        g = self.options['g']
        mass = self.options['mass']
        max_thrust = self.options['max_thrust']
        T = throttle * max_thrust
        outputs['hdot'] = v
        outputs['vdot'] = (T - mass * g) / mass

if __name__ == "__main__":
    # Load booster data in metric units
    data = load_booster_data(unit_system='metric')
    
    # Extract parameters (use defaults if parsing fails)
    mass = data['physical_properties'].get('mass', {'value': 10000})['value']
    max_thrust = data['propulsion']['engines'][0]['thrust']['value']
    g = 9.81  # Earth's gravity in m/s^2
    
    # Set up the OpenMDAO problem
    p = om.Problem()
    traj = p.model.add_subsystem('traj', dm.Trajectory())
    
    # Define the phase
    phase = traj.add_phase('descent', dm.Phase(ode_class=BoosterODE, transcription=dm.Radau(num_segments=20)))
    
    # Configure time
    phase.set_time_options(fix_initial=True, duration_bounds=(5, 20), units='s')
    
    # Configure states
    phase.add_state('h', rate_source='hdot', units='m', fix_initial=True, fix_final=True)
    phase.add_state('v', rate_source='vdot', units='m/s', fix_initial=True, fix_final=True)
    
    # Configure control
    phase.add_control('throttle', units=None, lower=0, upper=1, opt=True)
    
    # Configure parameters
    phase.add_parameter('g', units='m/s**2', val=g, opt=False)
    phase.add_parameter('mass', units='kg', val=mass, opt=False)
    phase.add_parameter('max_thrust', units='N', val=max_thrust, opt=False)
    
    # Set boundary conditions
    phase.set_state_options('h', fix_initial=True, fix_final=True)
    phase.set_state_options('v', fix_initial=True, fix_final=True)
    p.set_val('traj.descent.states:h', 1000, indices=0)  # Initial altitude
    p.set_val('traj.descent.states:v', -100, indices=0)  # Initial velocity
    p.set_val('traj.descent.states:h', 0, indices=-1)    # Final altitude
    p.set_val('traj.descent.states:v', 0, indices=-1)    # Final velocity
    
    # Define objective: minimize final time
    phase.add_objective('time', loc='final', scaler=1.0)
    
    # Set up the driver
    p.driver = om.ScipyOptimizeDriver()
    p.driver.declare_coloring()
    
    # Final setup
    p.setup()
    
    # Set initial guesses
    p.set_val('traj.descent.t_initial', 0.0)
    p.set_val('traj.descent.t_duration', 10.0)
    p.set_val('traj.descent.states:h', phase.interpolate(ys=[1000, 0], nodes='state_input'))
    p.set_val('traj.descent.states:v', phase.interpolate(ys=[-100, 0], nodes='state_input'))
    p.set_val('traj.descent.controls:throttle', 0.5)
    
    # Run the optimization
    p.run_driver()
    
    # Extract results
    time = p.get_val('traj.descent.timeseries.time')
    h = p.get_val('traj.descent.timeseries.states:h')
    v = p.get_val('traj.descent.timeseries.states:v')
    throttle = p.get_val('traj.descent.timeseries.controls:throttle')
    
    # Visualization
    plt.figure(figsize=(10, 8))
    
    plt.subplot(3, 1, 1)
    plt.plot(time, h, 'b-')
    plt.grid(True)
    plt.ylabel('Altitude (m)')
    plt.title('Falcon 9 Booster Landing Trajectory')
    
    plt.subplot(3, 1, 2)
    plt.plot(time, v, 'r-')
    plt.grid(True)
    plt.ylabel('Velocity (m/s)')
    
    plt.subplot(3, 1, 3)
    plt.plot(time, throttle, 'g-')
    plt.grid(True)
    plt.ylabel('Throttle')
    plt.xlabel('Time (s)')
    
    plt.tight_layout()
    plt.show()