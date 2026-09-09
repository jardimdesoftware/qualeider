import http from 'node:http';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const request = http.get(
  {
    hostname: '127.0.0.1',
    port,
    path: '/api/health',
    timeout: 5_000,
  },
  (response) => {
    response.resume();
    process.exit(response.statusCode >= 200 && response.statusCode < 400 ? 0 : 1);
  },
);

request.on('timeout', () => request.destroy(new Error('Healthcheck timed out')));
request.on('error', () => process.exit(1));
