module.exports = {
  apps: [
    {
      name: 'yega-api',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '~/.pm2/logs/yega-api-error.log',
      out_file: '~/.pm2/logs/yega-api-out.log',
      combine_logs: true,

      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001,http://localhost:5173',
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        CORS_ORIGINS: 'https://app.stg.yega.com.mx,https://tienda.stg.yega.com.mx,https://repartidor.stg.yega.com.mx',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        CORS_ORIGINS: 'https://app.yega.com.mx,https://tienda.yega.com.mx,https://repartidor.yega.com.mx',
      },
    },
  ],
};
