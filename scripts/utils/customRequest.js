// httpsRequest.js
// This module is an https request wrapped in a promise design to be used
// to interact with the ICON Blockchain
//
// Imports
const https = require("https");
const http = require("http");
// const { apiNode } = require("../lib.config");

/**
 * async https/http request wrapped in a promise
 * @param {Object} param - params for the http request
 * @param {string} param.hostname
 * @param {string} param.ip
 * @param {number} param.port
 * @param {number} param.timeout
 * @param {string} param.path
 */
async function httpx(
  params,
  data = false,
  runSecured = true,
  useResponseEvent = false
) {
  void useResponseEvent;
  let method = http;
  if (runSecured) {
    method = https;
  }

  const promisifiedQuery = new Promise((resolve, reject) => {
    const query = method.request(params, res => {
      // Print status code on console
      // console.log("Params:");
      // console.log(params);
      // console.log("data:");
      // console.log(data);
      // console.log("Status Code: " + res.statusCode);
      // console.log(`Http: ${runSecured}`);
      // console.log("headers: ", res.headers);

      // Process chunked data
      let rawData = "";
      res.on("data", chunk => {
        rawData += chunk;
      });
      // res.on("data", chunk => {
      //   console.log("chunk: ", chunk);
      //   rawData += chunk;
      //   // if (typeof chunk === "string") {
      //   //   rawData += chunk;
      //   // } else {
      //   //   rawData = { ...chunk };
      //   // }
      // });

      res.on("response", response => {
        console.log("response: ", response);
      });

      // for (let item in res.headers) {
      // console.log(item + ": " + res.headers[item]);
      // }

      // when request completed, pass the data to the 'resolve' callback
      res.on("end", () => {
        let data;
        try {
          if (typeof rawData === "string") {
            data = JSON.parse(rawData);
          } else {
            data = rawData;
          }
          // console.log("raw data");
          // console.log(rawData);
          // console.log("data");
          // console.log(data);
          resolve(data);
        } catch (err) {
          data = { error: err.message, message: rawData };
          console.log("error data");
          console.log(data);
          reject(data);
        }
      });

      // if error, print on console
      res.on("error", err => {
        console.log("Got error: ", +err.message);
      });
    });
    // If request timeout destroy request
    query.on("timeout", () => {
      console.log("timeout. destroying query");
      query.destroy();
    });
    // Handle query error
    query.on("error", err => {
      console.log("error running query, passing error to callback reject");
      reject(err);
    });
    if (data != false) {
      // If data param is passed into function we write the data
      query.write(data);
    }
    // end request
    query.end();
  });
  // wait for the response and return it
  try {
    return await promisifiedQuery;
  } catch (err) {
    console.log("error while running promisifiedQuery");
    console.log(err);
    throw new Error("error connecting to node");
  }
}

async function customRequest(
  path,
  data = false,
  hostname,
  https = true,
  port = false,
  useResponseEvent = false
) {
  let request;
  try {
    let params = {
      hostname: hostname,
      path: path,
      method: data ? "POST" : "GET",
      // headers: {
      //   "Content-Type": "application/json"
      //   // charset: "UTF-8"
      // },
      port: port ? port : https ? 443 : 80
    };
    // if (data != false) {
    //   params.headers["Content-Length"] = Buffer.byteLength(
    //     JSON.stringify(data)
    //   );
    // }

    // console.log("request");
    // console.log(params);
    // console.log(typeof data);
    // console.log(data);
    // console.log(`https: ${https}`);
    if (https) {
      request = await httpx(params, data, true, useResponseEvent);
    } else {
      request = await httpx(params, data, false, useResponseEvent);
    }

    return request;
  } catch (err) {
    console.log("Error running customRequest");
    console.log(err.message);
    console.log(request);
    return null;
  }
}

module.exports = customRequest;
