/**
 * PM2 Ecosystem Configuration
 * For running the application as a permanent service
 */
module.exports = {
  apps: [
    {
      name: 'bongo-fiscal-bridge',
      script: './dist/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      // Load environment variables from .env file
      env_file: '.env',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      restart_delay: 4000,
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};

