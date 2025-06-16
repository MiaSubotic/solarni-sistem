precision highp float;

in vec3 in_position;
in vec2 in_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec2 v_texcoord;

void main() {
    v_texcoord = in_texcoord;
    
    // Kombinirana matrica transformacija (slično kao u saradnikovoj verziji, ali razdvojena)
    mat4 mvp = u_projection * u_view * u_model;
    gl_Position = mvp * vec4(in_position, 1.0);
    
    // Alternativno možete koristiti i oblik iz HEAD verzije:
    // gl_Position = u_projection * u_view * u_model * vec4(in_position, 1.0);
}