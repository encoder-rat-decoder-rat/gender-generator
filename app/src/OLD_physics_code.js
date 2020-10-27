// eslint-disable

var spacing = 30;
var theta = Math.PI / 3;

// forceSimulation(baseCategories)
//   // .force('charge', forceManyBody().strength(-20))
//   // .force('charge', forceManyBody().strength(function(d, i) { return i ? 0 : -2000; }))
//   // gravity: how they overlap i think / forceManyBody

//   // forceManyBody: negative flies apart, positive sticks together
//   // how to alter this from time to time?
//   // setting this to 100 is fucking wild and it's good
//   .force("charge", forceManyBody().strength(-60))
//   .force("center", forceCenter(width / 2, height / 2))
//   .force(
//     "collision",
//     forceCollide().radius(function (d) {
//       return d.radius;
//     })
//   )
//   // .on("tick", updateData)
//   // .on("end", goRound);
// .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create circles //////////////////////////////
///////////////////////////////////////////////////////////////////////////
//Create scale
// scales are for mapping, eg calc positions based on data
// var xScale = scaleLinear()
//   .domain([-1.25, 1.25])
//   .range([-width / 2, width / 2]);

// var flyCircleData = [];
// for (var i = 0; i < steps; i++) {
//   flyCircleData.push({
//     fixedAngle: (i / steps) * (2 * Math.PI),
//     randomAngle: (i / steps) * (2 * Math.PI),
//     speed: Math.random() * 7000 + 3000,
//     r: Math.floor(Math.random() * 50 + 15),
//     color: colors[i % colors.length],
//   });
// }

//Set up the circles
// circleWrapper
//   .selectAll(".flyCircle")
//   .data(flyCircleData)
//   .enter()
//   .append("circle")
//   .attr("class", "flyCircle")
//   .style("fill", function (d) {
//     return d.color;
//   })
//   .attr("cy", 0)
//   .attr("cx", 0)
//   .attr("r", 0)
//   .call((enter) =>
//     enter
//       .transition()
//       .duration(1500)
//       .delay(function (d, i) {
//         return i * 500;
//       })
//   )
//   .attr("cy", function (d) {
//     return xScale(Math.sin(d.fixedAngle));
//   })
//   .attr("cx", function (d) {
//     return xScale(Math.cos(d.fixedAngle));
//   })
//   .attr("r", function (d) {
//     return d.r;
//   })
//   .attr("transform", function (d, i) {
//     var radius = spacing * Math.sqrt(i),
//       angle = i * theta;
//     return (
//       "translate(" +
//       radius * Math.cos(angle) +
//       "," +
//       radius * Math.sin(angle) +
//       ")"
//     );
//   })
//   .on("end", goRound);

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Functions /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line no-unused-vars
function collide(node) {
  var r = node.radius + 16,
    nx1 = node.x - r,
    nx2 = node.x + r,
    ny1 = node.y - r,
    ny2 = node.y + r;
  return function (quad, x1, y1, x2, y2) {
    if (quad.point && quad.point !== node) {
      var x = node.x - quad.point.x,
        y = node.y - quad.point.y,
        l = Math.sqrt(x * x + y * y),
        r = node.radius + quad.point.radius;
      if (l < r) {
        l = ((l - r) / l) * 0.5;
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
  const nodes = serializeCategories();

  select("svg")
    .selectAll("circle")
    .data(nodes)
    // u.enter()
    .transition()
    .duration(4000)
    .ease(easeLinear)
    .attrTween("transform", function () {
      return interpolateString("rotate(0)", "rotate(360)");
    })
    .on("end", goRound);
}

// function repeat() {
//  .transition()
//  .duration(4000)
//  .ease(easeCircle)
//  .attr('cx',function(d) {
//      return d.x + 2
//    })
//  .on("end", repeat);
// }
