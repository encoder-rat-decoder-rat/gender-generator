import "./index.css";

import {
  Application,
  Container,
  Graphics,
  Loader,
  filters,
  Ticker,
  Spritesheet,
  Sprite,
  settings,
  utils,
} from "pixi.js";
import * as PIXI from "pixi.js";
import { DotFilter } from "@pixi/filter-dot";
import { MultiColorReplaceFilter } from "@pixi/filter-multi-color-replace";

import { UV_COORDS } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/uv_coords.js";
import { MESH_ANNOTATIONS } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints.js";

import seedrandom from "seedrandom";

import GooeyFilter from "./GooeyFilter.js";
import { contrast } from "./utils.js";

import { downloadCanvasAsPNG } from "./downloadFrame.js";
import spritesheetJSON from "./spritesheet.json";

window.PIXI = PIXI;
settings.FILTER_RESOLUTION = 2;

const whiteTextureUrl = `${process.env.PUBLIC_URL}/sprite-sheet-white.png`;
// const blackTextureUrl = `${process.env.PUBLIC_URL}/sprite-sheet-black.png`

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

// Set our random seed based on the "seed" query parameter supplied
const queryParams = new URLSearchParams(window.location.search);
const seed = parseInt(queryParams.get("seed"));
const page = parseInt(queryParams.get("page"));
const seededRandom = seedrandom(seed + page);

// Use the w and h parameters to set a specfic height and width for the canvas (useful for generating and downloading images)
// magic numbers are provided resolution
const width = page ? 2412 : Number(queryParams.get("w")) || window.innerWidth;
const height = page ? 3074 : Number(queryParams.get("h")) || window.innerHeight;

const bgColorArray = [seededRandom(), seededRandom(), seededRandom()];
// Ensure the FG color has at least a contrast ratio of 4.5: 1 for legibility
// https://www.w3.org/TR/WCAG20-TECHS/G18.html
let isContrastRatioAcceptable = false;
let fgColorArray;
while (!isContrastRatioAcceptable) {
  fgColorArray = [seededRandom(), seededRandom(), seededRandom()];

  isContrastRatioAcceptable = contrast(bgColorArray, fgColorArray) >= 4.8;
}

const bgColor = utils.rgb2hex(bgColorArray);
const fgColor = utils.rgb2hex(fgColorArray);

// Setup the pixi application
const app = new Application({
  width,
  height,
  antialias: true,
  backgroundColor: bgColor,
  sharedTicker: true,
  sharedLoader: true,
  // Only resize if a width and height have not been provided
  // resizeTo: !queryParams.get("w") && !queryParams.get("h") ? window : undefined,
});
window.app = app;
app.start();
Ticker.shared.start();
// Add it to the body
document.body.appendChild(app.view);

async function setup() {
  const whiteTexture = Loader.shared.resources[whiteTextureUrl].texture;
  // const blackTexture = Loader.shared.resources[blackTextureUrl].texture

  const whiteSpriteSheet = new Spritesheet(whiteTexture, spritesheetJSON);
  // const blackSpriteSheet = new Spritesheet(blackTexture, spritesheetJSON)

  await Promise.all([
    new Promise((resolve) => {
      whiteSpriteSheet.parse(resolve);
    }),
    // new Promise((resolve) => {blackSpriteSheet.parse(resolve)}),
  ]);

  // Set a container for where all of the objects will be (so we can center and scale it on resize)
  const faceContainer = new Container();
  const iconContainer = new Container();
  app.stage.addChild(faceContainer, iconContainer);
  faceContainer.position.set(app.renderer.width / 2, app.renderer.height / 2);
  iconContainer.position = faceContainer.position;

  // Add visual filters
  const blurFilter = new filters.BlurFilter();
  blurFilter.blur = 30;
  blurFilter.quality = 7;

  const gooeyFilter = new GooeyFilter();

  const dotFilter = new DotFilter(1.05, 0);
  const colorReplace = new MultiColorReplaceFilter(
    [
      [0xffffff, bgColor],
      [0x000000, fgColor],
    ],
    0.1
  );

  faceContainer.filters = [blurFilter, gooeyFilter, dotFilter, colorReplace];
  iconContainer.filters = [colorReplace];

  /**
   * Add a point on the face mesh
   *
   * @param      {Number}  [size=seededRandom()*14+8]  The size
   */
  function createPoint(point, size = 1, color = 0xffffff) {
    // The UV coords are normalized in terms of 0 -> 1 of the container
    const [xRel, yRel] = point;
    const circle = new Graphics()
      .beginFill(0xffffff * seededRandom())
      .drawCircle(0, 0, size)
      .endFill();
    // TODO: reposition on window resize
    circle.position.set(
      xRel * app.renderer.width - app.renderer.width / 2,
      yRel * app.renderer.height - app.renderer.height / 2
    );

    const textureKey =
      whiteSpriteSheet._frameKeys[
        Math.round((whiteSpriteSheet._frameKeys.length - 1) * seededRandom())
      ];
    const iconTexture = whiteSpriteSheet.textures[textureKey];
    const icon = new Sprite(iconTexture);
    icon.anchor.set(0.5, 0.5);
    icon.position.set(circle.x, circle.y);
    icon.scale.set(
      (size * 2 - 20) / Math.min(iconTexture.width, iconTexture.height)
    );

    // Hide icon if the size is smaller than 10 for visual fidelity
    if (size < 10) {
      icon.visible = false;
    }

    return [circle, icon];
  }

  // Add all of the important points
  for (const key in MESH_ANNOTATIONS) {
    if (!key.includes("Iris") && !key.includes("silhouette")) {
      const feature = new Container();
      feature.name = key;
      const featureIcons = new Container();
      featureIcons.name = `${key}_icons`;

      MESH_ANNOTATIONS[key].forEach((pointIndex) => {
        const [circle, icon] = createPoint(
          UV_COORDS[pointIndex],
          seededRandom() * 30
        );
        feature.addChild(circle);
        featureIcons.addChild(icon);
      });

      feature.position.set(25 - seededRandom() * 50, 25 - seededRandom() * 50);
      featureIcons.position = feature.position;

      feature.scale.set(
        1 + (0.2 - seededRandom() * 0.6),
        1 + (0.2 - seededRandom() * 0.6)
      );
      featureIcons.scale = feature.scale;

      feature.rotation = Math.PI / 8 - (seededRandom() * Math.PI) / 4;
      featureIcons.rotation = feature.rotation;

      faceContainer.addChild(feature);
      iconContainer.addChild(featureIcons);
    }
  }

  // Scale up the face so at least one edge is touching the sides
  const containerBounds = faceContainer.getBounds();
  const scale = Math.min(
    1 + (app.renderer.width - containerBounds.width) / containerBounds.width,
    1 + (app.renderer.height - containerBounds.height) / containerBounds.height
  );
  faceContainer.scale.set(scale);
  iconContainer.scale.set(scale);

  app.render();

  // Now that we're loaded we can download if requested
  if (page && seed) {
    downloadCanvasAsPNG(app.view, seed + "_" + page);
  }
}

// load our assets
Loader.shared
  .add(whiteTextureUrl)
  // .add(blackTextureUrl)
  .load(setup);
