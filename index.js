import "./index.css";

import {
  // easeLinear,
  // forceCenter,
  // forceCollide,
  // forceManyBody,
  // forceSimulation,
  // range,
  select,
  // timer
} from "d3";

import {  VennDiagram } from "venn.js";

import { serializeCategories, addNewCategory } from "./dataStore.js";

import { createGooeyFilter, colorCircles } from "./visuals.js";

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Reference ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// http://bl.ocks.org/nbremer/0e98c72b043590769facc5e829ebf43f
// http://bl.ocks.org/syntagmatic/6a921aed54be2a2bea5e56cf2157768b
// https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Set-up ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

var width = document.documentElement.clientWidth,
  height = document.documentElement.clientHeight;

draw();
select(window).on("resize", draw);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create filter ///////////////////////////////
///////////////////////////////////////////////////////////////////////////


// Generate the Chart
const chart = VennDiagram().width(width).height(height).duration(2000);

// Create the SVG that houses the chart
const svg = select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

createGooeyFilter(svg);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create circles //////////////////////////////
///////////////////////////////////////////////////////////////////////////
// var circleWrapper = svg
// The wrapper for all of the circles
var vennWrapper = svg
  .append("g")
  .attr("class", "vennWrapper")
  .attr("id", "vennWrapper")
  .style("filter", "url(#gooeyCodeFilter)");

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Functions /////////////////////////////////
///////////////////////////////////////////////////////////////////////////
/**
 * redraws on resize to fit browser window
 */
function draw() {
 var svg = select("body")
 var width = document.documentElement.clientWidth
 var height = document.documentElement.clientHeight;
  svg.attr("width", width)
  .attr("height", height);
}


/**
 * This updates our data and recalls the colorizing function
 */

function updateData() {
  // Fetch our data
  const nodes = serializeCategories();
  vennWrapper.datum(nodes).call(chart);

  // Update all of the colors
  colorCircles();
  chart.orientation(chart.orientation() + Math.PI / 8);
  // update();
}

/**
 * A setInterval loop to update our page every second
 */

window.setInterval(updateData, 1000);

/**
 * Add a random circle
 *
 * @param      {Number}  [size=Math.random()*14+8]  The size
 */
function addOne(size = Math.random() * 14 + 8) {
  addNewCategory("", size);
}

// Add a new category every 2.5 seconds up to 10
for (let i = 0; i < 10; i += 1) {
  window.setTimeout(addOne, 2500 * i);
}