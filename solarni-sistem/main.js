import { mat4, vec3, vec4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm";
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
    name: "Mercury",
    radius: 0.95,
    orbitRadius: 2.0,
    speed: 1.2,
    color: [0.7, 0.5, 0.4],
    orbitColor: [0.7, 0.5, 0.4, 0.3],
    texture: "../textures/mercury.jpg",
    revolutionPeriod: 88,
    mass: 0.330,
    volume: 6.08e10
  },
  {
    name: "Venus",
    radius: 1.02,
    orbitRadius: 2.5,
    speed: 0.8,
    color: [0.9, 0.7, 0.3],
    orbitColor: [0.9, 0.7, 0.3, 0.3],
    texture: "../textures/venus.jpg",
    revolutionPeriod: 225,
    mass: 4.87,
    volume: 9.28e11
  },
  {
    name: "Earth",
    radius: 1.05,
    orbitRadius: 3.3,
    speed: 0.6,
    color: [0.2, 0.4, 0.8],
    orbitColor: [0.2, 0.4, 0.8, 0.3],
    texture: "../textures/earth.webp",
    revolutionPeriod: 365,
    mass: 5.97,
    volume: 1.08e12
  },
  {
    name: "Mars",
    radius: 1.0,
    orbitRadius: 4.0,
    speed: 0.45,
    color: [0.9, 0.2, 0.1],
    orbitColor: [0.9, 0.2, 0.1, 0.3],
    texture: "../textures/mars.jpg",
    revolutionPeriod: 687,
    mass: 0.642,
    volume: 1.63e11
  },
  {
    name: "Jupiter",
    radius: 2.3,
    orbitRadius: 5.0,
    speed: 0.3,
    color: [0.8, 0.6, 0.4],
    orbitColor: [0.8, 0.6, 0.4, 0.3],
    texture: "../textures/jupitermap.jpg",
    revolutionPeriod: 4333,
    mass: 1898,
    volume: 1.43e15
  },
  {
    name: "Saturn",
    radius: 1.15,
    orbitRadius: 6.0,
    speed: 0.25,
    color: [0.9, 0.8, 0.5],
    orbitColor: [0.9, 0.8, 0.5, 0.3],
    texture: "../textures/saturnmap.jpg",
    revolutionPeriod: 10759,
    mass: 568,
    volume: 8.27e14
  },
  {
    name: "Uranus",
    radius: 2.0,
    orbitRadius: 6.8,
    speed: 0.15,
    color: [0.6, 0.8, 0.9],
    orbitColor: [0.6, 0.8, 0.9, 0.3],
    texture: "../textures/uranus.jpg",
    revolutionPeriod: 30687,
    mass: 86.8,
    volume: 6.83e13
  },
  {
    name: "Neptune",
    radius: 2.0,
    orbitRadius: 7.5,
    speed: 0.1,
    color: [0.2, 0.3, 0.9],
    orbitColor: [0.2, 0.3, 0.9, 0.3],
    texture: "../textures/neptune.jpg",
    revolutionPeriod: 60190,
    mass: 102,
    volume: 6.25e13
  }
];

let currentViewMatrix = mat4.create();

async function main() {
  const canvas = document.getElementById("glcanvas");
  if (!canvas) throw new Error("Canvas element not found");

  const gl = canvas.getContext("webgl2", { antialias: true });
  if (!gl) throw new Error("WebGL2 nije podržan");
  
  // UI Elementi
  const loadingElement = document.getElementById('loading');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const planetInfo = document.getElementById('planet-info');

  let selectedPlanet = null;
  let followPlanet = false;
  let cameraOffset = [0, 5, 5];
  let distance = 5;
  let angleX = 0;
  let angleY = 0;
  let isDragging = false;
  let lastX, lastY;

  // Zoom kontrola
  zoomInBtn.addEventListener('click', () => {
    distance *= 0.9;
    distance = Math.max(3, Math.min(30, distance));
  });

  zoomOutBtn.addEventListener('click', () => {
    distance *= 1.1;
    distance = Math.max(3, Math.min(30, distance));
  });

  function updatePlanetInfo(planet) {
    const panel = document.getElementById("planet-info");
    if (!panel) return;
    
    panel.innerHTML = `
      <h3>${planet.name}</h3>
      <p>Orbit Radius: ${planet.orbitRadius} AU</p>
      <p>Orbital Speed: ${planet.speed} km/s</p>
      <p>Revolution: ${planet.revolutionPeriod} days</p>
      <p>Mass: ${planet.mass}x10^24 kg</p>
      <p>Volume: ${planet.volume} km^3</p>
      <button id="follow-btn">${followPlanet ? 'Stop Following' : 'Follow Planet'}</button>
    `;
    panel.style.display = 'block';
    
    document.getElementById('follow-btn').addEventListener('click', () => {
      followPlanet = !followPlanet;
      updatePlanetInfo(planet);
    });
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Geometrija
  const sunGeometry = createSphere(0.8, 40, 40);
  const planetGeometry = createSphere(0.15, 30, 30);

  const orbitSegments = 64;
  const orbitData = {};
  planets.forEach(planet => {
    orbitData[planet.name] = createOrbit(planet.orbitRadius, orbitSegments);
  });

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

  // VAO za orbite
  const orbitVAO = gl.createVertexArray();
  gl.bindVertexArray(orbitVAO);

  const orbitVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, orbitVBO);
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  // Matrice
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projectionMatrix, Math.PI / 4.5, canvas.width / canvas.height, 0.1, 100);

  // Uniform lokacije
  const u_model = gl.getUniformLocation(program, "u_model");
  const u_view = gl.getUniformLocation(program, "u_view");
  const u_projection = gl.getUniformLocation(program, "u_projection");
  const u_sampler = gl.getUniformLocation(program, "u_sampler");
  const u_color = gl.getUniformLocation(program, "u_color");
  const u_selected = gl.getUniformLocation(program, "u_selected");
  const u_is_planet = gl.getUniformLocation(program, "u_is_planet");
  const u_is_sun = gl.getUniformLocation(program, "u_is_sun");

  // Event listeners
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

  canvas.addEventListener('click', (e) => {
    const planet = detectPlanetAtPosition(e.clientX, e.clientY);
    
    if (planet) {
      if (selectedPlanet === planet.name) {
        // Ako je već selektovana, prestani da pratiš
        
        selectedPlanet = null;
        document.getElementById("planet-info").style.display = 'none';
      } else {
        // Prati novu planetu
        selectedPlanet = planet.name;
        followPlanet = false;
        updatePlanetInfo(planet);
      }
    } else {
      // Klik van planete - resetuj pogled
      followPlanet = false;
      selectedPlanet = null;
      document.getElementById("planet-info").style.display = 'none';
    }
  });

  function detectPlanetAtPosition(x, y) {
    const rect = canvas.getBoundingClientRect();
    const pixelX = x - rect.left;
    const pixelY = y - rect.top;
    
    const glX = (pixelX / canvas.width) * 2 - 1;
    const glY = 1 - (pixelY / canvas.height) * 2;

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      const angle = planet.speed * (performance.now() - startTime) * 0.001;
      const planetX = planet.orbitRadius * Math.cos(angle);
      const planetZ = planet.orbitRadius * Math.sin(angle);
      
      const planetPos = vec4.fromValues(planetX, 0, planetZ, 1);
      vec4.transformMat4(planetPos, planetPos, currentViewMatrix);
      vec4.transformMat4(planetPos, planetPos, projectionMatrix);
      
      const planetXNDC = planetPos[0] / planetPos[3];
      const planetYNDC = planetPos[1] / planetPos[3];
      
      const distance = Math.sqrt(
        Math.pow(glX - planetXNDC, 2) + 
        Math.pow(glY - planetYNDC, 2)
      );

      if (distance < 0.05) {
        return planet;
      }
    }
    return null;
  }

  let startTime = performance.now();
  if (loadingElement) loadingElement.style.display = 'none';
  
  function render() {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - startTime) * 0.001;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Update view matrix based on follow mode
    if (followPlanet && selectedPlanet) {
      const planet = planets.find(p => p.name === selectedPlanet);
      if (planet) {
        const angle = planet.speed * elapsedTime;
        const planetX = planet.orbitRadius * Math.cos(angle);
        const planetZ = planet.orbitRadius * Math.sin(angle);
        
        // Calculate camera position with some offset
        const camX = planetX + cameraOffset[0];
        const camY = cameraOffset[1];
        const camZ = planetZ + cameraOffset[2];
        
        mat4.lookAt(
          currentViewMatrix,
          [camX, camY, camZ],
          [planetX, 0, planetZ],
          [0, 1, 0]
        );
      }
    } else {
      // Default orbiting view
      mat4.copy(currentViewMatrix, viewMatrix);
      mat4.translate(currentViewMatrix, currentViewMatrix, [0, 0, -distance]);
      mat4.rotateX(currentViewMatrix, currentViewMatrix, angleX);
      mat4.rotateY(currentViewMatrix, currentViewMatrix, angleY);
    }

    // Set matrices
    gl.uniformMatrix4fv(u_view, false, currentViewMatrix);
    gl.uniformMatrix4fv(u_projection, false, projectionMatrix);

    // 1. Crtanje orbita (sve)
    gl.uniform1i(u_is_planet, 0);
    gl.bindVertexArray(orbitVAO);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      gl.uniform4fv(u_color, planet.orbitColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, orbitVBO);
      gl.bufferData(gl.ARRAY_BUFFER, orbitData[planet.name], gl.STATIC_DRAW);
      gl.uniformMatrix4fv(u_model, false, mat4.create());
      gl.drawArrays(gl.LINE_STRIP, 0, orbitData[planet.name].length / 3);
    }

    // 2. Crtanje Sunca (sa ispravnim depth testom)
    gl.uniform1i(u_is_sun, 1);
    gl.uniform1i(u_is_planet, 0); 
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true); // Omogući upis u depth buffer
    
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
    gl.uniform1i(u_is_sun, 0);
    
    // 3. Crtanje orbita ispred Sunca (samo vidljivi delovi)
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      const angle = planet.speed * elapsedTime;
      const planetX = planet.orbitRadius * Math.cos(angle);
      const planetZ = planet.orbitRadius * Math.sin(angle);
      
      // Provera da li je orbita ispred Sunca
      const camPos = [0, 0, distance];
      const sunPos = [0, 0, 0];
      const planetPos = [planetX, 0, planetZ];
      
      const toPlanet = vec3.subtract([], planetPos, sunPos);
      const toCam = vec3.subtract([], camPos, sunPos);
      const dot = vec3.dot(toPlanet, toCam);
      
      if (dot < 0) continue; // Preskoči orbite iza Sunca
      
      // Osvetli orbitu ako je planetа selektovana
      const isSelectedOrbit = selectedPlanet === planet.name;
      if (isSelectedOrbit) {
        const highlightedColor = [
          Math.min(planet.orbitColor[0] + 0.3, 1.0),
          Math.min(planet.orbitColor[1] + 0.3, 1.0),
          Math.min(planet.orbitColor[2] + 0.3, 1.0),
          planet.orbitColor[3]
        ];
        gl.uniform4fv(u_color, highlightedColor);
      } else {
        gl.uniform4fv(u_color, planet.orbitColor);
      }
      
      gl.bindBuffer(gl.ARRAY_BUFFER, orbitVBO);
      gl.bufferData(gl.ARRAY_BUFFER, orbitData[planet.name], gl.STATIC_DRAW);
      gl.uniformMatrix4fv(u_model, false, mat4.create());
      gl.drawArrays(gl.LINE_STRIP, 0, orbitData[planet.name].length / 3);
    }

    // 4. Crtanje planeta
    gl.uniform1i(u_is_planet, 1);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.bindVertexArray(planetVAO);
  
    planets.forEach((planet, i) => {
      const angle = planet.speed * elapsedTime;
      const x = planet.orbitRadius * Math.cos(angle);
      const z = planet.orbitRadius * Math.sin(angle);
      
      gl.uniform1i(u_is_planet, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, planetTextures[i]);
      gl.uniform1i(u_sampler, 0);
      gl.uniform4fv(u_color, [...planet.color, 1]);
      gl.uniform1i(u_selected, planet.name === selectedPlanet ? 1 : 0);

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