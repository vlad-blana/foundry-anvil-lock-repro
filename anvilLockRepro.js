import { spawn } from 'child_process';
import { JsonRpcSigner, Network, WebSocketProvider } from 'ethers';

export const spawnAnvilForkChildProcess = (
  anvilExeFilePath = '../../../../anvil.exe',
  forkNodeUrl,
  port,
  {
    accounts = 0,
    randomSeed = false,
    noRateLimit = true,
    noMining = true,
    noStorageCaching = false,
    silent = false,
    stdio = 'pipe',
    stepsTracing = true,
  } = {}
) => spawn(
  anvilExeFilePath,
  [
    `--fork-url=${forkNodeUrl}`,
    `--port=${port}`,
    '--auto-impersonate',
    `--accounts=${accounts}`,
    noRateLimit ? '--no-rate-limit' : null,
    noMining ? '--no-mining' : null,
    noStorageCaching ? '--no-storage-caching' : null,
    silent ? '--silent' : null,
    randomSeed ? '--mnemonic-random' : null,
    stepsTracing ? '--steps-tracing' : null
  ].filter(k => k),
  {
    stdio
  }
);

const doStuff = async (
  anvilExeFilePath = '../../../../anvil.exe',
  forkNodeUrl,
  anvilPort = 8545,
  networkCode = 369,
  from,
  to,
  data,
  blockNumber
) => {
  console.log('Starting anvil as child process...');

  const pi = spawnAnvilForkChildProcess(
    anvilExeFilePath,
    forkNodeUrl,
    anvilPort
  );

  console.log('Started anvil.exe');

  console.log('Establishing web socket connection with anvil...');

  const anvilProvider = await new Promise(resolve => {
    const init = () => {
      try {
        const provider = new WebSocketProvider(
          `ws://127.0.0.1:${anvilPort}`,
          undefined,
          {
            staticNetwork: Network.from(networkCode),
            cacheTimeout: -1,
            pollingInterval: 1 // TODO - test if this does anything at all
          }
        );

        provider.websocket.on('open', () => resolve(provider));

        provider.websocket.on('error', () => setTimeout(init, 50));
      } catch {
        setTimeout(init, 50);
      }
    }

    init()
  });

  console.log('Established web socket connection with anvil instance');
  console.log();

  const fromSigner = new JsonRpcSigner(anvilProvider, from);

  console.log('sending anvil_reset...');
  console.log('Block number', blockNumber);
  await anvilProvider.send('anvil_reset', [{ blockNumber }]);
  console.log('sent anvil_reset');
  console.log();

  console.log('sending anvil_setNextBlockBaseFeePerGas...');
  await anvilProvider.send('anvil_setNextBlockBaseFeePerGas', ['7']);
  console.log('sent anvil_setNextBlockBaseFeePerGas');
  console.log();

  console.log('sending anvil_reset...');
  await anvilProvider.send('anvil_setBalance', [from, '0x021e19e0c9bab2400000']);
  console.log('sent anvil_reset');
  console.log();

  console.log('broadcasting tx...');
  const txResponse = await fromSigner.sendTransaction({
    to,
    data,
    gasLimit: 30000000n
  });
  console.log('received txResponse');
  console.log();

  console.log('sending evm_mine...');
  await anvilProvider.send('evm_mine', []);
  console.log('sent evm_mine');
  console.log();
  console.log(txResponse);

  console.log('requesting tx receipt...');
  const txReceipt = await anvilProvider.getTransactionReceipt(txResponse.hash);
  console.log('received txReceipt');
  console.log();

  console.log(txReceipt);
  console.log();

  console.log('sending debug_traceTransaction...');
  // const trace = await anvilProvider.send('trace_transaction', [txResponse.hash]);
  const debugTrace = await anvilProvider.send('debug_traceTransaction', [txResponse.hash])
  console.log('received debug_traceTransaction trace');
  console.log();

  console.log(Object.keys(debugTrace));
  // console.log(trace)

  // kill anvil child process
  pi.kill();
}


const input = {
  to: '0x0C2A894a9a279128a1b531bABdeC4F169518Ac2C',
  from: '0xc7Fea9907F84388C599F311395774edc8332F82b',
  data: '0xa9059cbb0000000000000000000000001538a3f30d65018bd3be1d744d82a6877936f44d0000000000000000000000000000000000000000605dc52d7a33b38dff157b3a'
}

const blockNumber = 19735496;

doStuff(
  'anvil.exe',
  'wss://rpc-pulsechain.g4mm4.io',
  8545,
  369,
  input.from,
  input.to,
  input.data,
  blockNumber
)