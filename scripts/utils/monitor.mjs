import ora from "ora";
import process from "node:process";

class Monitor {
  constructor(
    jvmService,
    xcallAddress,
    dappAddress,
    initBlockHeight = null,
    startSpinner = false
  ) {
    if (jvmService == null || xcallAddress == null || dappAddress == null) {
      throw new Error("Invalid arguments");
    }
    this.jvmService = jvmService;
    this.xcallAddress = xcallAddress;
    this.dappAddress = dappAddress;
    this.initBlockHeight = initBlockHeight;
    this.running = false;
    this.timer = null;
    this.currentBlockHeight = null;
    this.events = {
      ResponseMessage: [],
      RollbackMessage: [],
      CallMessage: [],
      MessageReceived: [],
      RollbackExecuted: []
    };
    this.loopSpinner = ora({
      text: `> Waiting for events..`,
      spinner: process.argv[2]
    });
    this.startSpinner = startSpinner;
    this.filterResponseMessageEvent = this.filterResponseMessageEvent.bind(
      this
    );
    this.filterRollbackMessageEvent = this.filterRollbackMessageEvent.bind(
      this
    );
    this.filterCallMessageEvent = this.filterCallMessageEvent.bind(this);
    this.filterMessageReceivedEvent = this.filterMessageReceivedEvent.bind(
      this
    );
    this.filterRollbackExecutedEvent = this.filterRollbackExecutedEvent.bind(
      this
    );
    this.spinnerStart = this.spinnerStart.bind(this);
  }

  spinnerSuccess(text = "Waiting for events..") {
    this.loopSpinner.text = `> ${text} (block: ${
      this.currentBlockHeight
    }). Events => ${JSON.stringify(this.events)}`;
    this.loopSpinner.succeed();
  }

  validateEvent(eventLabel, id) {
    console.log("validate event");
    for (const event of this.events[eventLabel]) {
      switch (eventLabel) {
        case "ResponseMessage":
          if (event.indexed[1] === id) {
            this.spinnerSuccess();
            return true;
          }
          break;
        case "RollbackMessage":
          if (event.indexed[1] === id) {
            this.spinnerSuccess();
            return true;
          }
          break;
        case "CallMessage":
          if (event.indexed[3] === id) {
            this.spinnerSuccess();
            return true;
          }
          break;
        case "MessageReceived":
          if (event.data[1] === id) {
            this.spinnerSuccess();
            return true;
          }
          break;
        case "RollbackExecuted":
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

  async waitForEvents(eventLabel, id) {
    // const spinner = ora(
    //   `> Waiting for event ${eventLabel} with id ${id}`
    // ).start();
    return new Promise(resolve => {
      // check if events are already available
      if (this.events[eventLabel].length > 0) {
        const check = this.validateEvent(eventLabel, id);
        if (check) {
          // spinner.succeed(`> Event ${eventLabel} with id ${id} found`);
          resolve();
        }
      } else {
        // if events are not available
        // wait for the next loop iteration
        const checkForEvents = () => {
          this.loopSpinner.text = `> Waiting for events.. (block: ${
            this.currentBlockHeight
          }). Events => ${JSON.stringify(this.events)}`;
          if (this.events[eventLabel].length > 0) {
            const check = this.validateEvent(eventLabel, id);
            if (check) {
              // spinner.succeed(`> Event ${eventLabel} with id ${id} found`);
              resolve();
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

  async getBlockJvm(label = null) {
    try {
      const hashStart = "0x";
      if (label == null || label == "latest") {
        return await this.jvmService.getLastBlock().execute();
      } else if (typeof label == "string" && label.startsWith(hashStart)) {
        return await this.jvmService.getBlockByHash(label).execute();
      } else {
        return await this.jvmService.getBlockByHeight(label).execute();
      }
    } catch (err) {
      console.log("Error getting block on JVM chain:");
      console.log(err);
      throw new Error("Error getting block on JVM chain");
    }
  }

  async getTxResult(txHash) {
    const maxLoops = 10;
    let loop = 0;
    while (loop < maxLoops) {
      try {
        return await this.jvmService.getTransactionResult(txHash).execute();
      } catch (err) {
        loop++;
        await this.sleep(1000);
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getBlock(height = null) {
    try {
      return await this.getBlockJvm(height);
    } catch (e) {
      return null;
    }
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

  filterResponseMessageEvent(eventlog) {
    const signature = "ResponseMessage(int,int)";
    return this.filterEvent(eventlog, signature);
  }

  filterRollbackMessageEvent(eventlog) {
    const signature = "RollbackMessage(int)";
    return this.filterEvent(eventlog, signature);
  }

  filterCallMessageEvent(eventlog) {
    const signature = "CallMessage(str,str,int,int,bytes)";
    return this.filterEvent(eventlog, signature);
  }

  filterMessageReceivedEvent(eventlog) {
    const signature = "MessageReceived(str,bytes)";
    return this.filterEvent(eventlog, signature, this.dappAddress);
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
        const block = await this.getBlock(height);
        if (block != null) {
          this.currentBlockHeight = block.height + 1;

          for (const tx of block.confirmedTransactionList) {
            const txResult = await this.getTxResult(tx.txHash);
            [
              [this.filterResponseMessageEvent, "ResponseMessage"],
              [this.filterRollbackMessageEvent, "RollbackMessage"],
              [this.filterCallMessageEvent, "CallMessage"],
              [this.filterMessageReceivedEvent, "MessageReceived"],
              [this.filterRollbackExecutedEvent, "RollbackExecuted"]
            ].forEach(([filterCallback, eventName]) => {
              const events = filterCallback(txResult.eventLogs);
              if (events.length > 0) {
                // test log
                // if (eventName === "ResponseMessage") {
                //   console.log("ResponseMessage");
                //   console.log(events);
                // }
                this.events[eventName] = this.events[eventName].concat(events);
                console.log(this.events);
              }
            });
          }
        } else {
          await this.sleep(1000);
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

export default Monitor;
