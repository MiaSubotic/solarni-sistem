import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';
import WebGLUtils from './webglutils.js';

// Glavna klasa aplikacije za simulaciju solarnog sistema
class SolarSystem {
    constructor() {
        this.gl = null;             // WebGL kontekst
        this.program = null;        // Shader program
        this.VAO = null;            // Vertex Array Object
        this.sphereVertices = null; // Podaci o sferi (model planete)
        this.planets = [];          // Niz planeta u sistemu
        this.cameraPos = [0, 0, 15]; // Pozicija kamere
        this.lightPos = [0, 0, 0];   // Pozicija svetla (Sunce)
        this.lightColor = [1.0, 1.0, 1.0]; // Boja svetla
        this.animationId = null;    // ID animacije
        this.lastTime = 0;          // Vreme poslednjeg frejma
    }

    // Inicijalizacija aplikacije
    async init() {
        // Inicijalizacija WebGL-a
        this.gl = WebGLUtils.initWebGL();
        if (!this.gl) return;

        // Podesavanje velicine canvasa
        WebGLUtils.resizeCanvasToWindow(this.gl);
        window.addEventListener('resize', () => {
            WebGLUtils.resizeCanvasToWindow(this.gl);
        });

        // Ucitavanje sejdera i kreiranje programa
        this.program = await WebGLUtils.createProgram(
            this.gl,
            './vertex-shader.glsl',
            './fragment-shader.glsl'
        );

        // Ucitavanje modela sfere (za planete)
        this.sphereVertices = await WebGLUtils.loadOBJ('./sphere.obj', true);

        // Kreiranje Vertex Array Object-a (VAO)
        this.VAO = WebGLUtils.createVAO(this.gl, this.program, this.sphereVertices, 8, [
            { name: 'aPosition', size: 3, offset: 0 },  // Pozicija
            { name: 'aTexCoord', size: 2, offset: 3 },  // Teksturne koordinate
            { name: 'aNormal', size: 3, offset: 5 }      // Normale
        ]);

        // Inicijalizacija planeta
        this.initPlanets();

        // Pokretanje animacije
        this.lastTime = performance.now();
        this.animate();
    }

    // Kreiranje planeta u solarnom sistemu
    initPlanets() {
        // Sunce
        this.planets.push({
            name: 'Sun',
            color: [1.0, 0.8, 0.0], // Zuta boja
            radius: 2.0,            // Najveci radijus
            distance: 0,           // Nema orbitu (centar sistema)
            angle: 0,               // Pocetni ugao
            speed: 0,              // Ne rotira oko centra
            rotation: 0,            // Rotacija oko ose
            shininess: 32.0,        // Sjajnost
            ambient: 0.2,           // Ambientna komponenta
            specular: 0.5           // Spekularna komponenta
        });

        // Merkur
        this.planets.push({
            name: 'Mercury',
            color: [0.8, 0.6, 0.4], // Smedja boja
            radius: 0.4,
            distance: 3,
            angle: 0,
            speed: 0.04,            // Najbrza rotacija
            rotation: 0,
            shininess: 16.0,
            ambient: 0.1,
            specular: 0.3
        });

        // Venera
        this.planets.push({
            name: 'Venus',
            color: [0.9, 0.7, 0.3], // Zuckasto-bela
            radius: 0.6,
            distance: 5,
            angle: 0,
            speed: 0.015,
            rotation: 0,
            shininess: 32.0,
            ambient: 0.15,
            specular: 0.4
        });

        // Zemlja
        this.planets.push({
            name: 'Earth',
            color: [0.0, 0.4, 0.8], // Plava boja
            radius: 0.6,
            distance: 7,
            angle: 0,
            speed: 0.01,
            rotation: 0,
            shininess: 64.0,
            ambient: 0.1,
            specular: 0.5
        });

        // Mars
        this.planets.push({
            name: 'Mars',
            color: [0.8, 0.3, 0.1], // Crvena boja
            radius: 0.5,
            distance: 9,
            angle: 0,
            speed: 0.008,
            rotation: 0,
            shininess: 32.0,
            ambient: 0.1,
            specular: 0.3
        });

        // Jupiter
        this.planets.push({
            name: 'Jupiter',
            color: [0.8, 0.6, 0.4], // Smedja boja
            radius: 1.2,            // Najveca planeta
            distance: 12,
            angle: 0,
            speed: 0.002,
            rotation: 0,
            shininess: 128.0,
            ambient: 0.2,
            specular: 0.6
        });

        // Saturn
        this.planets.push({
            name: 'Saturn',
            color: [0.9, 0.8, 0.5], // Zuckasta boja
            radius: 1.0,
            distance: 15,
            angle: 0,
            speed: 0.0009,
            rotation: 0,
            shininess: 64.0,
            ambient: 0.15,
            specular: 0.5
        });

        // Uran
        this.planets.push({
            name: 'Uranus',
            color: [0.4, 0.7, 0.8], // Plavozelena boja
            radius: 0.8,
            distance: 18,
            angle: 0,
            speed: 0.0004,
            rotation: 0,
            shininess: 32.0,
            ambient: 0.1,
            specular: 0.4
        });

        // Neptun
        this.planets.push({
            name: 'Neptune',
            color: [0.2, 0.3, 0.9], // Tamnoplava boja
            radius: 0.8,
            distance: 20,
            angle: 0,
            speed: 0.0001,          // Najsporija rotacija
            rotation: 0,
            shininess: 32.0,
            ambient: 0.1,
            specular: 0.4
        });
    }

    // Glavna animaciona petlja
    animate() {
        this.animationId = requestAnimationFrame((timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            
            this.update(deltaTime); // Azuriranje stanja
            this.render();          // Renderovanje
            
            this.animate();        // Rekurzivni poziv
        });
    }

    // Azuriranje pozicija i rotacija planeta
    update(deltaTime) {
        for (const planet of this.planets) {
            planet.angle += planet.speed * deltaTime * 0.05; // Rotacija oko Sunca
            planet.rotation += 0.005 * deltaTime * 0.05;    // Rotacija oko ose
        }
    }

    // Renderovanje scene
    render() {
        const gl = this.gl;
        
        // Ciscenje canvasa
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Crna pozadina
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); // Omoguci dubinsko testiranje
        
        // Kreiranje matrica za model, pogled i projekciju
        const { modelMat, viewMat, projectionMat } = WebGLUtils.createModelViewProjection(
            gl,
            this.cameraPos
        );
        
        // Podesavanje matrica pogleda i projekcije (iste za sve planete)
        WebGLUtils.setUniformMatrix4fv(
            gl,
            this.program,
            ['uViewMatrix', 'uProjectionMatrix'],
            [viewMat, projectionMat]
        );
        
        // Podesavanje svetlosnih parametara (Sunce je izvor svetlosti)
        gl.useProgram(this.program);
        gl.uniform3fv(gl.getUniformLocation(this.program, 'uLightPosition'), this.lightPos);
        gl.uniform3fv(gl.getUniformLocation(this.program, 'uLightColor'), this.lightColor);
        gl.uniform3fv(gl.getUniformLocation(this.program, 'uViewPosition'), this.cameraPos);
        
        // Crtanje svake planete
        for (const planet of this.planets) {
            // Izracunavanje pozicije planete
            const x = planet.distance * Math.cos(planet.angle);
            const z = planet.distance * Math.sin(planet.angle);
            
            // Kreiranje model matrice za planetu
            const planetModelMat = mat4.create();
            mat4.translate(planetModelMat, planetModelMat, [x, 0, z]);
            mat4.rotateY(planetModelMat, planetModelMat, planet.rotation);
            mat4.scale(planetModelMat, planetModelMat, [planet.radius, planet.radius, planet.radius]);
            
            // Podesavanje model matrice
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, 'uModelMatrix'),
                false,
                planetModelMat
            );
            
            // Podesavanje materijalnih svojstava
            gl.uniform3fv(gl.getUniformLocation(this.program, 'uObjectColor'), planet.color);
            gl.uniform1f(gl.getUniformLocation(this.program, 'uShininess'), planet.shininess);
            gl.uniform1f(gl.getUniformLocation(this.program, 'uAmbientStrength'), planet.ambient);
            gl.uniform1f(gl.getUniformLocation(this.program, 'uSpecularStrength'), planet.specular);
            
            // Crtanje sfere
            gl.bindVertexArray(this.VAO);
            gl.drawArrays(gl.TRIANGLES, 0, this.sphereVertices.length / 8);
            gl.bindVertexArray(null);
        }
    }
}

// Pokretanje aplikacije kada se stranica ucita
window.addEventListener('load', async () => {
    const solarSystem = new SolarSystem();
    await solarSystem.init();
});