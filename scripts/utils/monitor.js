const { getBlockJvm, getTxResult } = require("./utils");

class Monitor {
  constructor(jvmService, xcallAddress, initBlockHeight = null) {
    this.jvmService = jvmService;
    this.xcallAddress = xcallAddress;
    this.initBlockHeight = initBlockHeight;
    this.running = false;
    this.timer = null;
    this.currentBlockHeight = null;
    this.events = {
      ResponseMessage: [],
      RollbackMessage: []
    };
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
      return await getBlockJvm(height);
    } catch (e) {
      return null;
    }
  }

  async getTxResult(txHash) {
    try {
      return await getTxResult(txHash);
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
    const signature = "ResponseMessage(int,int,str)";
    return this.filterEvent(eventlog, signature);
  }

  filterRollbackMessageEvent(eventlog) {
    const signature = "RollbackMessage(int)";
    return this.filterEvent(eventlog, signature);
  }

  async runLoop() {
    this.timer = setTimeout(async () => {
      if (this.running) {
        // Your background loop logic here
        // console.log(
        //   `Background loop is running... block => ${this.currentBlockHeight}`
        // );
        const height =
          this.currentBlockHeight !== null
            ? this.currentBlockHeight
            : this.initBlockHeight == null
            ? null
            : this.initBlockHeight;
        const block = await this.getBlock(height);
        if (block != null) {
          this.currentBlockHeight = block.height + 1;

          for (const tx of block.confirmedTransactionList) {
            const txResult = await this.getTxResult(tx.txHash);
            const responseMessageEvents = this.filterResponseMessageEvent(
              txResult.eventLogs
            );
            const rollbackMessageEvents = this.filterRollbackMessageEvent(
              txResult.eventLogs
            );

            if (responseMessageEvents.length > 0) {
              this.events.ResponseMessage = this.events.ResponseMessage.concat(
                responseMessageEvents
              );
            }
            if (rollbackMessageEvents.length > 0) {
              this.events.RollbackMessage = this.events.RollbackMessage.concat(
                rollbackMessageEvents
              );
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

module.exports = { Monitor };
