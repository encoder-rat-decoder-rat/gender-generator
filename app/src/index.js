import {
  easeLinear,
  easeCircleInOut,
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
  interpolateString,
  range,
  scaleLinear,
  select,
  timer
} from "d3";
import colors from './colors-util.js'
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
var width = window.innerWidth,
 height = window.innerHeight
var spacing = 30;
var theta = Math.PI / 3;

var svg = select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);


//Create scale
// scales are for mapping, eg calc positions based on data
var xScale = scaleLinear()
  .domain([-1.25, 1.25])
  .range([-width / 2, width / 2]);

//Create the circles that will move out and in the center circle
// lower value for prototype
// bump this to like 100 for a good time
var steps = 30;
var nodes = range(steps).map(function(d) {
  return {
    index: d,
    x: Math.random() * width,
    y: Math.random() * height, 
    r: Math.floor(Math.random() * 50 + 15),
    color: colors[d % colors.length],
  }
})

  // gravity: how they overlap i think / forceManyBody
  // forceManyBody: negative flies apart, positive sticks together
  // setting this to 100 is fucking wild and it's good
forceSimulation(nodes)
  .force("charge", forceManyBody().strength(10))
  .force("center", forceCenter(width / 2, height / 2))
  .force(
    "collision",
    forceCollide().radius(function (d) {
      return d.r;
    })
  )
  .on("tick", update)

draw();

select(window).on("resize", draw);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create filter ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

//SVG filter for the gooey effect
//Code taken from http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
var defs = svg.append("defs");
var filter = defs.append("filter").attr("id", "gooeyCodeFilter");
filter
  .append("feGaussianBlur")
  .attr("in", "SourceGraphic")
  .attr("stdDeviation", "10")
  //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
  .attr("color-interpolation-filters", "sRGB")
  .attr("result", "blur");
filter
  .append("feColorMatrix")
  .attr("in", "blur")
  .attr("mode", "matrix")
  .attr("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7")
  .attr("result", "gooey");
//If you want the end shapes to be exactly the same size as without the filter
//add the feComposite below. However this will result in a less beautiful gooey effect
//filter.append("feBlend")
//  .attr("in","SourceGraphic")
//  .attr("in2","gooey");
//Instead of the feBlend, you can do feComposite. This will also place a sharp image on top
//But it will result in smaller circles
//filter.append("feComposite") //feBlend
//  .attr("in","SourceGraphic")
//  .attr("in2","gooey")
//  .attr("operator","atop");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create circles //////////////////////////////
///////////////////////////////////////////////////////////////////////////
var circleWrapper = svg
  .append("g")
  .attr("class", "circleWrapper")
  .style("filter", "url(#gooeyCodeFilter)");

//Set up the circles
var flyCircles = circleWrapper.selectAll(".flyCircle")
  .data(nodes)
  .enter().append("circle")
  .attr("class", "flyCircle")
  .style("fill", function (d) {
    return d.color;
  })
  .attr("cy", function (d) {
    return d.y;
  })
  .attr("cx", function (d) {
    return d.x;
  })
    .attr("r", function (d) {
    return d.r;
  })
  .call((enter) =>
    enter
      .transition()
      .duration(500)
  )
  .on("end", update); 

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

timer(function(t) {
  theta = theta - 0.0005;
  svg.selectAll(".flyCircle")
    .attr("transform", function(d,i) {
       var radius = spacing * Math.sqrt(i),
           angle = i * theta;
       return "translate(" + (radius * Math.cos(angle)) + "," + (radius * Math.sin(angle)) + ")"
    })     
});

// redraws on resize to fit browser window
function draw() {
 var svg = select("body")
  width = window.innerWidth
  height = window.innerHeight
  svg.attr("width", width)
  .attr("height", height);
}
