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

import { VennDiagram } from "venn.js";

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
/**
 * redraws on resize to fit browser window
 */
function resizeChart() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  console.log("resize!!", width, height);
  svg.attr("width", width).attr("height", height);
  chart.width(width).height(height);
}

// Generate the Chart
const chart = VennDiagram();

// Create the SVG that houses the chart
const svg = select("body").append("svg");

resizeChart();
select(window).on("resize", resizeChart);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create filter ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

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
 * This updates our data and recalls the colorizing function
 */

function updateData() {
  // Fetch our data
  const nodes = serializeCategories();
  vennWrapper.datum(nodes).call(chart);

  // Update all of the colors
  colorCircles();
}

/**
 * A setInterval loop to update our page every second
 */

window.setInterval(updateData, 2000);

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
  window.setTimeout(addOne, 5000 * i);
}
