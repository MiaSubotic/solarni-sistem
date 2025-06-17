#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_sampler;
uniform vec4 u_color;
uniform int u_selected;
uniform int u_is_planet;
uniform int u_is_sun;

out vec4 fragColor;

void main() {
    if (u_is_sun == 1) {
        // Poseban tretman za sunce
        fragColor = texture(u_sampler, v_texcoord);
    } 
    else if (u_is_planet == 1) {
        // Za planete
        fragColor = texture(u_sampler, v_texcoord) * u_color;
        
        // Efekat selektovane planete
        if (u_selected == 1) {
            fragColor.rgb *= 1.5;
            float edge = smoothstep(0.4, 0.5, 
                max(abs(v_texcoord.x - 0.5), abs(v_texcoord.y - 0.5)));
            fragColor.rgb = mix(fragColor.rgb, vec3(1.0), edge);
        }
    } 
    else {
        // Za orbite
        fragColor = u_color;
        
        // Efekat selektovane orbite
        if (u_selected == 1) {
            fragColor.rgb *= 1.3;
        }
    }
}