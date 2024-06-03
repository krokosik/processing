let orbs = [];
let numOrbs = 5;
let spring = 0.02; // Reduced spring strength
let gravity = 0.03;
let friction = 0.9;
let viscosityCoefficient = 0.01; // Added viscosity
let brownianMotionRange = 1; // Added Brownian motion

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < numOrbs; i++) {
    orbs[i] = new Orb(random(width / 2), random(height / 2), 30, i, orbs);
  }
}

function draw() {
  background(255, 100, 50); // Orangish background similar to your uploaded image
  for (let i = 0; i < numOrbs - 1; i++) {
    line(orbs[i].x, orbs[i].y, orbs[i + 1].x, orbs[i + 1].y);
  }

  orbs.forEach((orb) => {
    orb.collide();
    orb.move();
    orb.display();
  });
}

function mousePressed() {
  orbs.forEach((orb) => {
    orb.pressed();
  });
}

function mouseDragged() {
  orbs.forEach((orb) => {
    if (orb.isDragging) {
      orb.x = mouseX;
      orb.y = mouseY;
    }
  });
}

function mouseReleased() {
  orbs.forEach((orb) => {
    orb.released();
  });
}

class Orb {
  constructor(x, y, diameter, id, orbs) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.diameter = diameter;
    this.id = id;
    this.orbs = orbs;
    this.isDragging = false;
  }

  move() {
    if (!this.isDragging) {
      let centerAttractionX = (width / 2 - this.x) * gravity;
      let centerAttractionY = (height / 2 - this.y) * gravity;
      this.vx += centerAttractionX;
      this.vy += centerAttractionY;

      // Brownian motion component
      let brownianMotionX = random(-brownianMotionRange, brownianMotionRange);
      let brownianMotionY = random(-brownianMotionRange, brownianMotionRange);

      this.vx += brownianMotionX;
      this.vy += brownianMotionY;

      // Apply viscosity
      let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
      let dragMagnitude = speed * speed * viscosityCoefficient;
      let dragX = (dragMagnitude * this.vx) / speed;
      let dragY = (dragMagnitude * this.vy) / speed;

      this.vx -= dragX;
      this.vy -= dragY;

      this.vx *= friction;
      this.vy *= friction;
      this.x += this.vx;
      this.y += this.vy;

      if (this.id > 0) {
        let prevOrb = this.orbs[this.id - 1];
        this.spring(prevOrb);
      }

      // Wrapping Logic
      this.x = (this.x + width) % width;
      this.y = (this.y + height) % height;
    }
  }

  spring(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distance = sqrt(dx * dx + dy * dy);
    let stretch = distance - this.diameter;
    let forceX = (dx / distance) * stretch * spring;
    let forceY = (dy / distance) * stretch * spring;

    this.vx += forceX;
    this.vy += forceY;
  }

  display() {
    stroke(0);
    fill(255, 204); // Semi-transparent
    ellipse(this.x, this.y, this.diameter, this.diameter);
  }

  collide() {
    for (let i = this.id + 1; i < numOrbs; i++) {
      let other = this.orbs[i];
      let dx = other.x - this.x;
      let dy = other.y - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      let minDist = this.diameter + other.diameter;
      if (distance < minDist) {
        let angle = atan2(dy, dx);
        let targetX = this.x + cos(angle) * minDist;
        let targetY = this.y + sin(angle) * minDist;
        let ax = (targetX - other.x) * spring;
        let ay = (targetY - other.y) * spring;
        this.vx -= ax;
        this.vy -= ay;
        other.vx += ax;
        other.vy += ay;
      }
    }
  }

  pressed() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < this.diameter / 2) {
      this.isDragging = true;
      this.vx = 0;
      this.vy = 0;
    }
  }

  released() {
    this.isDragging = false;
  }
}
