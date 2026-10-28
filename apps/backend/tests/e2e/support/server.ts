import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';

export async function iniciarApi() {
  // Escolhe uma porta livre; nunca reutiliza um servidor de desenvolvimento.
  const reserva = createServer();
  reserva.listen(0, '127.0.0.1');
  await once(reserva, 'listening');
  const endereco = reserva.address();
  if (!endereco || typeof endereco === 'string') throw Error('Não foi possível reservar a porta E2E.');
  const porta = endereco.port;
  await new Promise<void>((resolve, reject) => reserva.close(error => error ? reject(error) : resolve()));

  const processo = spawn(process.execPath, ['dist/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(porta), NODE_ENV: 'test', FRONTEND_ORIGIN: 'http://localhost:25173' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  processo.stdout.on('data', chunk => { logs = `${logs}${chunk}`.slice(-10000); });
  processo.stderr.on('data', chunk => { logs = `${logs}${chunk}`.slice(-10000); });
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => terminar(Error(`API E2E não iniciou em 20s.\n${logs}`)), 20000);
      const aoSair = () => terminar(Error(`API E2E encerrou antes de iniciar.\n${logs}`));
      const aoErro = (error: Error) => terminar(error);
      const aoReceber = () => { if (logs.includes('Servidor rodando em')) terminar(); };
      function terminar(error?: Error) {
        clearTimeout(timeout);
        processo.off('exit', aoSair); processo.off('error', aoErro); processo.stdout.off('data', aoReceber);
        if (error) reject(error); else resolve();
      }
      processo.once('exit', aoSair); processo.once('error', aoErro); processo.stdout.on('data', aoReceber);
    });
  } catch (error) {
    await encerrarApi(processo);
    throw error;
  }
  return { processo, url: `http://127.0.0.1:${porta}`, logs: () => logs };
}

export async function encerrarApi(processo: ChildProcess) {
  if (processo.exitCode !== null || processo.signalCode !== null) return;
  const encerrado = once(processo, 'exit');
  processo.kill('SIGTERM');
  const timeout = setTimeout(() => processo.kill('SIGKILL'), 5000);
  try { await encerrado; } finally { clearTimeout(timeout); }
}
