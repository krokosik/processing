/// <reference path="node_modules/@types/d3/index.d.ts"/>
/// <reference path="node_modules/@types/p5/index.d.ts"/>
/// <reference path="node_modules/@types/dat.gui/index.d.ts"/>

let params = {
  nodeRadius: undefined,
  linkDistance: undefined,
  gasRadius: undefined,
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
  elementsFolder
    .add(params, "nodeRadius", 1, 100, 1)
    .name("Node Radius")
    .onChange(() => {
      orbs
        .slice(0, params.numOrbs)
        .forEach((orb) => (orb.r = params.nodeRadius));

      simulation.nodes(orbs);
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
  physicsFolder.add(params, "linkDistance", 0, 100, 1).name("Link Distance");
  physicsFolder
    .add(params, "gasRadius", 1, 3 * params.gasRadius, 1)
    .name("Gas Radius")
    .onChange(() => {
      orbs.slice(params.numOrbs).forEach((orb) => (orb.r = params.gasRadius));
      simulation.nodes(orbs);
    });
  physicsFolder
    .add(params, "gasDensity", 0.001, 0.01, 0.0001)
    .name("Gas Density")
    .onChange(() => {
      const numDustParticales = params.gasDensity * width * height;
      if (orbs.length - params.numOrbs > numDustParticales) {
        orbs = orbs.slice(0, params.numOrbs + numDustParticales);
      } else {
        for (let i = orbs.length - params.numOrbs; i < numDustParticales; i++) {
          orbs.push({
            x: random(params.gasRadius, width - params.gasRadius),
            y: random(params.gasRadius, height - params.gasRadius),
            vx: randomVelocity(params.temperature),
            vy: randomVelocity(params.temperature),
            r: params.gasRadius,
          });
        }
      }
      simulation.nodes(orbs);
    });
  physicsFolder
    .add(params, "temperature", 0, 100, 1)
    .name("Temperature")
    .onChange(() => {
      orbs.slice(params.numOrbs).forEach((orb) => {
        orb.vx = randomVelocity(params.temperature);
        orb.vy = randomVelocity(params.temperature);
      });
      simulation.nodes(orbs);
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
  params.nodeRadius = dim / 4 / 2;
  params.gasRadius = Math.max(1, Math.sqrt(params.nodeRadius) / 2);
  params.linkDistance = params.nodeRadius * 2.5;
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
      x: random(params.nodeRadius * 1.1, width - params.nodeRadius * 1.1),
      y: random(params.nodeRadius * 1.1, height - params.nodeRadius * 1.1),
      vx: 0,
      vy: 0,
      r: params.nodeRadius,
    });
  }
  return nodes;
}

function initGas() {
  const gas = [];
  const numDustParticales = params.gasDensity * width * height;
  for (let i = 0; i < numDustParticales; i++) {
    gas.push({
      x: random(params.gasRadius, width - params.gasRadius),
      y: random(params.gasRadius, height - params.gasRadius),
      vx: randomVelocity(params.temperature),
      vy: randomVelocity(params.temperature),
      r: params.gasRadius,
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

  if (params.showGas) {
    for (let orb of orbs.slice(params.numOrbs)) {
      fill(255, 0, 0, 100);
      ellipse(orb.x, orb.y, 2 * orb.r);
    }
  }

  if (params.showLinks) {
    for (let i = 0; i < params.numOrbs; i++) {
      for (let j = i + 1; j < params.numOrbs; j++) {
        const source = createVector(orbs[i].x, orbs[i].y);
        const target = createVector(orbs[j].x, orbs[j].y);
        drawConnection(source, target);
      }
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
    if (d < params.nodeRadius) {
      draggedOrb = orb;
      return;
    }
  });
}

function drawConnection(source, target) {
  const d = p5.Vector.dist(source, target);

  const thickness = Math.max(
    0,
    Math.exp(-Math.pow(d / params.nodeRadius / 2, 2)) * params.nodeRadius
  );

  stroke(colors.fill);
  strokeWeight(thickness);
  line(source.x, source.y, target.x, target.y);
  return;

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

  const p1 = p5.Vector.add(
    source,
    p5.Vector.fromAngle(angle1, params.nodeRadius)
  );
  const p2 = p5.Vector.add(
    source,
    p5.Vector.fromAngle(angle2, params.nodeRadius)
  );

  const p3 = p5.Vector.add(
    target,
    p5.Vector.fromAngle(angle3, params.nodeRadius)
  );
  const p4 = p5.Vector.add(
    target,
    p5.Vector.fromAngle(angle4, params.nodeRadius)
  );

  const d2Base = Math.min(
    params.handleSize / 2,
    (p5.Vector.dist(p1, p3) / 2) * params.nodeRadius
  );
  const d2 = d2Base * Math.min(1, d / params.nodeRadius);
  const handle = d2 * params.nodeRadius;

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
      params.nodeRadius,
      Math.min(mouseX, width - params.nodeRadius)
    );
    draggedOrb.fy = Math.max(
      params.nodeRadius,
      Math.min(mouseY, height - params.nodeRadius)
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
