import {
  easeLinear,
  // easeCircleInOut,
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
  // interpolateString,
  range,
  // scaleLinear,
  select,
  timer
} from "d3";
import "./index.css";

import { VennDiagram } from "venn.js";

import { serializeCategories, addNewCategory } from "./dataStore.js";

import { createGooeyFilter, colorCircles, COLORS } from "./visuals.js";

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

var spacing = 30;
var theta = Math.PI / 3;


//   // gravity: how they overlap i think / forceManyBody
//   // forceManyBody: negative flies apart, positive sticks together
//   // setting this to 100 is fucking wild and it's good
// forceSimulation(nodes)
//   .force("charge", forceManyBody().strength(10))
//   .force("center", forceCenter(width / 2, height / 2))
//   .force(
//     "collision",
//     forceCollide().radius(function (d) {
//       return d.r;
//     })
//   )
//   .on("tick", update)

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


//Set up the circles
// add this only for more chaos
// var flyCircles = vennWrapper.selectAll(".flyCircle")
  // .data(nodes)
  // .enter().append("circle")
  // .attr("class", "flyCircle")
  // .style("fill", function (d) {
  //   return d.color;
  // })
  // .attr("cy", function (d) {
  //   return d.y;
  // })
  // .attr("cx", function (d) {
  //   return d.x;
  // })
  //   .attr("r", function (d) {
  //   return d.r;
  // })
  // .call((enter) =>
  //   enter
  //     .transition()
  //     .duration(500)
  // )
  // .on("end", update); 

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Functions /////////////////////////////////
///////////////////////////////////////////////////////////////////////////
function update() {
  // preparing for the join
  var u = select("svg").selectAll("circle").data(nodes);
    u.enter()
    //adds circle element to dom
    .append("circle")
    // merges selected data + new selected data
    .merge(u)
    .transition()
    .duration(4000)
    .ease(easeLinear)
    .attr("cx", function (d) {
      return d.x + (Math.random() * 50 + 10);
    })
    .attr("cy", function (d) {
      return d.y + (Math.random() * 150 + 3);
    })
    u.exit().remove()
    .on("end", update);
}

// http://bl.ocks.org/syntagmatic/6a921aed54be2a2bea5e56cf2157768b
// added this for fun rotation idk
// fixed loop ending issue so like it's all good
// i think this somehow extends the animation so not sure if data is updating

// timer(function(t) {
//   theta = theta - 0.0005;
//   svg.selectAll(".flyCircle")
//     .attr("transform", function(d,i) {
//        var radius = spacing * Math.sqrt(i),
//            angle = i * theta;
//        return "translate(" + (radius * Math.cos(angle)) + "," + (radius * Math.sin(angle)) + ")"
//     })     
// });

// redraws on resize to fit browser window
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