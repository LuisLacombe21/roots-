let tSize = 300; 
let tposX, tposY; 
let pointCount = 1; 
let speed = 10, comebackSpeed = 10, dia = 1; 
let randomPos = true; 
let interactionDirection = -5; 

let textPoints = [];
let rootParticles = [];  // Partículas de las raíces
let words = ["normal", "is", "Bored"];
let currentWordIndex = 0;
let colors = ['#ff5733', '#33ff57', '#3357ff', '#f0e130'];
let shapes = ['circle', 'square', 'triangle']; 
let font, soundEffect;

let roots = []; // Para las raíces adicionales
let exploding = false; // Flag para controlar la explosión de la palabra
let explosionTime = 0; // Tiempo de explosión

function preload() {
  font = loadFont("AvenirNextLTPro-Demi.otf");
  soundEffect = loadSound("click.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  
  // Centramos el texto
  updateTextPosition();
  createTextPoints();
  
  // Genera múltiples raíces
  for (let i = 0; i < 200; i++) {
    let x = random(width);
    let y = random(height / 1); // Inicia en la parte superior de la pantalla
    roots.push(new Root(x, y));
  }
}

function draw() {
  background(10);

  // Mostrar las partículas de texto
  textPoints.forEach(point => {
    point.update();
    point.show();
    point.behaviors();
  });

  // Mostrar las partículas de raíz de la clase Root (raíz del texto)
  rootParticles.forEach(root => {
    root.update();
    root.show();
  });

  // Mostrar las raíces generadas aleatoriamente
  for (let i = 0; i < roots.length; i++) {
    roots[i].grow();
  }

  // Si estamos en el estado de explosión, actualizamos el temporizador
  if (exploding) {
    explosionTime++;
    if (explosionTime > 60) {  // Duración de la explosión en cuadros (aproximadamente 1 segundo)
      exploding = false;
      explosionTime = 0;
    }
  }
}

function mousePressed() {
  // Cambiar la palabra actual y reproducir sonido
  currentWordIndex = (currentWordIndex + 1) % words.length;
  createTextPoints();
  
  // Cambiar la forma y color de las partículas
  textPoints.forEach(point => {
    point.setShape(random(shapes), random(colors));
  });
  
  // Crear una nueva raíz que crezca desde el punto de clic
  createRootParticles(mouseX, mouseY);
  
  // Reproducir el sonido de clic
  soundEffect.play();

  // Activar la explosión de la palabra
  exploding = true;
  explosionTime = 0;
  
  // Establecer la nueva palabra y reiniciar las partículas
  createTextPoints();
}

function createTextPoints() {
  textPoints = [];
  let points = font.textToPoints(words[currentWordIndex], tposX, tposY, tSize, { sampleFactor: pointCount });
  points.forEach(pt => {
    textPoints.push(new Interact(pt.x, pt.y));
  });
}

function updateTextPosition() {
  // Centramos el texto en el canvas
  tposX = width / 2;
  tposY = height / 2;
  
  // Adaptamos el tamaño del texto al ancho de la pantalla
  tSize = min(width, height) * 0.2;  // 20% del tamaño de la pantalla
}

function createRootParticles(startX, startY) {
  // Crear partículas para la raíz que crecen desde el punto de clic
  for (let i = 0; i < 5; i++) {
    rootParticles.push(new Root(startX, startY, random(width - 100), height, i * 0.2));
  }
}

class Interact {
  constructor(x, y) {
    this.pos = randomPos ? createVector(random(width), random(height)) : createVector(x, y);
    this.target = createVector(x, y);
    this.vel = createVector();
    this.acc = createVector();
    this.r = 8;
    this.maxSpeed = speed;
    this.come = comebackSpeed;
    this.dia = dia;
    this.dir = interactionDirection;
    this.color = '#ffffff';
    this.shape = 'circle';
    this.exploded = false; // Nuevo estado de explosión
  }

  behaviors() {
    if (exploding && !this.exploded) {
      this.explode();
    } else {
      this.applyForce(this.arrive(this.target));
      this.applyForce(this.flee(createVector(mouseX, mouseY)));
    }
  }

  applyForce(force) {
    this.acc.add(force);
  }

  arrive(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    desired.setMag(d < this.come ? map(d, 0, this.come, 0, this.maxSpeed) : this.maxSpeed);
    return p5.Vector.sub(desired, this.vel);
  }

  flee(target) {
    let desired = p5.Vector.sub(target, this.pos);
    if (desired.mag() < this.dia) {
      desired.setMag(this.maxSpeed).mult(this.dir);
      return p5.Vector.sub(desired, this.vel).limit(0.1);
    }
    return createVector(0, 0);
  }

  explode() {
    // Cuando se haga clic, la partícula explota hacia afuera
    let angle = random(TWO_PI);
    let force = createVector(cos(angle), sin(angle)).mult(random(3, 6));
    this.vel.add(force);
    this.pos.add(this.vel);
    this.exploded = true; // Marcar como explotada
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  show() {
    fill(this.color);
    noStroke();
    if (this.shape === 'circle') ellipse(this.pos.x, this.pos.y, this.r * .1);
    else if (this.shape === 'square') rect(this.pos.x - this.r, this.pos.y - this.r, this.r * .1, this.r * -.1);
    else if (this.shape === 'triangle') triangle(
      this.pos.x, this.pos.y - this.r, 
      this.pos.x - this.r, this.pos.y + this.r, 
      this.pos.x + this.r, this.pos.y + this.r
    );
  }

  setShape(shape, color) {
    this.shape = shape;
    this.color = color;
  }
}

class Root {
  constructor(startX, startY, targetX, targetY, delay) {
    this.pos = createVector(startX, startY);
    this.target = createVector(targetX, targetY);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 1;  // Velocidad de crecimiento de la raíz
    this.delay = delay;  // Retraso para crear un efecto escalonado
    this.history = [];
  }

  grow() {
    this.history.push(createVector(this.pos.x, this.pos.y));
    let angle = noise(this.pos.x * 0.01, this.pos.y * 0.01) * TWO_PI * 1;
    this.pos.x += cos(angle);
    this.pos.y += sin(angle);

    // Limitar el crecimiento dentro del canvas
    this.pos.x = constrain(this.pos.x, 1, width);
    this.pos.y = constrain(this.pos.y, 1, height);

    // Dibujar la raíz
    noFill();
    stroke(255);  // Cambié el color a blanco
    strokeWeight(1);
    beginShape();
    for (let i = 1; i < this.history.length; i++) {
      vertex(this.history[i].x, this.history[i].y);
    }
    endShape();
  }

  update() {
    // Raíz con línea delgada
    stroke(255);  // Cambié el color a blanco
    strokeWeight(2);  // Líneas más delgadas
    point(this.pos.x, this.pos.y);  // Dibujar un punto donde está la raíz
  }

  show() {
    // Raíz con línea delgada
    stroke(255);  // Cambié el color a blanco
    strokeWeight(2);
    point(this.pos.x, this.pos.y); // Dibujar el punto de la raíz
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateTextPosition();  // Aseguramos que el texto se mantenga centrado
  createTextPoints();    // Actualizamos las partículas con la nueva posición
}

