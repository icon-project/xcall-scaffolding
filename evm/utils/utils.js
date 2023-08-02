/*
 * sleep - sleeps for the specified time
 * @param {number} ms - the time to sleep
 * @returns {object} - async function
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * strToHex - converts a string to hex
 * @param {string} str - the string to convert
 * @returns {string} - the hex string
 * @throws {Error} - if there is an error converting the string
 */
function strToHex(str) {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += "" + str.charCodeAt(i).toString(16);
  }
  return "0x" + hex;
}

/*
 * strToHexPadded - converts a string to hex and pads it
 * @param {string} str - the string to convert
 * @returns {string} - the hex string
 * @throws {Error} - if there is an error converting the string
 */
function strToHexPadded(str) {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex +=
      "" +
      str
        .charCodeAt(i)
        .toString(16)
        .padStart(2, "0");
  }
  return "0x" + hex;
}

/*
 * isValidEVMAddress - checks if the address is valid
 * @param {string} address - the address to check
 * @returns {boolean} - true if the address is valid
 */
function isValidEVMAddress(address) {
  return address && address.length === 42 && address.startsWith("0x");
}

const utils = {
  sleep,
  strToHex,
  strToHexPadded,
  isValidEVMAddress
};

module.exports = utils;
