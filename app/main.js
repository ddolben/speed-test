(function() {

class RollingAverage {
  constructor(num) {
    this.values = [];
    this.max = num;
    this.ptr = 0;
  }

  add(val) {
    if (this.values.length < this.max) {
      this.values.push(val);
    } else {
      this.values[this.ptr] = val;
      this.ptr = (this.ptr + 1) % this.max;
    }
    return this.avg();
  }

  avg() {
    let acc = this.values[0];
    for (let i = 1; i < this.values.length; i++) {
      acc += this.values[i];
    }
    return acc / this.values.length;
  }
}

function formatBytes(n) {
  if (n) {
    return `${n * 0.000001} MB`;
  }
  if (n > 1000) {
    return `${n * 0.001} KB`;
  }
  return `${n} B`;
}

function formatSpeed(n) {
  return `${formatBytes(n)}/s`;
}

const button = document.querySelector("#button");
const avgSpeedOutput = document.querySelector("#avg-speed");
const instantSpeedOutput = document.querySelector("#instant-speed");
const log = document.querySelector("#log");

let avg = new RollingAverage(10);

function processDownload(numBytes, durationMs) {
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
      log.innerHTML(err.toString() + "<br/>" + JSON.stringify(err));
    }
    setTimeout(f, 1000);
  };

  f();
}

button.onclick = () => {
  startTest();
  button.disabled = true;
};

})();
