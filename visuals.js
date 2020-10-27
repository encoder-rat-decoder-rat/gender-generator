import { selectAll } from "d3";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create filter ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

export function createGooeyFilter(svg) {
  //SVG filter for the gooey effect
  //Code taken from http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
  var defs = svg.append("defs");
  var filter = defs.append("filter").attr("id", "gooeyCodeFilter");
  filter
    .append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", "5")
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
}

// temporary pastel scheme
export const COLORS = [
  "#FEC8D8", // rose
  "#FFCCCC", // rose
  "#efbbcf", // rose
  "#fce9f1", // peach
  "#ffd5cd", // peach
  "#FFDDCC", // peach
  "#FFFFCC", // pale yellow
  "#FFFCE7", // pale yellow
  "#E1FFD4", // yellow green
  "#F1FDCD", // pale chartreuse
  "#CCFFCC", // mint green
  "#cdfddd", // teal
  "#e9fcf4", // green mint
  "#e8fafe", // blue mint
  "#CCDDEE", // smoke blue
  "#CAEEFE", // bland blue
  "#CCCCFF", // blue violet
  "#DACBFE", // purple
  "#E0BBE4", // violet
  "#D291BC", // raspberry
  "#ece8fe", // lavender
  "#FEC8D8", // rose
  "#FFCCDD", // rose
  "#ffeeff", // dusty pink
  "#feece8", // pale pink
  "#FCE1F8", // pink
  "#FFDFD3", // peache
  "#FFDFD3", // peach
];

export function colorCircles(wrapper) {
  selectAll(".venn-circle path")
    .style("fill-opacity", 0.5)
    .style("fill", function (d, i) {
      return COLORS[i];
    });

  // Hide those labels, for now
  selectAll(".venn-circle .label").style("display", "none");
}
