import os
from lxml import etree

# Define the base directory where XML files are located
BASE_DIR = r"C:\Users\cmodi.000\Falcon9Sim\aircraft\Falcon9Booster"

# Conversion factors from imperial to metric
CONVERSION_FACTORS = {
    'mass': {'LBS': 0.453592},  # pounds to kilograms
    'length': {'FT': 0.3048, 'IN': 0.0254},  # feet to meters, inches to meters
    'area': {'FT2': 0.092903},  # square feet to square meters
    'force': {'LBF': 4.44822},  # pounds-force to newtons
    # Add more conversion factors as needed (e.g., for inertia, angles, etc.)
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
    # Add more mappings as needed
    return None

# Function to convert the data to metric units
def convert_to_metric(data):
    for section in data.values():
        for prop in section.values():
            if 'value' in prop and 'unit' in prop:
                unit = prop['unit']
                for category, units in CONVERSION_FACTORS.items():
                    if unit in units:
                        prop['value'] *= units[unit]
                        prop['unit'] = get_metric_unit(category)
                        break
    return data

# Parsing function for Falcon9Booster.xml
def parse_falcon9booster(booster_data):
    tree = etree.parse(os.path.join(BASE_DIR, 'Falcon9Booster.xml'))
    root = tree.getroot()
    
    # Parse physical properties (adjust based on actual XML structure)
    physical_props = root.find('physical_properties')
    if physical_props is not None:
        for elem in physical_props:
            booster_data['physical_properties'][elem.tag] = {
                'value': float(elem.text),
                'unit': elem.get('unit')
            }
    
    # Parse propulsion (adjust based on actual XML structure)
    propulsion = root.find('propulsion')
    if propulsion is not None:
        booster_data['propulsion']['engines'] = []
        for engine in propulsion.findall('engine'):
            engine_file = engine.get('file')
            if engine_file:
                engine_data = parse_engine_data(engine_file)
                booster_data['propulsion']['engines'].append(engine_data)
    
    # Add parsing for other sections (e.g., aerodynamics, control_systems) as needed

# Parsing function for engine data (e.g., Merlin1D.xml)
def parse_engine_data(engine_file):
    tree = etree.parse(os.path.join(BASE_DIR, engine_file))
    root = tree.getroot()
    # Extract engine properties (adjust based on actual XML)
    engine_data = {
        'thrust': {
            'value': float(root.find('thrust').text),
            'unit': root.find('thrust').get('unit')
        },
        # Add other engine properties as needed
    }
    return engine_data

# Main function to load all booster data
def load_booster_data(unit_system='imperial'):
    """Load Falcon 9 booster data from XML files and optionally convert to metric units.
    
    Args:
        unit_system (str): 'imperial' (default) or 'metric' to specify the desired unit system.
    
    Returns:
        dict: A dictionary containing the parsed booster data with units.
    """
    booster_data = {
        'physical_properties': {},
        'propulsion': {},
        'aerodynamics': {},
        'control_systems': {},
        'initial_conditions': {}
    }
    
    # Populate booster_data with parsed XML data
    parse_falcon9booster(booster_data)
    # Add calls to parse other XML files as needed (e.g., parse_merlin1d, parse_rcs_thruster)
    
    # Convert units if metric is requested
    if unit_system == 'metric':
        booster_data = convert_to_metric(booster_data)
    
    return booster_data

# Test the script when run directly
if __name__ == "__main__":
    data = load_booster_data(unit_system='metric')
    print(data)