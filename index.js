const canvas = document.getElementById("canvas1");

// Create an instance of CanvasRenderingContext2D
// That is a built in object that contains all methods used for drawing
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

(ctx.lineWidth = 2), console.log(ctx);

// Expect 4 argument to define the direction of the gradient
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
// Expect 2 argument, offset and color
// 0 is the start of the gradient, 1, end of gradient
gradient.addColorStop(0, 'green');
gradient.addColorStop(0.5, 'teal');
gradient.addColorStop(1, 'white');
ctx.fillStyle = gradient;
ctx.strokeStyle = "white";

let startColor = "green";
let middleColor = "teal";
let endColor = "white";

function updateGradient() {
    // Retrieve the elements
    const startColorInput = document.getElementById("startColor");
    const middleColorInput = document.getElementById("middleColor");
    const endColorInput = document.getElementById("endColor");

    // Use their value, if no value, set a default value
    startColor = startColorInput.value || "green";
    middleColor = middleColorInput.value || "teal";
    endColor = endColorInput.value || "white";

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(0.5, middleColor);
    gradient.addColorStop(1, endColor);

    ctx.fillStyle = gradient;
}


function changeParticleCount() {
    const particleCountDropdown = document.getElementById("particleCount");
    if(particleCountDropdown.value<600){
        const selectedParticleCount = parseInt(particleCountDropdown.value);
        effect.changeParticleCount(selectedParticleCount);
    }  
}
function changeMouseRepelRadius() {
    const mouseRepelRadiusInput = document.getElementById("mouseRepelRadius");
    const newRadius = parseFloat(mouseRepelRadiusInput.value);
    console.log("New Repel Radius:", newRadius);
    effect.changeMouseRepelRadius(newRadius);
}


// Contains blueprint for individual particle object
class Particle {
  // OOP to keep classes modular and independent
  //Not creating copies of effect, just pointing at effect class from multiple places
  constructor(effect) {
    this.effect = effect;
    this.radius = Math.floor(Math.random() * 15 + 5);
    this.x =
      this.radius + Math.random() * (this.effect.width - this.radius * 2);
    this.y =
      this.radius + Math.random() * (this.effect.height - this.radius * 2);
    // Increase width velocity
    this.vx = Math.random() * 2 - 1;
    // Increase height velocity
    this.vy = Math.random() * 2 - 1;
    // Push force from the mouse event
    this.pushX = 0;
    this.pushY = 0;
    this.friction = 0.95;
  }
  // Defines what each particle looks like
  draw(context) {
    // Draw a circle
    context.beginPath();
    // Defines a path, don't render
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    // To draw, we can add fill with color or call fill method
    context.fill();
    // Stroke is performance expensive
    // context.stroke();
  }
  // Define particle motion and behavior
  update() {
    // Through this.effect = effect;, we are accessing mouse object
    // Calculate the distance with pythagoras theorem formula again
    const dx = this.x - this.effect.mouse.x;
    const dy = this.y - this.effect.mouse.y;
    const distance = Math.hypot(dx, dy);

    // Calculate the angel of mouse and particle
    // To know which way to push the particle, push it away from mouse
    if (distance < this.effect.mouse.radius) {
      // Counter clockwise angel, dy is passed fist
      // Angel value returned is whats needed to push the other object in correct direction away from mouse
      const angel = Math.atan2(dy, dx);
      //  Combining sin and cos will make particle move away in a circle
      // Move same speed as mouse till they've reached the radius of the mouse
      // Pulls if mouse is pressed   
      if(this.effect.mouse.pressed){
        // this.effect.mouse.radius = 300,
        this.pushX -= Math.cos(angel);
        this.pushY -= Math.sin(angel);
      } else{
        // this.effect.mouse.radius = 150,
        this.pushX += Math.cos(angel);
        this.pushY += Math.sin(angel);
      }
    }

    this.x += (this.pushX *= this.friction) + this.vx;
    this.y += (this.pushY *= this.friction) + this.vy;
    // If partical circle touches left egde of canvas it can't be pushed to the left

    if (this.x < this.radius) {
      this.x = this.radius;
      // Make it bounce back to the right if pushed to the left corner
      this.vx *= -1;
    } else if (this.x > this.effect.width - this.radius) {
      this.x = this.effect.width - this.radius;
      this.vx *= -1;
    }
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y > this.effect.height - this.radius) {
      this.y = this.effect.height - this.radius;
      this.vy *= -1;
    }
  }

  // Re-distribute the particles when resized so no particles gets stuck outside the canvas
  reset() {
    this.x =
      this.radius + Math.random() * (this.effect.width - this.radius * 2);
    this.y =
      this.radius + Math.random() * (this.effect.height - this.radius * 2);
  }
}

//Manage all particles
class Effect {
  // Uses the width and heigh of the canvas area
  // Make sure to draw shapes only within canvas area
  constructor(canvas, context) {
    // Convert to class property
    this.canvas = canvas;
    // context to convert to class property
    this.context = context;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    // Store particles in array
    this.particles = [];
    this.numberOfParticles = 200;
    this.createParticles();

    // Mouse added a property on main effect class
    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      // Influence area
      radius: 150,
    };

    // Use arrow function, e inherits keyword from parent scope
    // e = Effect
    // This will reset canvas state to default value
    window.addEventListener("resize", e => {
      this.resize(e.target.window.innerWidth, e.target.window.innerHeight);
    });

    window.addEventListener("mousemove", e => {
      // Assign to x,y to custom mouse object so it's available in whole codebase not just callback eventlistener
      // if(this.mouse.pressed){
      this.mouse.x = e.x;
      this.mouse.y = e.y;
      // }
    });
    window.addEventListener("mousedown", e => {
      this.mouse.pressed = true;
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });
    window.addEventListener("mouseup", e => {
      this.mouse.pressed = false;
    });
  }
  // Define helper method, runs once to init effect and create 20 particle effect
  createParticles() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      // New keyword looks for a class called particle, and trigger its constructor method
      // Particle expects a parameter, which is this effect
      this.particles.push(new Particle(this));
    }
  }
  handleParticle(context) {
    // Draw the lines first
    this.connectParticles(context);
    // Then draw particles to not have line higher index than particles
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    });
  }

  connectParticles(context) {
    const maxDistance = 100;
    // This will compare particles from index a, to particles in index b
    // Checks for every particles array in the particle list to see if length is less than 100px apart
    for (let a = 0; a < this.particles.length; a++) {
      // Checks for each particle in the particles array
      // It will start from index a, since the loop has already started
      for (let b = a; b < this.particles.length; b++) {
        // Calculate the distance DX, and DY, to get the distance between 2 particles
        // Imagine a 90 degree angle, DX covering the width, and DY the height
        // Then use the hythagoras therorem forumla, to get the hypotenuse(distance), between 2 the particles

        // X distance
        const dx = this.particles[a].x - this.particles[b].x;
        // Y distance
        const dy = this.particles[a].y - this.particles[b].y;

        const distance = Math.hypot(dx, dy);
        // If distance is closer than max distance connect them
        if (distance < maxDistance) {
          // Save all canvas settings
          context.save();

          // Devides the distance with max distance to get opacity between 0 - 1
          // If distance is 50px, maxdistance 100, opacity will be 0.5
          //  1 - to calculate it backwards as well
          const opacity = 1 - distance / maxDistance;
          context.globalAlpha = opacity;
          context.beginPath();
          // Defines the path, to render on canvas stroke it or fill the shape with color
          context.moveTo(this.particles[a].x, this.particles[a].y);
          context.lineTo(this.particles[b].x, this.particles[b].y);
          context.stroke();
          // Restore the canvas back to the state where it was in save
          context.restore();
        }
      }
    }
  }
  resize(width, height) {
    // When the instance of a class is created all code is executed
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    // Redeclare fillstyle since it will be returned to default state
    // When it's reset you need to recalculate the direction and breakpoints
    const gradient = this.context.createLinearGradient(0, 0, width, height);
    // Expect 2 argument, offset and color
    // 0 is the start of the gradient, 1, end of gradient
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(0.5, middleColor);
    gradient.addColorStop(1, endColor);
    this.context.fillStyle = gradient;
    this.context.strokeStyle = endColor;


    // The particle will always try to fit the canvas when resized
    this.particles.forEach(particle => {
      particle.reset();
    });
  }


  changeParticleCount(newParticleCount) {
    // Change the count to the new value
    this.numberOfParticles = newParticleCount;
    // Empties the particle array so it's not just constantly incrimented
    this.particles = [];
    // Create new particles count
    this.createParticles();
}
changeMouseRepelRadius(newRadius) {
    // Change the repel radius to the new value
    this.mouse.radius = newRadius;
  }
}

// Pass the canvas and context to the new Effect
const effect = new Effect(canvas, ctx);

// Creat a new instance of effect
// It expects contact

// Will run on repeat updating and re-drawing the shapes to create animations
function animation() {
  // This clears the pain from previous frame
  // Clears each canvas between animation step
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  effect.handleParticle(ctx);
  // Pass parent method to create animation
  requestAnimationFrame(animation);
}
animation();
