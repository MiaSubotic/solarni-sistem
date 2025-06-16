import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm";
import WebGLUtils from "../WebGLUtils.js";


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

function createOrbit(radius, segments) {
  const positions = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  }
  return new Float32Array(positions);
}


const planets = [
  {
    name: "Merkur",
    radius: 0.95,
    orbitRadius: 2.0,
    speed: 1.2,
    color: [0.7, 0.5, 0.4],
    orbitColor: [0.7, 0.5, 0.4, 0.3],
    texture: "../textures/mercury.jpg"
  },
  {
    name: "Venera",
    radius: 1.02,
    orbitRadius: 2.5,
    speed: 0.8,
    color: [0.9, 0.7, 0.3],
    orbitColor: [0.9, 0.7, 0.3, 0.3],
    texture: "../textures/venus.jpg"
  },
  {
    name: "Zemlja",
    radius: 1.05,
    orbitRadius: 3.3,
    speed: 0.6,
    color: [0.2, 0.4, 0.8],
    orbitColor: [0.2, 0.4, 0.8, 0.3],
    texture: "../textures/earth.webp"
  },
  {
    name: "Mars",
    radius: 1.0,
    orbitRadius: 4.0,
    speed: 0.45,
    color: [0.9, 0.2, 0.1],
    orbitColor: [0.9, 0.2, 0.1, 0.3],
    texture: "../textures/mars.jpg"
  },
  {
    name: "Jupiter",
    radius: 1.2,
    orbitRadius: 5.0,
    speed: 0.3,
    color: [0.8, 0.6, 0.4],
    orbitColor: [0.8, 0.6, 0.4, 0.3],
    texture: "../textures/jupitermap.jpg"
  },
  {
    name: "Saturn",
    radius: 1.15,
    orbitRadius: 6.0,
    speed: 0.25,
    color: [0.9, 0.8, 0.5],
    orbitColor: [0.9, 0.8, 0.5, 0.3],
    texture: "../textures/saturnmap.jpg"
  },
  {
    name: "Uran",
    radius: 2.0,
    orbitRadius: 6.8,
    speed: 0.15,
    color: [0.6, 0.8, 0.9],
    orbitColor: [0.6, 0.8, 0.9, 0.3],
    texture: "../textures/uranus.jpg"
  },
  {
    name: "Neptun",
    radius: 2.0,
    orbitRadius: 7.5,
    speed: 0.1,
    color: [0.2, 0.3, 0.9],
    orbitColor: [0.2, 0.3, 0.9, 0.3],
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

  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  
  const sunGeometry = createSphere(0.8, 40, 40);
  const planetGeometry = createSphere(0.15, 30, 30);

  const orbitSegments = 64;
  const orbitData = {};
  planets.forEach(planet => {
    orbitData[planet.name] = createOrbit(planet.orbitRadius, orbitSegments);
  });

  
  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");
  gl.useProgram(program);


  const sunTexture = await WebGLUtils.loadTexture(gl, "../textures/sun.jpg");
  const planetTextures = await Promise.all(
    planets.map(planet => WebGLUtils.loadTexture(gl, planet.texture))
  );

  
  const sunVAO = gl.createVertexArray();
  gl.bindVertexArray(sunVAO);

  
  const sunVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sunVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunGeometry.positions), gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, "in_position");
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  
  const sunTBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sunTBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunGeometry.texCoords), gl.STATIC_DRAW);
  const a_texCoord = gl.getAttribLocation(program, "in_texcoord");
  gl.enableVertexAttribArray(a_texCoord);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

  
  const sunIBO = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sunIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sunGeometry.indices), gl.STATIC_DRAW);

  
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

  
  const orbitVAO = gl.createVertexArray();
  gl.bindVertexArray(orbitVAO);

  const orbitVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, orbitVBO);
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();

  
  mat4.lookAt(viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projectionMatrix, Math.PI / 4.5, canvas.width / canvas.height, 0.1, 100);

  const u_model = gl.getUniformLocation(program, "u_model");
  const u_view = gl.getUniformLocation(program, "u_view");
  const u_projection = gl.getUniformLocation(program, "u_projection");
  const u_sampler = gl.getUniformLocation(program, "u_sampler");
  const u_color = gl.getUniformLocation(program, "u_color");

  // Kamera kontrola
  let angleX = 0;
  let angleY = 0;
  let distance = 5;
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
    distance = Math.max(5, Math.min(30, distance));
    e.preventDefault();
  });

  let startTime = performance.now();

  function render() {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - startTime) * 0.001;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    
    const view = mat4.clone(viewMatrix);
    mat4.translate(view, view, [0, 0, -distance]);
    mat4.rotateX(view, view, angleX);
    mat4.rotateY(view, view, angleY);
    gl.uniformMatrix4fv(u_view, false, view);
    gl.uniformMatrix4fv(u_projection, false, projectionMatrix);

    
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

    
    gl.bindVertexArray(orbitVAO);
    gl.disable(gl.DEPTH_TEST);
    planets.forEach(planet => {
      gl.bindBuffer(gl.ARRAY_BUFFER, orbitVBO);
      gl.bufferData(gl.ARRAY_BUFFER, orbitData[planet.name], gl.STATIC_DRAW);
      gl.uniform4fv(u_color, planet.orbitColor);
      gl.uniformMatrix4fv(u_model, false, mat4.create());
      gl.drawArrays(gl.LINE_STRIP, 0, orbitData[planet.name].length / 3);
    });
    gl.enable(gl.DEPTH_TEST);

    
    gl.bindVertexArray(planetVAO);
    planets.forEach((planet, i) => {
      // Izračun pozicije planeta
      const angle = planet.speed * elapsedTime;
      const x = planet.orbitRadius * Math.cos(angle);
      const z = planet.orbitRadius * Math.sin(angle);

      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, planetTextures[i]);
      gl.uniform1i(u_sampler, 0);
      gl.uniform4fv(u_color, [...planet.color, 1]);

      
      const planetModel = mat4.create();
      mat4.translate(planetModel, planetModel, [x, 0, z]);
      mat4.scale(planetModel, planetModel, [planet.radius, planet.radius, planet.radius]);
      gl.uniformMatrix4fv(u_model, false, planetModel);

      
      gl.drawElements(gl.TRIANGLES, planetGeometry.indices.length, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(render);
  }
  render();
}

main();