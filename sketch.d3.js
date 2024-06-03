// Global physical parameters
const numOrbs = 5;
const links = [
  //   [0, 1],
  //   [1, 2],
  //   [2, 3],
  //   [3, 4],
].map((link) => ({ source: link[0], target: link[1] }));
let gravityCenter; // Dynamic center based on window size
const chargeStrength = 80;
const linkDistance = 100;
const collisionRadius = 30;

let orbs = [];
let simulation;

function setup() {
  createCanvas(windowWidth, windowHeight);
  gravityCenter = { x: width / 2, y: height / 2 }; // Update center based on window size

  // Initialize orbs
  for (let i = 0; i < numOrbs; i++) {
    orbs.push({ x: random(width), y: random(height) });
  }

  // Set up D3 simulation
  simulation = d3
    .forceSimulation(orbs)
    .force("center", d3.forceCenter(gravityCenter.x, gravityCenter.y))
    .force("charge", d3.forceManyBody().strength(chargeStrength))
    .force("collision", d3.forceCollide().radius(collisionRadius))
    .force(
      "link",
      d3
        .forceLink()
        .id((d, i) => i)
        .distance(linkDistance)
    )
    .on("tick", ticked);

  simulation.force("link").links(links);

  // Prevent simulation from freezing by continuously reheating
  simulation.alphaTarget(0.3).restart();
}

function draw() {
  background(255, 100, 50); // Background color similar to your image
  fill(255);
  stroke(0);

  // Draw orbs based on D3's force simulation calculations
  for (let orb of orbs) {
    ellipse(orb.x, orb.y, 2 * collisionRadius);
  }
}

function ticked() {
  // D3 handles physics calculations and updates positions
}

function mouseDragged() {
  // Allow the user to interact by dragging orbs
  orbs.forEach((orb) => {
    let d = dist(mouseX, mouseY, orb.x, orb.y);
    if (d < collisionRadius) {
      orb.fx = mouseX;
      orb.fy = mouseY;
    }
  });
}

function mouseReleased() {
  // When the mouse is released, orbs should stop being fixed
  orbs.forEach((orb) => {
    orb.fx = null;
    orb.fy = null;
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  gravityCenter = { x: width / 2, y: height / 2 }; // Update gravity center
  simulation.force("center", d3.forceCenter(gravityCenter.x, gravityCenter.y)); // Update D3 center force
}