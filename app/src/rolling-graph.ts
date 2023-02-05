import * as d3 from "d3";
import './style.css';
import { must } from "./util";

type LineData = {
  ts: number;
  value: number;
};

export class RollingGraph {
  private data: [number, number][] = [];
  constructor(
    private containerId: string,
    private maxTime: number,
    private maxCount: number,
  ) {}

  render() {
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line<LineData>()
        .x(function(d) { return x(d.ts); })
        .y(function(d) { return y(d.value); });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    must(document.querySelector(this.containerId)).innerHTML = "";
    var svg = d3.select(this.containerId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    const data = this.data.map(d => ({ ts: d[0], value: d[1] }));

    // Scale the range of the data
    const xExtent = d3.extent(data, function(d) { return d.ts; });
    if (xExtent[0] === undefined) {
      throw new Error("undefined extent");
    }
    x.domain(xExtent);
    y.domain([0, d3.max(data, function(d) { return d.value; }) ?? 0]);

    // Add the valueline path.
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline);

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
  }

  add(x: number, y: number) {
    this.data.push([x, y])
    while (this.data.length > this.maxCount) {
      this.data.shift();
    }
    while (this.data[this.data.length - 1][0] - this.data[0][0] > this.maxTime) {
      this.data.shift();
    }
    this.render();
  }
};
