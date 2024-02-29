# foundry-anvil-lock-repro

Copy anvil.exe in the root folder

You need node.js to run the project

Before running the code, you need to install the npm dependencies

`node install`

run the code with

`node anvilLockRepro.js`

I've provided the block number for each case because some of them work sometimes, because they are live tokens and their state changes -> they behave differently in some block ranges.

The transaction executes ERC20 transfer between 2 addresses

During my tests, some of them don't lock on debug_traceTransaction if the transfer is reversed from to to send with a valid amount.
These are not my contracts and I don't know who deployed them. I don't know more than anyone could learn by using the explorer.

There could be multiple issues so I've provided multiple many inputs when the issues show up.

To test each input (different from, to, data and blockNumber) just change the array index (values between 0..9) @ line 214

`const input = inputs[0];`

Indices 5..7 trigger out of gas during execution

Index 8 input triggers out of stack during execution

Indices 0..4 I didn't fully check but they should be status 1 txs and have no exec issues.

Index 9 is the one that goes up to 14 GB of memory. My further tests revelead that it uses 13GB during tx execution, goes down as expected after, then it does so again during debug_traceTransaction

The description might be confusing: all 10 of these inputs should trigger a debug_traceTransaction deadlock.

Try any other valid block number (at least hours apart) for any of the example if for some reason they seem to work on your end.
