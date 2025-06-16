#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 uLightPosition;
uniform vec3 uViewPosition;

out vec3 vNormal;
out vec3 vFragPos;
out vec3 vLightDir;
out vec3 vViewDir;
out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    vNormal = mat3(transpose(inverse(uModelMatrix))) * aNormal;
    vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));
    vLightDir = uLightPosition - vFragPos;
    vViewDir = uViewPosition - vFragPos;
    
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}