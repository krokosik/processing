/// <reference path="node_modules/@types/d3/index.d.ts"/>
/// <reference path="node_modules/@types/p5/index.d.ts"/>
/// <reference path="node_modules/@types/dat.gui/index.d.ts"/>

// Global physical parameters
let links = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
].map((link) => ({ source: link[0], target: link[1] }));

let NODE_RADIUS; // dynamic radius based on window size
let LINK_DISTANCE; // dynamic distance based on node radius
let GAS_RADIUS;
const GAS_DENSITY = 0.001; // particles per sq px
const MAX_LINK_SPREAD = Math.PI / 2;
const SPREAD_SCALING_FACTOR = 0.5;
const HANDLE_SIZE = 2;
const SHOW_GAS = false;
let CONNECT_DISTANCE;
let DISCONNECT_DISTANCE;
let numDustParticales;

let params = {
  numOrbs: 5,
  chargeStrength: 0,
  gasDensity: 0.001,
  maxLinkSpread: Math.PI / 2,
  spreadScalingFactor: 0.5,
  handleSize: 2,
  temperature: 10,
  showLinks: true,
  showNodes: true,
  showGas: false,
};

const colors = {
  background: [0, 0, 0],
  fill: [255, 255, 255],
  gas: [255, 0, 0, 0.3],
};

const gui = new dat.GUI({ name: "NVLV Logo" });

let orbs = [];
let simulation;
let draggedOrb;

function initGui() {
  const elementsFolder = gui.addFolder("Elements");
  elementsFolder
    .add(params, "numOrbs", 1, 5, 1)
    .name("Orbs")
    .onChange(() => {
      reinitNodes();
    });
  elementsFolder.add(params, "showNodes").name("Show Nodes");
  elementsFolder.add(params, "showLinks").name("Show Links");
  elementsFolder.add(params, "showGas").name("Show Gas");
  elementsFolder.addColor(colors, "background").name("Background");
  elementsFolder.addColor(colors, "fill").name("Fill");
  elementsFolder.addColor(colors, "gas").name("Gas");
  elementsFolder.close();

  const physicsFolder = gui.addFolder("Physics");
  physicsFolder
    .add(params, "chargeStrength", 0, 1, 0.01)
    .name("Charge Strength (BROKEN)");
  // .onChange((value) => simulation.force("charge").strength(value));
  physicsFolder
    .add(params, "gasDensity", 0.001, 0.01, 0.0001)
    .name("Gas Density")
    .onChange(() => {
      reinitGas();
    });
  physicsFolder
    .add(params, "temperature", 0, 100, 1)
    .name("Temperature")
    .onChange(() => {
      reinitGas();
    });
  physicsFolder.close();

  const linksFolder = gui.addFolder("Links");
  linksFolder
    .add(params, "maxLinkSpread", 0, Math.PI, 0.01)
    .name("Max Link Spread");
  linksFolder.add(params, "spreadScalingFactor", 0, 1, 0.01).name("Spread");
  linksFolder.add(params, "handleSize", 0, 10, 0.1).name("Handle Size");
  linksFolder.open();
}

function setup() {
  const dim = Math.min(windowWidth, windowHeight);
  NODE_RADIUS = dim / 4 / 2;
  GAS_RADIUS = Math.max(1, Math.sqrt(NODE_RADIUS) / 2);
  LINK_DISTANCE = NODE_RADIUS * 2.5;
  CONNECT_DISTANCE = 2 * NODE_RADIUS * 1.5;
  DISCONNECT_DISTANCE = 2 * NODE_RADIUS * 2.5;
  createCanvas();

  // Initialize orbs
  initGui();
  initOrbs();

  // Set up D3 simulation
  simulation = d3
    .forceSimulation(orbs)
    // .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
    .alphaDecay(0)
    .velocityDecay(0)
    // .force(
    //   "link",
    //   d3
    //     .forceLink()
    //     .id((d, i) => i)
    //     .distance(LINK_DISTANCE)
    //     .strength(LINK_STRENGTH)
    // )
    .force(
      "bounce",
      d3.forceBounce().radius((d) => d.r)
    )
    .force(
      "surface",
      d3
        .forceSurface()
        .surfaces([
          { from: { x: width, y: 0 }, to: { x: 0, y: 0 } },
          { from: { x: width, y: height }, to: { x: width, y: 0 } },
          { from: { x: 0, y: height }, to: { x: width, y: height } },
          { from: { x: 0, y: 0 }, to: { x: 0, y: height } },
        ])
        .oneWay(true)
        .radius((d) => d.r)
    )
    .on("tick", ticked);

  // simulation.force("link").links(links);
}

function initOrbs() {
  orbs = initNodes().concat(initGas());
}

function reinitGas() {
  orbs = orbs.slice(0, params.numOrbs).concat(initGas());
  simulation.nodes(orbs);
}

function reinitNodes() {
  orbs = initNodes().concat(orbs.slice(params.numOrbs));
  simulation.nodes(orbs);
}

function initNodes() {
  const nodes = [];

  for (let i = 0; i < params.numOrbs; i++) {
    nodes.push({
      x: random(NODE_RADIUS * 1.1, width - NODE_RADIUS * 1.1),
      y: random(NODE_RADIUS * 1.1, height - NODE_RADIUS * 1.1),
      vx: 0,
      vy: 0,
      r: NODE_RADIUS,
    });
  }
  return nodes;
}

function initGas() {
  const gas = [];
  numDustParticales = params.gasDensity * width * height;
  for (let i = 0; i < numDustParticales; i++) {
    gas.push({
      x: random(GAS_RADIUS, width - GAS_RADIUS),
      y: random(GAS_RADIUS, height - GAS_RADIUS),
      vx: randomVelocity(params.temperature),
      vy: randomVelocity(params.temperature),
      r: GAS_RADIUS,
    });
  }
  return gas;
}

function draw() {
  background(...colors.background);
  fill(...colors.fill);
  strokeWeight(0);

  // Draw orbs based on D3's force simulation calculations
  if (params.showNodes) {
    for (let orb of orbs.slice(0, params.numOrbs)) {
      ellipse(orb.x, orb.y, 2 * orb.r);
    }
  }

  if (params.showLinks) {
    for (let link of links) {
      const source = createVector(orbs[link.source].x, orbs[link.source].y);
      const target = createVector(orbs[link.target].x, orbs[link.target].y);
      drawConnection(source, target);
    }
  }

  if (params.showGas) {
    for (let orb of orbs.slice(params.numOrbs)) {
      fill(255, 0, 0, 100);
      ellipse(orb.x, orb.y, 2 * orb.r);
    }
  }
}

function ticked() {
  // D3 handles physics calculations and updates positions
}

function mousePressed() {
  // Check if the mouse is over an orb
  orbs.slice(0, params.numOrbs).forEach((orb) => {
    let d = dist(mouseX, mouseY, orb.x, orb.y);
    if (d < NODE_RADIUS) {
      draggedOrb = orb;
      return;
    }
  });
}

function drawConnection(source, target) {
  const d = p5.Vector.dist(source, target);

  const angleBetween = Math.atan2(target.y - source.y, target.x - source.x);

  const angle1 =
    angleBetween + params.maxLinkSpread * params.spreadScalingFactor;
  const angle2 =
    angleBetween - params.maxLinkSpread * params.spreadScalingFactor;

  const angle3 =
    angleBetween +
    PI -
    (PI - params.maxLinkSpread) * params.spreadScalingFactor;
  const angle4 =
    angleBetween -
    PI +
    (PI - params.maxLinkSpread) * params.spreadScalingFactor;

  const p1 = p5.Vector.add(source, p5.Vector.fromAngle(angle1, NODE_RADIUS));
  const p2 = p5.Vector.add(source, p5.Vector.fromAngle(angle2, NODE_RADIUS));

  const p3 = p5.Vector.add(target, p5.Vector.fromAngle(angle3, NODE_RADIUS));
  const p4 = p5.Vector.add(target, p5.Vector.fromAngle(angle4, NODE_RADIUS));

  const d2Base = Math.min(
    params.handleSize / 2,
    (p5.Vector.dist(p1, p3) / 2) * NODE_RADIUS
  );
  const d2 = d2Base * Math.min(1, d / NODE_RADIUS);
  const handle = d2 * NODE_RADIUS;

  const h1 = p5.Vector.add(p1, p5.Vector.fromAngle(angle1 - PI / 2, handle));
  const h2 = p5.Vector.add(p2, p5.Vector.fromAngle(angle2 + PI / 2, handle));
  const h3 = p5.Vector.add(p3, p5.Vector.fromAngle(angle3 + PI / 2, handle));
  const h4 = p5.Vector.add(p4, p5.Vector.fromAngle(angle4 - PI / 2, handle));

  beginShape();
  vertex(p1.x, p1.y);
  bezierVertex(h1.x, h1.y, h3.x, h3.y, p3.x, p3.y);
  vertex(p4.x, p4.y);
  bezierVertex(h4.x, h4.y, h2.x, h2.y, p2.x, p2.y);
  endShape();
}

function mouseDragged() {
  // Allow the user to interact by dragging orbs
  if (draggedOrb) {
    draggedOrb.fx = Math.max(
      NODE_RADIUS,
      Math.min(mouseX, width - NODE_RADIUS)
    );
    draggedOrb.fy = Math.max(
      NODE_RADIUS,
      Math.min(mouseY, height - NODE_RADIUS)
    );
  }
}

function mouseReleased() {
  draggedOrb.fx = null; // Stop fixing the orb's position
  draggedOrb.fy = null;
  draggedOrb = null;
  // When the mouse is released, orbs should stop being fixed
}

function randomVelocity(temp) {
  // The Maxwell-Boltzman velocity distribution where temp is a renormalized temperature temp = kT/m
  return d3.randomNormal(0, Math.sqrt(temp))();
}
