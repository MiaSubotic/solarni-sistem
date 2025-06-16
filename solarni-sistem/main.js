import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm";
import WebGLUtils from "../WebGLUtils.js";

// Kreiranje sfere (proceduralno)
function createSphere(radius, latitudeBands, longitudeBands) {
  const positions = [];
  const texCoords = [];
  const indices = [];
  
  for (let lat = 0; lat <= latitudeBands; ++lat) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; ++lon) {
      const phi = lon * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      texCoords.push(lon / longitudeBands, lat / latitudeBands);
    }
  }

  for (let lat = 0; lat < latitudeBands; ++lat) {
    for (let lon = 0; lon < longitudeBands; ++lon) {
      const first = (lat * (longitudeBands + 1)) + lon;
      const second = first + longitudeBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return { positions, texCoords, indices };
}

// Definicija planeta SA POVEĆANIM VRIJEDNOSTIMA
const planets = [
  {
    name: "Merkur",
    radius: 0.95,  // Povećano sa 0.05
    orbitRadius: 2.0,  // Povećano sa 1.5
    speed: 1.2,
    color: [0.7, 0.5, 0.4],
    texture: "../textures/mercury.jpg"
  },
  {
    name: "Venera",
    radius: 1.02,  // Povećano sa 0.09
    orbitRadius: 2.5,  // Povećano sa 2.0
    speed: 0.8,
    color: [0.9, 0.7, 0.3],
    texture: "../textures/venus.jpg"
  },
  {
    name: "Zemlja",
    radius: 1.05,  // Povećano sa 0.1
    orbitRadius: 3.3,  // Povećano sa 2.8
    speed: 0.6,
    color: [0.2, 0.4, 0.8],
    texture: "../textures/earth.webp"
  },
  {
    name: "Mars",
    radius: 1.0,  // Povećano sa 0.07
    orbitRadius: 4.0,  // Povećano sa 3.5
    speed: 0.45,
    color: [0.9, 0.2, 0.1],
    texture: "../textures/mars.jpg"
  },
  {
    name: "Jupiter",
    radius: 1.2,  // Povećano sa 0.2
    orbitRadius: 5.0,  // Povećano sa 4.5
    speed: 0.3,
    color: [0.8, 0.6, 0.4],
    texture: "../textures/jupitermap.jpg"
  },
  {
    name: "Saturn",
    radius: 1.15,  // Povećano sa 0.18
    orbitRadius: 6.0,  // Povećano sa 5.5
    speed: 0.25,
    color: [0.9, 0.8, 0.5],
    texture: "../textures/saturnmap.jpg",
    hasRings: true,
    ringRadius: 0.4,  // Povećano sa 0.25
    ringInnerRadius: 0.3  // Povećano sa 0.18
  },
  {
    name: "Uran",
    radius: 2.0,  // Povećano sa 0.15
    orbitRadius: 6.8,  // Povećano sa 6.3
    speed: 0.15,
    color: [0.6, 0.8, 0.9],
    texture: "../textures/uranus.jpg"
  },
  {
    name: "Neptun",
    radius: 2.0,  // Povećano sa 0.15
    orbitRadius: 7.5,  // Povećano sa 7.0
    speed: 0.1,
    color: [0.2, 0.3, 0.9],
    texture: "../textures/neptune.jpg"
  }
];

async function main() {
  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    alert("WebGL2 nije podržan");
    return;
  }

  // Resize funkcija
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // KREIRANJE VEĆIH SFERA
  const sunGeometry = createSphere(0.8, 40, 40);  // Povećano sa 0.3
  const planetGeometry = createSphere(0.15, 30, 30); // Povećano sa 0.1

  // Shader program
  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");
  gl.useProgram(program);

  // Učitavanje tekstura
  const sunTexture = await WebGLUtils.loadTexture(gl, "../textures/sun.jpg");
  const planetTextures = await Promise.all(
    planets.map(planet => WebGLUtils.loadTexture(gl, planet.texture))
  );

  // VAO za Sunce
  const sunVAO = gl.createVertexArray();
  gl.bindVertexArray(sunVAO);

  // VBO - positions
  const sunVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sunVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunGeometry.positions), gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, "in_position");
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  // VBO - texCoords
  const sunTBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sunTBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunGeometry.texCoords), gl.STATIC_DRAW);
  const a_texCoord = gl.getAttribLocation(program, "in_texcoord");
  gl.enableVertexAttribArray(a_texCoord);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

  // IBO
  const sunIBO = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sunIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sunGeometry.indices), gl.STATIC_DRAW);

  // VAO za planete
  const planetVAO = gl.createVertexArray();
  gl.bindVertexArray(planetVAO);

  const planetVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, planetVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planetGeometry.positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  const planetTBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, planetTBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planetGeometry.texCoords), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a_texCoord);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

  const planetIBO = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planetIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(planetGeometry.indices), gl.STATIC_DRAW);

  // Matrice
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();

  // Postavi početni pogled malo odozgo
  mat4.lookAt(viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projectionMatrix, Math.PI / 4.5, canvas.width / canvas.height, 0.1, 100);

  const u_model = gl.getUniformLocation(program, "u_model");
  const u_view = gl.getUniformLocation(program, "u_view");
  const u_projection = gl.getUniformLocation(program, "u_projection");
  const u_sampler = gl.getUniformLocation(program, "u_sampler");
  const u_color = gl.getUniformLocation(program, "u_color");

  // Kamera kontrola
  let angleX = 0;  // Početni pogled odozgo
  let angleY = 0;   // Rotacija za 45 stupnjeva
  let distance = 5;  // Povećano sa 5
  let isDragging = false;
  let lastX, lastY;

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener("mouseup", () => (isDragging = false));
  canvas.addEventListener("mouseleave", () => (isDragging = false));
  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    angleY += dx * 0.01;
    angleX += dy * 0.01;
    angleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, angleX));
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener("wheel", (e) => {
    distance *= e.deltaY > 0 ? 1.1 : 0.9;
    distance = Math.max(5, Math.min(30, distance));  // Povećan maksimalni zoom
    e.preventDefault();
  });

  let startTime = performance.now();


  function render() {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - startTime) * 0.001;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Update view matrix
    const view = mat4.clone(viewMatrix);
    mat4.translate(view, view, [0, 0, -distance]);
    mat4.rotateX(view, view, angleX);
    mat4.rotateY(view, view, angleY);

    gl.uniformMatrix4fv(u_view, false, view);
    gl.uniformMatrix4fv(u_projection, false, projectionMatrix);

    // Crtanje Sunca
    gl.bindVertexArray(sunVAO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sunTexture);
    gl.uniform1i(u_sampler, 0);
    gl.uniform4fv(u_color, [1, 1, 1, 1]);
    
    const sunModel = mat4.create();
    mat4.rotateY(sunModel, sunModel, elapsedTime * 0.5); 
    mat4.scale(sunModel, sunModel, [1.6, 1.6, 1.6]);  
    gl.uniformMatrix4fv(u_model, false, sunModel);
    gl.drawElements(gl.TRIANGLES, sunGeometry.indices.length, gl.UNSIGNED_SHORT, 0);

    // Crtanje planeta
    gl.bindVertexArray(planetVAO);
    planets.forEach((planet, i) => {
      // Izračun pozicije planeta
      const angle = planet.speed * elapsedTime;
      const x = planet.orbitRadius * Math.cos(angle);
      const z = planet.orbitRadius * Math.sin(angle);

      // Postavi teksturu i boju
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, planetTextures[i]);
      gl.uniform1i(u_sampler, 0);
      gl.uniform4fv(u_color, [...planet.color, 1]);

      // Postavi model matricu
      const planetModel = mat4.create();
      mat4.translate(planetModel, planetModel, [x, 0, z]);
      mat4.scale(planetModel, planetModel, [planet.radius, planet.radius, planet.radius]);
      gl.uniformMatrix4fv(u_model, false, planetModel);


      // Crtaj planet
      gl.drawElements(gl.TRIANGLES, planetGeometry.indices.length, gl.UNSIGNED_SHORT, 0);

      // Crtanje prstena za Saturn
      if (planet.hasRings) {
        const ringModel = mat4.create();
        mat4.translate(ringModel, ringModel, [x, 0, z]);
        mat4.rotateX(ringModel, ringModel, Math.PI/2);
        mat4.scale(ringModel, ringModel, [planet.ringRadius, planet.ringRadius, planet.ringInnerRadius]);
        gl.uniformMatrix4fv(u_model, false, ringModel);
        gl.uniform4fv(u_color, [0.8, 0.8, 0.8, 0.7]);
        gl.drawElements(gl.TRIANGLES, planetGeometry.indices.length, gl.UNSIGNED_SHORT, 0);
      }
    });

    requestAnimationFrame(render);
  }

  render();
}

main();