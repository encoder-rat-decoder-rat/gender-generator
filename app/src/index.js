import {
  easeCircle,
  easeLinear,
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
  interpolateString,
  range,
  scaleLinear,
  select,
} from 'd3'

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

  var width = 960, height = 500;
  var spacing= 30;
  var theta = Math.PI/3;


  // nodes need to come from data i think
  var nodes = range(150).map(function() { return {radius: Math.random() * 14 + 8}; }),
  root = nodes[0];

  root.radius = 0;
  root.fixed = true;

  var force =  forceSimulation(nodes)
    // .force('charge', forceManyBody().strength(-20))
    // .force('charge', forceManyBody().strength(function(d, i) { return i ? 0 : -2000; }))
    // gravity: how they overlap i think / forceManyBody

    // forceManyBody: negative flies apart, positive sticks together
    // how to alter this from time to time?
    // setting this to 100 is fucking wild and it's good
    .force('charge', forceManyBody().strength(-60))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collision', forceCollide().radius(function(d) {
      return d.radius
    }))
    .on('tick', update)
    .on("end", goRound);


    var svg = select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    // .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create filter ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  //SVG filter for the gooey effect
  //Code taken from http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
  var defs = svg.append("defs");
  var filter = defs.append("filter").attr("id","gooeyCodeFilter");
  filter.append("feGaussianBlur")
  .attr("in","SourceGraphic")
  .attr("stdDeviation","10")
  //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
  .attr("color-interpolation-filters","sRGB")
  .attr("result","blur");
  filter.append("feColorMatrix")
  .attr("in","blur")
  .attr("mode","matrix")
  .attr("values","1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7")
  .attr("result","gooey");
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
  //Create scale
  // scales are for mapping, eg calc positions based on data
  var xScale = scaleLinear()
  .domain([-1.25, 1.25])
  .range([-width/2, width/2]);


  var circleWrapper = svg.append("g")
  .attr("class", "circleWrapper")
  .style("filter", "url(#gooeyCodeFilter)");

    //Create the circles that will move out and in the center circle
  var steps = 20;
    // var colors = ["#F95B34", "#EE3E64", "#F36283", "#FF9C34", "#EBDE52", "#B7D84B", "#44ACCF"];
    // temporary pastel scheme
  var colors = [ "#fce9f1"," #FEC8D8", "#FFDFD3", "#e9fcf4", "#feece8", "#e8fafe", "#ece8fe",  "#efbbcf",  "#ffd5cd", "#FFCCDD", "#FFFFCC", "#FFDDCC", "#CCDDEE", "#FFCCCC", "#CCDDCC", "#CCFFCC", "#FFEEFF", "#CCCCFF", "#CAEEFE", "#FFFCE7", "E1FFD4", "#FCE1F8", "DACBFE" ];

  var flyCircleData = [];
  for (var i = 0; i < steps; i++) {
    flyCircleData.push({
      fixedAngle: (i/steps)*(2*Math.PI),
      randomAngle: (i/steps)*(2*Math.PI),
      speed: Math.random() * 7000 + 3000,
      r: Math.floor(Math.random() * 50 + 15),
      color: colors[i%colors.length]
    })
  }//for i

  //Set up the circles
  var flyCircles = circleWrapper.selectAll(".flyCircle")
  .data(flyCircleData)
  .enter().append("circle")
  .attr("class", "flyCircle")
  .style("fill", function(d) { return d.color; })
  .attr("cy", 0)
  .attr("cx", 0)
  .attr("r", 0)
  .call(enter => enter.transition().duration(1500).delay(function(d,i) { return i*500; }))
  .attr("cy", function(d) { return xScale(Math.sin(d.fixedAngle)); })
  .attr("cx", function(d) { return xScale(Math.cos(d.fixedAngle)); })
  .attr("r", function(d) { return d.r; })
  .attr("transform", function(d,i) {
    var radius = spacing * Math.sqrt(i),
    angle = i *  theta;
    return "translate(" + (radius * Math.cos(angle)) + "," + (radius * Math.sin(angle)) + ")"
  })
  .on("end", goRound);

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Functions /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function collide(node) {
    var r = node.radius + 16,
    nx1 = node.x - r,
    nx2 = node.x + r,
    ny1 = node.y - r,
    ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
        y = node.y - quad.point.y,
        l = Math.sqrt(x * x + y * y),
        r = node.radius + quad.point.radius;
        if (l < r) {
          l = (l - r) / l * .5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  }
  //Continuously moves the circles with different speeds
  // can't get this to work lol
  function goRound() {
  var u = select('svg')
    .selectAll('circle')
    .data(nodes)
    // u.enter()
    .transition()
    .duration(4000)
    .ease(easeLinear)
    .attrTween("transform", function() { return interpolateString("rotate(0)", "rotate(360)"); })
    .on("end", goRound);
  }//function goRound

// function repeat() {
//  .transition()
//  .duration(4000)
//  .ease(easeCircle)
//  .attr('cx',function(d) {
//      return d.x + 2
//    })
//  .on("end", repeat);
// }

  // joins the nodes array to circle elements and updates their positions
  function update() {
    // preparing for the join
    var u = select('svg')
    .selectAll('circle')
    .data(nodes)
    // .data(flyCircleData)
    //selects all circles in nodes
    u.enter()
    //adds circle element to dom
    .append('circle')
    // this creates the phylloaxis grid bc all the hidden circles now have a radius of 5
    // there's 2 datasets here right now
    // .attr('r', 5)
    // merges selected data + new selected data
    .merge(u)
    .attr('cx', function(d) {
      return d.x
    })
    .attr('cy', function(d) {
      return d.y
    })

    u.exit().remove()
    // goRound(u)
  }
