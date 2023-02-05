import { RollingGraph } from "./rolling-graph";
import { RollingAverage, formatBytes, formatSpeed, must } from "./util";

const button = must(document.querySelector("#button")) as HTMLButtonElement;
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

async function download() {
  const resp = await fetch("/api/test?size=10000000");
  if (!resp.ok) {
    throw new Error("response was not OK");
  }
  const blob = await resp.blob();
  return {
    numBytes: blob.size,
  };
}

function startTest() {
  const f = async () => {
    try {
      const start = new Date().getTime();
      const { numBytes } = await download();
      const end = new Date().getTime();
      processDownload(numBytes, end - start);
    } catch (err) {
      log.innerHTML = err + "<br/>" + JSON.stringify(err);
    }
    setTimeout(f, 1000);
  };

  f();
}

function main() {
  button.onclick = () => {
    startTest();
    button.disabled = true;
  };

  graph.render();
}

main();
