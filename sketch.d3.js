// Global physical parameters
const numOrbs = 5;
const links = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
].map((link) => ({ source: link[0], target: link[1] }));
let gravityCenter; // Dynamic center based on window size
const CHARGE_STRENGTH = 0.05;
const LINK_DISTANCE = 10;
const NODE_RADIUS = 30;
const GAS_RADIUS = 3;
const collisionRadius = 50;
const GAS_DENSITY = 0.0005; // particles per sq px
const NUM_DIFFUSERS = 5;
const DIFFUSER_RADIUS = 50;
let TEMP = 10;
let numDustParticales;

let orbs = [];
let simulation;
let draggedOrb;

function setup() {
  createCanvas(windowWidth, windowHeight);
  gravityCenter = { x: width / 2, y: height / 2 }; // Update center based on window size

  // Initialize orbs
  for (let i = 0; i < numOrbs; i++) {
    orbs.push({
      x: random(width),
      y: random(height),
      vx: randomVelocity(TEMP),
      vy: randomVelocity(TEMP),
      r: NODE_RADIUS,
    });
  }

  // Initialize gas
  numDustParticales = GAS_DENSITY * width * height;
  for (let i = 0; i < numDustParticales; i++) {
    orbs.push({
      x: random(width),
      y: random(height),
      vx: randomVelocity(TEMP),
      vy: randomVelocity(TEMP),
      r: GAS_RADIUS,
    });
  }

  // Set up D3 simulation
  simulation = d3
    .forceSimulation(orbs)
    // .force("center", d3.forceCenter(gravityCenter.x, gravityCenter.y))
    .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
    .force(
      "bounce",
      d3.forceBounce().radius((d) => d.r)
    )
    .force(
      "surface",
      d3
        .forceSurface()
        .surfaces([
          { from: { x: 0, y: 0 }, to: { x: width, y: 0 } },
          { from: { x: width, y: 0 }, to: { x: width, y: height } },
          { from: { x: width, y: height }, to: { x: 0, y: height } },
          { from: { x: 0, y: height }, to: { x: 0, y: 0 } },
        ])
        .radius((d) => d.r)
    )
    .alphaDecay(0)
    .velocityDecay(0)
    .force(
      "link",
      d3
        .forceLink()
        .id((d, i) => i)
        .distance(LINK_DISTANCE)
    )
    .on("tick", ticked);

  // simulation.force("link").links(links);

  // Prevent simulation from freezing by continuously reheating
  // simulation.alphaTarget(0.3).restart();
}

function draw() {
  background(0);
  fill(255);
  stroke(0, 0, 0, 0);

  // Draw orbs based on D3's force simulation calculations
  for (let orb of orbs) {
    if (orb.r != GAS_RADIUS) {
      ellipse(orb.x, orb.y, 2 * orb.r);
    }
  }
}

function ticked() {
  // D3 handles physics calculations and updates positions
}

function mousePressed() {
  // Check if the mouse is over an orb
  orbs.forEach((orb) => {
    let d = dist(mouseX, mouseY, orb.x, orb.y);
    if (d < collisionRadius) {
      draggedOrb = orb;
      return;
    }
  });
}

function mouseDragged() {
  // Allow the user to interact by dragging orbs
  if (draggedOrb) {
    draggedOrb.fx = mouseX;
    draggedOrb.fy = mouseY;
  }
}

function mouseReleased() {
  draggedOrb.fx = null; // Stop fixing the orb's position
  draggedOrb.fy = null;
  // When the mouse is released, orbs should stop being fixed
  simulation.alpha(0.3).restart(); // Reheat the simulation
}

function randomVelocity(temp) {
  // The Maxwell-Boltzman velocity distribution where temp is a renormalized temperature temp = kT/m
  return d3.randomNormal(0, Math.sqrt(temp))();
}
