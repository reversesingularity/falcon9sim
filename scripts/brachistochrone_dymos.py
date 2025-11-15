import numpy as np
import openmdao.api as om
import dymos as dm
import matplotlib.pyplot as plt

# Ensure plots are shown if script is run in an environment that supports it
# For non-interactive environments (like some CI systems), this might need adjustment
# or plots saved to file instead of shown.
# plt.ion() # Interactive mode on, if needed.

# --- 1. Define the ODE Component ---
class BrachistochroneODE(om.ExplicitComponent):
    def initialize(self):
        self.options.declare('num_nodes', types=int)
        self.options.declare('g', default=9.80665, desc='Gravitational acceleration', types=(float, np.ndarray))

    def setup(self):
        nn = self.options['num_nodes']
        g_option = self.options['g']

        # Inputs
        self.add_input('v', val=np.zeros(nn), desc='velocity', units='m/s')
        self.add_input('theta', val=np.zeros(nn), desc='angle of wire path w.r.t vertical (nadir)', units='rad')
        if isinstance(g_option, np.ndarray): # If g is an array, it's an input
             self.add_input('g', val=g_option*np.ones(nn), desc='Gravitational acceleration', units='m/s**2')

        # Outputs (state rates)
        self.add_output('x_dot', val=np.zeros(nn), desc='rate of change of horizontal position', units='m/s')
        self.add_output('y_dot', val=np.zeros(nn), desc='rate of change of vertical position', units='m/s')
        self.add_output('v_dot', val=np.zeros(nn), desc='rate of change of velocity', units='m/s**2')
        self.add_output('check', val=np.zeros(nn), desc='v/sin(theta) check parameter', units='m/s') # Optional check

        # Partial derivatives
        ar = np.arange(nn)
        self.declare_partials(of='x_dot', wrt='v', rows=ar, cols=ar)
        self.declare_partials(of='x_dot', wrt='theta', rows=ar, cols=ar)
        self.declare_partials(of='y_dot', wrt='v', rows=ar, cols=ar)
        self.declare_partials(of='y_dot', wrt='theta', rows=ar, cols=ar)
        self.declare_partials(of='v_dot', wrt='theta', rows=ar, cols=ar)
        if isinstance(g_option, np.ndarray):
            self.declare_partials(of='v_dot', wrt='g', rows=ar, cols=ar)
        self.declare_partials(of='check', wrt='v', rows=ar, cols=ar)
        self.declare_partials(of='check', wrt='theta', rows=ar, cols=ar)

    def compute(self, inputs, outputs):
        v = inputs['v']
        theta = inputs['theta']
        g_val = self.options['g'] if not isinstance(self.options['g'], np.ndarray) else inputs['g']
        
        sin_theta = np.sin(theta)
        cos_theta = np.cos(theta)
        epsilon = 1e-8 # For numerical stability of 'check'

        outputs['x_dot'] = v * sin_theta
        outputs['y_dot'] = v * cos_theta
        outputs['v_dot'] = g_val * cos_theta
        outputs['check'] = v / (sin_theta + np.sign(sin_theta)*epsilon + epsilon)


    def compute_partials(self, inputs, partials):
        v = inputs['v']
        theta = inputs['theta']
        g_val = self.options['g'] if not isinstance(self.options['g'], np.ndarray) else inputs['g']

        sin_theta = np.sin(theta)
        cos_theta = np.cos(theta)
        epsilon = 1e-8
        denom_check = sin_theta + np.sign(sin_theta)*epsilon + epsilon
        
        partials['x_dot', 'v'] = sin_theta
        partials['x_dot', 'theta'] = v * cos_theta
        partials['y_dot', 'v'] = cos_theta
        partials['y_dot', 'theta'] = -v * sin_theta
        partials['v_dot', 'theta'] = -g_val * sin_theta
        if isinstance(self.options['g'], np.ndarray):
            partials['v_dot', 'g'] = cos_theta
        partials['check', 'v'] = 1.0 / denom_check
        partials['check', 'theta'] = -v * cos_theta / (denom_check**2)

# --- Main script execution ---
if __name__ == '__main__':
    # --- 2. Instantiate OpenMDAO Problem ---
    p = om.Problem(model=om.Group())

    # --- 3. Configure the Optimizer (Driver) ---
    # Attempt to use pyOptSparseDriver with IPOPT
    try:
        p.driver = om.pyOptSparseDriver()
        p.driver.options['optimizer'] = 'IPOPT'
        p.driver.opt_settings['max_iter'] = 300
        p.driver.opt_settings['tol'] = 1e-7
        # IPOPT specific settings
        p.driver.opt_settings['mu_init'] = 1e-3
        p.driver.opt_settings['print_level'] = 5 # IPOPT verbosity (0-12)
        # p.driver.opt_settings['nlp_scaling_method'] = 'gradient-based' # Can help with scaling
        p.driver.declare_coloring() # Important for performance with sparse Jacobians
        print("--- Using pyOptSparseDriver with IPOPT ---")
    except ImportError:
        print("--- pyOptSparseDriver with IPOPT not available. Falling back to ScipyOptimizeDriver with SLSQP ---")
        print("--- For best performance, please install pyOptSparse and IPOPT (see Section I.C) ---")
        p.driver = om.ScipyOptimizeDriver()
        p.driver.options['optimizer'] = 'SLSQP'
        p.driver.options['tol'] = 1e-7
        p.driver.options['maxiter'] = 300 # Note: 'maxiter' for ScipyOptimizeDriver
        p.driver.options['disp'] = True # Display convergence information for SLSQP
        # Note: declare_coloring() is generally not used or as effective with ScipyOptimizeDriver

    # --- 4. Instantiate Dymos Trajectory and Phase ---
    traj = dm.Trajectory()
    p.model.add_subsystem('traj', traj)

    # Transcription: Gauss-Lobatto collocation
    # num_segments: Number of polynomial segments over the phase
    # order: Polynomial order within each segment
    # compressed: True reduces variables by sharing nodes at segment boundaries
    tx = dm.GaussLobatto(num_segments=15, order=3, compressed=True)
    phase = dm.Phase(ode_class=BrachistochroneODE, transcription=tx,
                     ode_init_kwargs={'g': 9.80665}) # Pass g to ODE options
    traj.add_phase('phase0', phase)

    # --- 5. Configure Phase: Time, States, Controls, Objective, Constraints ---
    # Time options: fix initial time, let duration be optimized
    phase.set_time_options(fix_initial=True, duration_bounds=(0.5, 5.0), units='s')

    # State variables
    # x: horizontal position, rate_source is 'x_dot' from ODE
    phase.add_state('x', rate_source='x_dot', units='m',
                    fix_initial=True, fix_final=True) # x(0)=0, x(tf)=X_target (set later)
    # y: vertical position, rate_source is 'y_dot' from ODE
    phase.add_state('y', rate_source='y_dot', units='m',
                    fix_initial=True, fix_final=True) # y(0)=Y_initial, y(tf)=Y_target (set later)
    # v: velocity, rate_source is 'v_dot' from ODE
    phase.add_state('v', rate_source='v_dot', units='m/s',
                    fix_initial=True, fix_final=False, # v(0)=0, v(tf) is free
                    lower=0.0, upper=100.0, # Path constraint on velocity
                    ref=10.0, defect_scaler=10.0) # Scaling hints

    # Control variable: theta (angle of wire)
    phase.add_control('theta', units='rad', lower=1.0E-3, upper=np.pi - 1.0E-3, # Avoid vertical wire
                      continuity=True, rate_continuity=False,
                      targets=['theta'], # Links to 'theta' input in ODE
                      ref=np.pi/2) # CORRECTED: scaler=1.0 removed

    # Objective: Minimize final time
    phase.add_objective('time', loc='final', scaler=1.0)

    # --- 6. Setup the OpenMDAO Problem ---
    # check=True performs model validation (recommended)
    p.setup(check=True)

    # --- 7. Set Initial Values and Guesses ---
    # Time
    p.set_val('traj.phase0.t_initial', 0.0)
    p.set_val('traj.phase0.t_duration', 2.0) # Initial guess for phase duration

    # States:
    # x: initial 0, final 10
    # y: initial 10, final 5 (y is positive downwards for gravity)
    # v: initial 0, final guess (e.g., 10)
    # phase.interp provides a linear interpolation for initial guesses
    p.set_val('traj.phase0.states:x', phase.interp(ys=[0, 10], nodes='state_input'))
    p.set_val('traj.phase0.states:y', phase.interp(ys=[10, 5], nodes='state_input'))
    p.set_val('traj.phase0.states:v', phase.interp(ys=[0, 10], nodes='state_input'))

    # Control: Initial guess for theta (e.g., constant pi/4)
    p.set_val('traj.phase0.controls:theta', phase.interp(ys=[np.pi/4, np.pi/4], nodes='control_input'))

    # --- 8. Run the Optimization using dymos.run_problem ---
    # dm.run_problem handles running the driver, simulating, and making plots
    # Create output directory if it doesn't exist
    import os
    output_dir = 'brachistochrone_dymos_out'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    solution_file = os.path.join(output_dir, 'brachistochrone_solution.db')
    simulation_file = os.path.join(output_dir, 'brachistochrone_simulation.db')
    
    dm.run_problem(p, simulate=True, solution_record_file=solution_file,
                   simulation_record_file=simulation_file,
                   make_plots=True, plot_dir=output_dir) # Save plots in the same output_dir

    # --- 9. Retrieve and Print Key Results (Optional, as make_plots handles some) ---
    final_time_opt = p.get_val('traj.phase0.timeseries.time')[-1]
    # Ensure final_time_opt is a scalar before printing
    final_time_scalar = final_time_opt.item() if isinstance(final_time_opt, np.ndarray) else float(final_time_opt)
    print(f"\nOptimal time of travel: {final_time_scalar:.4f} s")

    # --- 10. Custom Plotting (if make_plots=False or for more specific plots) ---
    # This section is redundant if make_plots=True was used with dm.run_problem and default plots are sufficient.
    # It's included to show how to access timeseries data for custom plotting.
    
    # Get solution data using corrected paths
    time_sol = p.get_val('traj.phase0.timeseries.time')
    x_sol = p.get_val('traj.phase0.timeseries.x')
    y_sol = p.get_val('traj.phase0.timeseries.y')
    v_sol = p.get_val('traj.phase0.timeseries.v')
    theta_sol_deg = np.degrees(p.get_val('traj.phase0.timeseries.theta'))

    fig, axs = plt.subplots(2, 1, figsize=(10, 8))

    # Plot 1: Trajectory (x vs y)
    axs[0].plot(x_sol, y_sol, 'bo-', label='Optimized Trajectory')
    # if 'time_sim' in locals(): # Check if simulation data exists
    #     axs[0].plot(x_sim, y_sim, 'r.--', label='Simulated Trajectory')
    axs[0].set_xlabel('Horizontal Position, x (m)')
    axs[0].set_ylabel('Vertical Position, y (m)')
    axs[0].set_title('Brachistochrone Path')
    axs[0].invert_yaxis() # Assuming y is positive downwards
    axs[0].legend()
    axs[0].grid(True)
    axs[0].axis('equal')


    # Plot 2: Control Profile (theta vs time)
    axs[1].plot(time_sol, theta_sol_deg, 'go-', label='Control $\\theta$ (deg)')
    axs[1].set_xlabel('Time (s)')
    axs[1].set_ylabel('Control Angle, $\\theta$ (degrees from vertical)')
    axs[1].set_title('Control Profile')
    axs[1].legend()
    axs[1].grid(True)

    plt.tight_layout()
    plt.show() # Display the plots

    # N2 Diagram (optional, can be run from command line too)
    # n2_file = os.path.join(output_dir, 'brachistochrone_n2.html')
    # om.n2(p, outfile=n2_file, show_browser=False)
    # print(f"\nN2 diagram saved to {n2_file}")