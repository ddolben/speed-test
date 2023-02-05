import { RollingGraph } from "./rolling-graph";
import { RollingAverage, formatBytes, formatSpeed, must } from "./util";

const startButton = must(document.querySelector("#button")) as HTMLButtonElement;
const avgSpeedOutput = must(document.querySelector("#avg-speed"));
const instantSpeedOutput = must(document.querySelector("#instant-speed"));
const log = must(document.querySelector("#log"));

let avg = new RollingAverage(10);
const graph = new RollingGraph("#graph");
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

  graph.add(new Date().getTime() - start, speed);
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
        bytesToRequestPower = Math.min(30, bytesToRequestPower + 1);
      }
      timed("processDownload", () => processDownload(numBytes, duration));
      delay = Math.max(0, delay - duration);
    } catch (err) {
      log.innerHTML = err + "<br/>" + JSON.stringify(err);
    }
    setTimeout(f, 10);
  };

  f();
}

function main() {
  startButton.onclick = () => {
    startTest();
    startButton.disabled = true;
  };

  graph.render();
}

main();
