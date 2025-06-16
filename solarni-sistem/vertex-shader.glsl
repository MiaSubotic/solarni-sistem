#version 300 es
precision highp float;

in vec3 in_position;
in vec2 in_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec2 v_texcoord;

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
  gl_Position = u_projection * u_view * u_model * vec4(in_position, 1.0);
  v_texcoord = in_texcoord;

  vTexCoord = aTexCoord;
    vNormal = mat3(transpose(inverse(uModelMatrix))) * aNormal;
    vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));
    vLightDir = uLightPosition - vFragPos;
    vViewDir = uViewPosition - vFragPos;
    
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
