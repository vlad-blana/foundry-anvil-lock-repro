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

  console.log(txResponse);
  console.log();

  console.log('sending evm_mine...');
  await anvilProvider.send('evm_mine', []);
  console.log('sent evm_mine');
  console.log();

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


const inputs = [
  {
    to: '0x0C2A894a9a279128a1b531bABdeC4F169518Ac2C',
    from: '0xc7Fea9907F84388C599F311395774edc8332F82b',
    data: '0xa9059cbb0000000000000000000000001538a3f30d65018bd3be1d744d82a6877936f44d0000000000000000000000000000000000000000605dc52d7a33b38dff157b3a',
    blockNumber: 19735496
  },
  {
    to: '0x1B7B541BeA3aF39292FCe08649e4C4e1BEE408a1',
    from: '0x57b329880e4FbfE5b58d078BD13D0DA30ce1Ef2B',
    data: '0xa9059cbb00000000000000000000000057b329880e4fbfe5b58d078bd13d0da30ce1ef2b00000000000000000000000000000000000000003f4e7ac667ddf9bf7a8d1d27',
    blockNumber: 19735496
  },
  {
    to: '0xB0D06895a957390145C6C6E0fbdB5d9dFbC21E18',
    from: '0xAAf32C33b5C475F745A2E9CEd38c6453DFd75E8f',
    data: '0xa9059cbb0000000000000000000000006200f994874ef517a00c479fbf3021ec511e8dfc000000000000000000000000000000000000000000000000065412c7cd1ce221',
    blockNumber: 19735496
  },
  {
    to: '0x153f04aDCB55eA1b486212dA0C3dE7781f6DBC37',
    from: '0x1dA27D81E4E43CD7445b33cf2B62CbA09878E842',
    data: '0xa9059cbb000000000000000000000000227972286d58952931283620fcd3f0d1e5c9a73400000000000000000000000000000000000000000000000032a3cddea762f7be',
    blockNumber: 19735496
  },
  {
    to: '0xA5016E7eED255Ee5CC1FB880bcba3FAfB90D2493',
    from: '0x672e036600e1d0098Ce139971cf060B5281db683',
    data: '0xa9059cbb000000000000000000000000dab7dc7ffc7c0f5736632e0161a9e53596c504f70000000000000000000000000000000000000000000b8c24d97781b56c55ae89',
    blockNumber: 19735496
  },
  // out of gas scenario (the contract seems to force its way past the 30M maximum block gas limit)
  {
    reason: 'out of gas',
    to: '0x47cd1790BBA178894ce245D022ce869C674275dE',
    from: '0xA8ab175Bcea7C4F539cD1c8F971421af9497ac65',
    data: '0xa9059cbb000000000000000000000000ccf703cc593a012574794509dd3533c1d05ea347000000000000000000000000000000000000000000000060f5489579f802467b',
    blockNumber: 19735923
  },
  {
    reason: 'out of gas',
    to: '0xc479439E7FcF8a7d26be442A983A25274dAb01C1',
    from: '0x2AD63B5EC2556c23351E0E27840234a96794151C',
    data: '0xa9059cbb000000000000000000000000791eec22593b08cc7d1f36905540d783827aa0340000000000000000000000000000000000000000000000175c85f7565d7510ad',
    blockNumber: 19735982
  },
  {
    reason: 'out of gas',
    to: '0x814d80b125DcB3aDAeD53b9977D0bf3555791DA8',
    from: '0x901b320Ce845b813f860ee42FaC2007578AA61Cb',
    data: '0xa9059cbb00000000000000000000000095d063d642aaa8c161670ec50f2790e2f6b901f700000000000000000000000000000000000000000000001e6bbfeee21dd021e1',
    blockNumber: 19736003
  },
  // out of stack
  {
    reason: 'out of stack',
    to: '0x69fa0feE221AD11012BAb0FdB45d444D3D2Ce71c',
    from: '0x361Edd915e9d58E18f5FA88027E97FEc5Cb64dCE',
    data: '0xa9059cbb0000000000000000000000007ad4780dfa1624ad1dca5d514c90ea7cf6eb37f900000000000000000000000000000000000000000000c02c60f1004843f1c796',
    blockNumber: 19735967
  },
  // memory issue
  {
    to: '0xd629326F068CB4cD6ee135aF925fD417DB8cAe1e',
    from: '0xCaa30f07D990FCb972BA6c1CEf820764888CB06a',
    data: '0xa9059cbb00000000000000000000000087af8dbf286f9f4ed9950c536ab9546637a39752000000000000000000000000000000000000000000000015bfcc914c0aecbe6c',
    blockNumber: 19736060
  }
];

// CHANGE ONLY THE INDEX HERE
const input = inputs[0];

doStuff(
  'anvil.exe',
  'wss://rpc-pulsechain.g4mm4.io',
  8545,
  369,
  input.from,
  input.to,
  input.data,
  input.blockNumber
)