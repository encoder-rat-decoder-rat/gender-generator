import "./index.css";

import {
  Application,
  Graphics,
  filters,
  Ticker,
  settings,
  utils,
} from "pixi.js";
import * as PIXI from "pixi.js";

import { DotFilter } from "@pixi/filter-dot";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";

import {
  baseCategories,
  serializeCategories,
  addNewCategory,
} from "./dataStore.js";
import GooeyFilter from "./GooeyFilter.js";

import { downloadAsPNG } from "./downloadFrame.js";

window.PIXI = PIXI;
settings.FILTER_RESOLUTION = 2;

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

const BG_COLOR = 0xadefd1;
const FG_COLOR = 0x00203f;

// Setup the pixi application
const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  antialias: true,
  resizeTo: window,
  backgroundColor: BG_COLOR,
  sharedTicker: true,
  sharedLoader: true,
});
window.app = app;
app.start();
Ticker.shared.start();
// Add it to the body
document.body.appendChild(app.view);

// Add visual filters
const blurFilter = new filters.BlurFilter();
blurFilter.blur = 20;
blurFilter.quality = 10;

const gooeyFilter = new GooeyFilter();

const dotFilter = new DotFilter(1.05, 0);
const colorReplace = new MultiColorReplaceFilter(
  [
    [0xffffff, BG_COLOR],
    [0x000000, FG_COLOR],
  ],
  0.1
);

app.stage.filters = [blurFilter, gooeyFilter, dotFilter, colorReplace];

// Set an interval loop to check if the ?frame query param is added to the url
let currentParams = null;
const checkFrame = () => {
  const newParams = window.location.search;
  if (currentParams !== newParams && newParams.includes("?frame")) {
    downloadAsPNG(document.getElementById("chartWrapper"));
  }
  currentParams = newParams;
};
window.setInterval(checkFrame, 2000);

/**
 * This updates our data and recalls the colorizing function
 */

function updateData() {
  // Fetch our data
  // const nodes = serializeCategories();
  baseCategories.forEach((category, index) => {
    if (!category.pixiObject) {
      const circle = new Graphics();
      circle
        .beginFill(0xffffff * Math.random())
        .drawCircle(0, 0, category.size)
        .endFill();
      circle.position.set(
        window.innerWidth * Math.random(),
        window.innerHeight * Math.random()
      );
      app.stage.addChild(circle);
      category.pixiObject = circle;
      app.stage.getBounds();
    }
  });

  // Update all of the colors
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
function addOne(size = Math.random() * 150 + 50) {
  addNewCategory("", size);
}

// Add a new category every 2.5 seconds up to 10
for (let i = 0; i < 10; i += 1) {
  window.setTimeout(addOne, 5000 * i);
}

var mouseCircle = new PIXI.Graphics();
app.stage.addChild(mouseCircle);

// Listen for animate update
app.ticker.add(function (delta) {
  var mouseposition = app.renderer.plugins.interaction.mouse.global;
  mouseCircle.clear();
  mouseCircle.lineStyle(0);
  mouseCircle.beginFill(0xaaaaaa, 1);
  mouseCircle.drawCircle(mouseposition.x, mouseposition.y, 50);
  mouseCircle.endFill();
});
