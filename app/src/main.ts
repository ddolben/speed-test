import { RollingGraph } from "./rolling-graph";
import { RollingAverage, formatBytes, formatSpeed, must } from "./util";

const startButton = must(document.querySelector("#button")) as HTMLButtonElement;
const stopButton = must(document.querySelector("#stop-button")) as HTMLButtonElement;
const avgSpeedOutput = must(document.querySelector("#avg-speed"));
const instantSpeedOutput = must(document.querySelector("#instant-speed"));
const log = must(document.querySelector("#log"));

let killTest = false;
let avg = new RollingAverage(10);
const graph = new RollingGraph("#graph", 10_000, 10_000);
const start = new Date().getTime();

function processDownload(numBytes: number, durationMs: number) {
  const speed = 1000 * numBytes / durationMs;
  const bytesStr = formatBytes(numBytes);
  const avgSpeed = avg.add(speed);
  const instString = formatSpeed(speed);
  console.log(`${instString}    downloaded ${bytesStr} in ${durationMs} ms`);
  const avgString = formatSpeed(avgSpeed);
  console.log(`  avg : ${avgString}`);

  avgSpeedOutput.innerHTML = avgString;
  instantSpeedOutput.innerHTML = instString;
  log.innerHTML = `${bytesStr} in ${durationMs} ms`;

  graph.add(new Date().getTime() - start, speed * 1e-6);
}

async function download(numBytes: number) {
  const resp = await fetch(`/api/test?size=${numBytes}`);
  if (!resp.ok) {
    throw new Error("response was not OK");
  }
  const blob = await resp.blob();
  return {
    numBytes: blob.size,
  };
}

async function streamingDownload(numBytes: number, fn: (bytes: number, totalBytes: number) => void) {
  const resp = await fetch(`/api/test?size=${numBytes}`);
  if (!resp.ok) {
    throw new Error("response was not OK");
  }
  const reader = resp.body?.getReader();
  const contentLength = Number(resp.headers.get('content-length') ?? 0);
  let bytesReceived = 0;
  while (true) {
    const { done, value } = await must(reader).read();
    if (done) { break; }
    bytesReceived += value.length;
    fn(bytesReceived, contentLength);
  }

  return {
    numBytes: bytesReceived,
  };
}

const bytesToRequestBase = 2;
let bytesToRequestPower = 10;
function timed(name: string, fn: () => void) {
  const start = new Date().getTime();
  fn();
  const duration = new Date().getTime() - start;
  console.log(`${name}: ${duration} ms`)
}

function startTest() {
  const f = async () => {
    let delay = 500;
    const upperBound = delay + Math.max(200, delay * 0.3);
    const lowerBound = delay - Math.max(200, delay * 0.3);
    try {
      const start = new Date().getTime();
      const { numBytes } = await download(Math.pow(bytesToRequestBase, bytesToRequestPower));
      const end = new Date().getTime();
      const duration = end - start;
      if (duration > upperBound) {
        bytesToRequestPower = Math.max(1, bytesToRequestPower - 1);
      } else if (duration < lowerBound) {
        // Cut off at 2^27 ~= 135MB
        bytesToRequestPower = Math.min(27, bytesToRequestPower + 1);
      }
      timed("processDownload", () => processDownload(numBytes, duration));
    } catch (err) {
      log.innerHTML = err + "<br/>" + JSON.stringify(err);
    }
    if (killTest) {
      killTest = false;
      return;
    }
    setTimeout(f, 500);
  };

  f();
}

function startStreamingTest() {
  const f = async () => {
    if (killTest) {
      killTest = false;
      return;
    }
    let delay = 500;
    const upperBound = delay + Math.max(200, delay * 0.3);
    const lowerBound = delay - Math.max(200, delay * 0.3);
    try {
      const start = new Date().getTime();
      await streamingDownload(Math.pow(bytesToRequestBase, bytesToRequestPower), (bytes, totalBytes) => {
        const duration = new Date().getTime() - start;
        timed("processDownload", () => processDownload(bytes, duration));
      });
      const duration = new Date().getTime() - start;
      if (duration > upperBound) {
        bytesToRequestPower = Math.max(1, bytesToRequestPower - 1);
      } else if (duration < lowerBound) {
        bytesToRequestPower = Math.min(30, bytesToRequestPower + 1);
      }
      setTimeout(f, 0);
    } catch (err) {
      log.innerHTML = err + "<br/>" + JSON.stringify(err);
      setTimeout(f, 500);
    }
  };

  f();
}

function main() {
  startButton.onclick = () => {
    startStreamingTest();
    startButton.disabled = true;
    stopButton.disabled = false;
  };
  stopButton.onclick = () => {
    killTest = true;
    startButton.disabled = false;
    stopButton.disabled = true;
  };

  graph.render();
}

main();
