import { spawn } from 'node:child_process';

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) reject(new Error(`Process terminated by ${signal}`));
      else resolve(code ?? 1);
    });
  });

const migrationExitCode = await run([
  'node_modules/prisma/build/index.js',
  'migrate',
  'deploy',
]);

if (migrationExitCode !== 0) process.exit(migrationExitCode);

const application = spawn(process.execPath, ['dist/src/presentation/main.js'], {
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => application.kill(signal));
}

application.once('error', (error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
application.once('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
