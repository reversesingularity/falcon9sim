// charts.js - Data Visualization with Chart.js

class TelemetryCharts {
    constructor() {
        this.altitudeChart = null;
        this.velocityChart = null;
        this.fuelChart = null;
        this.machChart = null;

        this.maxDataPoints = F9_CONSTANTS.MAX_CHART_POINTS;
        this.timeData = [];
        this.altitudeData = [];
        this.velocityData = [];
        this.fuelData = [];
        this.machData = [];

        this.frameCount = 0;

        this.init();
    }

    init() {
        this.createAltitudeChart();
        this.createVelocityChart();
        this.createFuelChart();
        this.createMachChart();
    }

    createAltitudeChart() {
        const ctx = document.getElementById('altitudeChart').getContext('2d');
        this.altitudeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeData,
                datasets: [{
                    label: 'Altitude (km)',
                    data: this.altitudeData,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: '#8b92a7'
                        },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Altitude (km)',
                            color: '#8b92a7'
                        },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createVelocityChart() {
        const ctx = document.getElementById('velocityChart').getContext('2d');
        this.velocityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeData,
                datasets: [{
                    label: 'Velocity (m/s)',
                    data: this.velocityData,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: '#8b92a7'
                        },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Velocity (m/s)',
                            color: '#8b92a7'
                        },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createFuelChart() {
        const ctx = document.getElementById('fuelChart').getContext('2d');
        this.fuelChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeData,
                datasets: [{
                    label: 'Fuel (%)',
                    data: this.fuelData,
                    borderColor: '#ffa502',
                    backgroundColor: 'rgba(255, 165, 2, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: '#8b92a7'
                        },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Fuel Remaining (%)',
                            color: '#8b92a7'
                        },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' },
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createMachChart() {
        const el = document.getElementById('machChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        this.machChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeData,
                datasets: [{
                    label: 'Mach',
                    data: this.machData,
                    borderColor: '#ffa502',
                    backgroundColor: 'rgba(255, 165, 2, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: 'Time (s)', color: '#8b92a7' },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' }
                    },
                    y: {
                        display: true,
                        title: { display: true, text: 'Mach', color: '#8b92a7' },
                        ticks: { color: '#8b92a7' },
                        grid: { color: '#2d3748' },
                        beginAtZero: true
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    update(telemetry, frameCount) {
        // Only update at ~10Hz (every 6 frames)
        if (frameCount !== undefined && frameCount % F9_CONSTANTS.CHART_UPDATE_INTERVAL !== 0) return;

        // Add new data point
        this.timeData.push(Math.round(telemetry.time));
        this.altitudeData.push((telemetry.altitude / 1000).toFixed(2)); // Convert to km
        this.velocityData.push(telemetry.velocity.toFixed(0));
        this.fuelData.push(telemetry.fuel.toFixed(1));
        this.machData.push(parseFloat(telemetry.mach || 0));

        // Limit data points
        if (this.timeData.length > this.maxDataPoints) {
            this.timeData.shift();
            this.altitudeData.shift();
            this.velocityData.shift();
            this.fuelData.shift();
            this.machData.shift();
        }

        // Update charts
        this.altitudeChart.update();
        this.velocityChart.update();
        this.fuelChart.update();
        if (this.machChart) this.machChart.update();
    }

    reset() {
        this.timeData = [];
        this.altitudeData = [];
        this.velocityData = [];
        this.fuelData = [];
        this.machData = [];

        this.altitudeChart.update();
        this.velocityChart.update();
        this.fuelChart.update();
        if (this.machChart) this.machChart.update();
    }
}

// Export for use in app.js
window.TelemetryCharts = TelemetryCharts;
