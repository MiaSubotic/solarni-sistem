#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_sampler;
uniform vec4 u_color;

out vec4 outColor;

in vec3 vNormal;
in vec3 vFragPos;
in vec3 vLightDir;
in vec3 vViewDir;
in vec2 vTexCoord;

uniform vec3 uLightColor;
uniform vec3 uObjectColor;
uniform float uShininess;
uniform float uAmbientStrength;
uniform float uSpecularStrength;

out vec4 fragColor;

void main() {
  outColor = texture(u_sampler, v_texcoord) * u_color;

  vec3 ambient = uAmbientStrength * uLightColor;
    
    // Diffuse
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(vLightDir);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor;
    
    // Specular
    vec3 viewDir = normalize(vViewDir);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = uSpecularStrength * spec * uLightColor;
    
    // Combine results
    vec3 result = (ambient + diffuse + specular) * uObjectColor;
    fragColor = vec4(result, 1.0);
}