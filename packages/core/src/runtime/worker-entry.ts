import { workerData, parentPort } from 'node:worker_threads';

if (!parentPort) throw new Error('worker-entry must run in a worker thread');

const { agentName } = workerData as { agentName: string; agentDef: unknown };

parentPort.on('message', async (msg) => {
  if (msg.type === 'ask') {
    parentPort!.postMessage({
      type: 'response',
      id: msg.id,
      payload: `Agent ${agentName} received: ${JSON.stringify(msg.payload)}`,
    });
  }
  if (msg.type === 'broadcast') {
    console.log(`[${agentName}] received broadcast: ${msg.event}`);
  }
});

parentPort.postMessage({ type: 'ready', agentName });
