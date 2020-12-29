import { Container, Graphics, Sprite } from "pixi.js";
import { UV_COORDS } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/uv_coords.js";
import { MESH_ANNOTATIONS } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints.js";
const faceLandmarksDetection = require("@tensorflow-models/face-landmarks-detection");

/**
 * Gets the size from out tensor flow bounding box
 *
 * @param {Object} boundingBox
 * @param {Number} boundingBox.topLeft The top left coordinate of the container
 * @param {Number} boundingBox.bottomRight The bottom right coordinate of the container
 */
export function getSizeFromBoundingBox({ topLeft, bottomRight }) {
  return {
    width: bottomRight[0] - topLeft[0],
    height: bottomRight[1] - topLeft[1],
  };
}

/**
 * The UV coords are normalized in terms of 0 -> 1 of the container
 * Convert the relative values to pixels in the container
 *
 * @param {Array} point
 * @param {Number} point[0] The x value of the point
 * @param {Number} point[1] The y value of the point
 * @param {Array} containerSize
 * @param {Number} containerSize[0] The width value of the container
 * @param {Number} containerSize[1] The height value of the container
 */
function convertUVToContainer([x, y], [width, height]) {
  return [x * width, y * height];
}

/**
 * Converts the tensor flow mesh to a relative (0->1) position
 *
 * @param {Array} point
 * @param {Number} point[0] The x value of the point
 * @param {Number} point[1] The y value of the point
 * @param {Object} boundingBox
 * @param {Number} boundingBox.topLeft The top left coordinate of the container
 * @param {Number} boundingBox.bottomRight The bottom right coordinate of the container
 */
function convertMeshToRelative([x, y], boundingBox) {
  const { width, height } = getSizeFromBoundingBox(boundingBox);
  return [
    (x - boundingBox.topLeft[0]) / width,
    (y - boundingBox.topLeft[1]) / height,
  ];
}

function getContainerSize(app, prediction) {
  let container = [];
  if (prediction) {
    const { width, height } = getSizeFromBoundingBox(prediction.boundingBox);
    const scale = Math.max(
      app.renderer.width / width,
      app.renderer.height / height
    );
    container = [width * scale, height * scale];
  } else {
    container = [app.renderer.width, app.renderer.height];
  }

  return container;
}

function getCirclePosition(point, prediction, container) {
  // If the point is an array it's xyz coords, otherwise it's an index reference to UV_COORDS
  let relativeCoords = [];
  if (prediction) {
    relativeCoords = convertMeshToRelative(
      prediction.scaledMesh[point],
      prediction.boundingBox
    );
  } else {
    relativeCoords = UV_COORDS[point];
  }
  return convertUVToContainer(relativeCoords, container);
}

/**
 * Add a point on the face mesh
 *
 * @param      {Number}  [size=seededRandom()*14+8]  The size
 */
export function createPoint(point, spritesheet, seededRandom) {
  const size = seededRandom() * 30;
  const circle = new Graphics()
    .beginFill(0xffffff * seededRandom())
    .drawCircle(0, 0, size)
    .endFill();
  // TODO: reposition on window resize
  circle.position.set(...point);

  const textureKey =
    spritesheet._frameKeys[
      Math.round((spritesheet._frameKeys.length - 1) * seededRandom())
    ];
  const iconTexture = spritesheet.textures[textureKey];
  const icon = new Sprite(iconTexture);
  icon.anchor.set(0.5, 0.5);
  icon.position.set(circle.x, circle.y);
  icon.finalScale =
    (size * 2 - 20) / Math.min(iconTexture.width, iconTexture.height);
  icon.scale.set(icon.finalScale);

  // Hide icon if the size is smaller than 10 for visual fidelity
  if (size < 10) {
    icon.visible = false;
  }

  // Store the circle so we can reference it in the animation
  icon.circle = circle;
  circle.icon = icon;

  return [circle, icon];
}

export function redrawFace({
  app,
  faceContainer,
  featureContainer,
  prediction,
}) {
  const container = getContainerSize(app, prediction);

  // Center the face in the window, but move it slowly to reduce jitter
  faceContainer.pivot.set(
    faceContainer.pivot.x - (faceContainer.pivot.x - container[0] / 2) * 0.1,
    faceContainer.pivot.y - (faceContainer.pivot.y - container[1] / 2) * 0.1
  );
  faceContainer.position.set(
    faceContainer.position.x -
      (faceContainer.position.x - app.renderer.width / 2) * 0.1,
    faceContainer.position.y -
      (faceContainer.position.y - app.renderer.height / 2) * 0.1
  );

  for (const key in MESH_ANNOTATIONS) {
    const feature = featureContainer.getChildByName(key);
    if ((prediction && key.includes("Iris")) || !key.includes("silhouette")) {
      MESH_ANNOTATIONS[key].forEach((point, pointIndex) => {
        const featurePoint = feature.getChildAt(pointIndex);

        const position = getCirclePosition(point, prediction, container);

        // Move slowly to the point to reduce jitter
        featurePoint.position.set(
          featurePoint.position.x -
            (featurePoint.position.x - position[0]) * 0.1,
          featurePoint.position.y -
            (featurePoint.position.y - position[1]) * 0.1
        );
        featurePoint.icon.position.set(featurePoint.x, featurePoint.y);
      });
    }
  }

  const { width, height } = faceContainer.getLocalBounds();
  // Set the scale so at least some of the edges touch the sides
  const scale =
    Math.min(app.renderer.width / width, app.renderer.height / height) * 1.05;
  // Scale it slowly to reduce jitter
  faceContainer.scale.set(
    faceContainer.scale.x - (faceContainer.scale.x - scale) * 0.1
  );
}

export function drawFace({
  app,
  seededRandom,
  spritesheet,
  faceContainer,
  featureContainer,
  iconContainer,
  prediction,
}) {
  const container = getContainerSize(app, prediction);

  // Center the face in the window
  faceContainer.pivot.set(container[0] / 2, container[1] / 2);
  faceContainer.position.set(app.renderer.width / 2, app.renderer.height / 2);

  // Add all of the important points
  for (const key in MESH_ANNOTATIONS) {
    if ((prediction && key.includes("Iris")) || !key.includes("silhouette")) {
      const feature = new Container();
      feature.name = key;
      const featureIcons = new Container();
      featureIcons.name = `${key}_icons`;

      MESH_ANNOTATIONS[key].forEach((point, pointIndex) => {
        const circlePosition = getCirclePosition(point, prediction, container);
        const [circle, icon] = createPoint(
          circlePosition,
          spritesheet,
          seededRandom
        );
        circle.name = pointIndex;
        icon.name = pointIndex;
        feature.addChild(circle);
        featureIcons.addChild(icon);
      });

      featureIcons.position = feature.position;
      featureIcons.pivot = feature.pivot;
      featureIcons.scale = feature.scale;
      featureIcons.rotation = feature.rotation;

      featureContainer.addChild(feature);
      iconContainer.addChild(featureIcons);
    }
  }

  const { width, height } = faceContainer.getLocalBounds();
  // Set the scale so at least some of the edges touch the sides
  const scale =
    Math.min(app.renderer.width / width, app.renderer.height / height) * 1.05;
  // Scale it slowly to reduce jitter
  faceContainer.scale.set(scale);
}

export async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    const video = document.createElement("video");
    // TODO: Reject on timeout
    await new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", async () => {
        await video.play();
        resolve();
      });
      video.srcObject = stream;
    });

    return video;
  } catch (error) {
    console.error("Cannot access a webcam: ", error);
  }
  return null;
}

let modelSingleton = null;
export async function getFaceFromMedia(video) {
  if (!modelSingleton) {
    modelSingleton = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
  }

  return modelSingleton.estimateFaces({
    input: video,
    predictIrises: true,
  });
}
