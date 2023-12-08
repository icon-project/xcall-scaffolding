import ora from "ora";
import process from "node:process";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { StargateClient } from "@cosmjs/stargate";

class CosmWasmMonitor {
  constructor(
    cosmwasmRpc,
    xcallAddress,
    initBlockHeight = null,
    startSpinner = false
  ) {
    if (cosmwasmRpc == null || xcallAddress == null) {
      throw new Error("Invalid arguments");
    }
    this.cosmwasmRpc = cosmwasmRpc;
    this.xcallAddress = xcallAddress;
    this.initBlockHeight = initBlockHeight;
    this.client = null;
    this.running = false;
    this.timer = null;
    this.currentBlockHeight = null;
    this.events = {
      RollbackExecuted: []
    };
    this.loopSpinner = ora({
      text: `> Waiting for events..`,
      spinner: process.argv[2]
    });
    this.startSpinner = startSpinner;
    this.filterRollbackExecutedEvent = this.filterRollbackExecutedEvent.bind(
      this
    );
    this.spinnerStart = this.spinnerStart.bind(this);
  }

  spinnerSuccess(text = "Waiting for events..") {
    if (this.startSpinner) {
      this.loopSpinner.text = `> ${text} (block: ${
        this.currentBlockHeight
      }). Events => ${JSON.stringify(this.events)}`;
      this.loopSpinner.succeed();
    }
  }

  validateEvent(eventLabel, id) {
    for (const event of this.events[eventLabel]) {
      switch (eventLabel) {
        case "ResponseMessage":
          if (event.indexed[1] === id) {
            this.spinnerSuccess();
            return true;
          }
          break;
        default:
          break;
      }
    }
    return false;
  }

  async waitForEvents(eventLabel, id, spinner = null, maxBlockHeight = null) {
    return new Promise(resolve => {
      // check if events are already available
      if (this.events[eventLabel].length > 0) {
        const check = this.validateEvent(eventLabel, id);
        if (check) {
          resolve();
        }
      } else {
        // if events are not available
        // wait for the next loop iteration
        const checkForEvents = () => {
          // if maxBlockHeight is reached, resolve and end the loop
          if (maxBlockHeight != null) {
            if (this.currentBlockHeight >= maxBlockHeight) {
              resolve();
            }
          }

          if (spinner != null) {
            setTimeout(() => {
              spinner.suffixText = `> Waiting for events.. (block: ${
                this.currentBlockHeight
              }). Events => ${JSON.stringify(this.events)}`;
            }, 2000);
          }
          if (this.startSpinner) {
            setTimeout(() => {
              this.loopSpinner.text = `> Waiting for events.. (block: ${
                this.currentBlockHeight
              }). Events => ${JSON.stringify(this.events)}`;
            }, 2000);
          }
          if (this.events[eventLabel].length > 0) {
            const check = this.validateEvent(eventLabel, id);
            if (check) {
              resolve();
            } else {
              setTimeout(checkForEvents, 100);
            }
          } else {
            setTimeout(checkForEvents, 100);
          }
        };
        // start checking for events
        checkForEvents();
      }
    });
  }

  getCurrentBlockHeight() {
    return this.currentBlockHeight;
  }

  getEvents() {
    return { ...this.events };
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.runLoop();
    }
  }

  async getBlock(height = null) {
    try {
      if (this.client == null) {
        this.client = await StargateClient.connect(this.cosmwasmRpc);
      }
      if (height != null) {
        return await this.client.getBlock(height);
      }
      return await this.client.getBlock();
    } catch (err) {
      console.log("\n> Block monitor: Error getting block on COSMWASM chain:");
      console.log(err);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  filterEvent(eventlogs, sig, address = this.xcallAddress) {
    const result = eventlogs.filter(event => {
      return (
        event.indexed &&
        event.indexed[0] === sig &&
        (!address || address === event.scoreAddress)
      );
    });

    return result;
  }

  filterRollbackExecutedEvent(eventlog) {
    const signature = "RollbackExecuted(int)";
    return this.filterEvent(eventlog, signature);
  }

  spinnerStart() {
    this.startSpinner = true;
    this.loopSpinner.start();
  }

  async runLoop() {
    this.timer = setTimeout(async () => {
      if (this.startSpinner) {
        this.loopSpinner.start();
      }
      if (this.running) {
        const height =
          this.currentBlockHeight !== null
            ? this.currentBlockHeight
            : this.initBlockHeight == null
            ? null
            : this.initBlockHeight;
        setTimeout(() => {
          this.loopSpinner.text = `> Waiting for events.. (block: ${
            this.currentBlockHeight
          }). Events => ${JSON.stringify(this.events)}`;
        }, 2000);
        if (height == null) {
          const block = await this.getBlock(height);
          console.log("\n> Block monitor: Block height: ");
          console.log(block);
          if (block != null) {
            this.currentBlockHeight = block.header.height + 1;
          } else {
            await this.sleep(1000);
          }
        } else {
          let chainHeight = null;
          if (this.client != null) {
            chainHeight = await this.client.getHeight();
            if (height < chainHeight) {
              const block = await this.getBlock(height);
              console.log("\n> Block monitor: Block height: ");
              console.log(block);
              if (block != null) {
                this.currentBlockHeight = block.header.height + 1;
              } else {
                await this.sleep(1000);
              }
            } else {
              await this.sleep(1000);
            }
          }
        }

        this.runLoop();
      }
    }, 1000); // Adjust the interval as needed
  }

  async close() {
    if (this.running) {
      this.running = false;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      // Perform any cleanup here if needed
      // console.log("Background loop closed.");
    }
  }
}

export default CosmWasmMonitor;
