# foundry-anvil-lock-repro

Copy anvil.exe in the root folder

You need node.js to run the project

Before running the code, you need to install the npm dependencies

`node install`

run the code with

`node anvilLockRepro.js`

It fork - anvil_reset at block 19735496 on pulsechain, because theory even the latest block should be good

The transaction executes ERC20 transfer between 2 addresses

During my tests, some of them don't lock on debug_traceTransaction if the transfer is reversed from to to send with a valid amount.
These are not my contracts and I don't know who deployed them. I don't know more than anyone could learn by using the explorer.
