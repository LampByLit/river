// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
const canvas = document.getElementById('glcanvas');
if (!canvas) {
	console.error('Canvas element not found');
	return;
}

const gl = canvas.getContext('webgl', { alpha: true });
if(!gl){
	alert('WebGL not supported');
	return;
}

// Enable transparency
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// Set canvas size to match viewport
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouseX = 0;
let mouseY = 0;
let isHovering = false;

// Hover effect variables
canvas.addEventListener('mousemove', (e) => {
	const rect = canvas.getBoundingClientRect();
	mouseX = (e.clientX - rect.left) / rect.width;
	mouseY = 1.0 - (e.clientY - rect.top) / rect.height; // Invertir Y
	isHovering = true;
});

canvas.addEventListener('mouseleave', () => {
	isHovering = false;
});

function compileShader(src, type){
	const s = gl.createShader(type);
	gl.shaderSource(s, src);
	gl.compileShader(s);
	if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
		console.error(gl.getShaderInfoLog(s));
	}
	return s;
}

const vertexShaderSource = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main(){
    v_uv = a_uv;
    gl_Position = vec4(a_pos,0.0,1.0);
}`;

const fragmentShaderSource = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_text;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_hover;

float random(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}  
float noise(vec2 st){
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i+vec2(1.0,0.0));
    float c = random(i+vec2(0.0,1.0));
    float d = random(i+vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}

void main(){
// Correct UV coordinates so text isn't flipped
vec2 correctedUV = vec2(v_uv.x, 1.0 - v_uv.y);

// Base melting effect
float n = noise(vec2(correctedUV.x*5.0,(correctedUV.y*2.0 - u_time*0.2)*2.0));
float melt = n*0.4*(correctedUV.y);

// Controlled hover effect - smooth elegant waves
float dist = distance(correctedUV, u_mouse);
float hoverWave1 = sin(dist * 12.0 - u_time * 2.0) * 0.08 * u_hover * exp(-dist * 3.5);
float hoverWave2 = sin(dist * 20.0 - u_time * 3.5) * 0.04 * u_hover * exp(-dist * 5.0);
float hoverWave = hoverWave1 + hoverWave2;

// Controlled magnetic distortion effect
vec2 hoverDistort = normalize(correctedUV - u_mouse) * hoverWave * (1.0 + sin(u_time * 0.7) * 0.1);

// Combine effects
vec2 finalUV = vec2(
    correctedUV.x + melt*0.3 + hoverDistort.x, 
    correctedUV.y - melt*0.8 + hoverDistort.y
);

vec4 col = texture2D(u_text, finalUV);

// Use solid text color #c4d5bc (RGB: 196, 213, 188)
if(col.a > 0.1){
    float glow = smoothstep(0.5,1.0,col.a);
    vec3 textColor = vec3(0.768, 0.835, 0.737); // #c4d5bc

    // Subtle hover glow effect
    if(u_hover > 0.1){
        float hoverIntensity = 1.0 - smoothstep(0.0, 0.3, dist);
        glow += hoverIntensity * u_hover * 0.3;
    }

    col.rgb = mix(col.rgb, textColor, 0.8);

    // Subtle sparkle effect on hover
    if(u_hover > 0.1){
        float sparkles = noise(correctedUV * 30.0 + u_time * 1.3);
        if(sparkles > 0.92 && dist < 0.15){
            col.rgb += vec3(0.768, 0.835, 0.737) * (sparkles - 0.92) * 3.0 * u_hover;
        }
    }
}

// Subtle ambient glow on hover
if(u_hover > 0.1){
    float ambientGlow = 1.0 - smoothstep(0.0, 0.4, dist);
    vec3 auraColor = vec3(0.768, 0.835, 0.737) * 0.3;
    col.rgb += auraColor * ambientGlow * u_hover * 0.5;
}

// Wave fade effect that moves across the text
float wavePosition = correctedUV.x * 2.0 - 1.0;
float waveOffset = sin(wavePosition * 3.14159 + u_time * 0.7) * 0.5 + 0.5;
float localOpacity = mix(0.3, 1.0, waveOffset);
col.a *= localOpacity;
gl_FragColor = col;
}`;

const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);

const quad = new Float32Array([
	-1, -1, 0, 0,
	1, -1, 1, 0,
	-1,  1, 0, 1,
	1,  1, 1, 1
]);
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

const a_pos = gl.getAttribLocation(program, 'a_pos');
const a_uv = gl.getAttribLocation(program, 'a_uv');

gl.enableVertexAttribArray(a_pos);
gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 16, 0);
gl.enableVertexAttribArray(a_uv);
gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 16, 8);

const u_time = gl.getUniformLocation(program, 'u_time');
const u_text = gl.getUniformLocation(program, 'u_text');
const u_mouse = gl.getUniformLocation(program, 'u_mouse');
const u_hover = gl.getUniformLocation(program, 'u_hover');

// Create text canvas matching viewport dimensions
const textCanvas = document.createElement('canvas');
const tctx = textCanvas.getContext('2d');
textCanvas.width = window.innerWidth;
textCanvas.height = window.innerHeight;

// Calculate font size based on canvas (smaller)
const fontSize = Math.min(textCanvas.width / 14, 100);
tctx.fillStyle = '#c4d5bc';
tctx.font = 'bold ' + fontSize + 'px Helvetica, Arial, sans-serif';
tctx.textAlign = 'center';
tctx.textBaseline = 'middle';

// Draw two lines of text
const line1 = 'REFLECTIONS';
const line2 = 'RIVER RETREAT';
const centerX = textCanvas.width / 2;
const centerY = textCanvas.height * 0.4; // Move up (40% from top instead of 50%)
const lineHeight = fontSize * 1.2;

tctx.fillText(line1, centerX, centerY - lineHeight / 2);
tctx.fillText(line2, centerX, centerY + lineHeight / 2);

const textTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, textTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);

// Smooth hover transition
let hoverValue = 0;
const hoverSpeed = 0.05;

// Fade in/out animation speed
const fadeSpeed = 0.0008;

function draw(t){
	// Smooth hover effect
	if(isHovering && hoverValue < 1.0){
		hoverValue = Math.min(1.0, hoverValue + hoverSpeed);
	} else if(!isHovering && hoverValue > 0.0){
		hoverValue = Math.max(0.0, hoverValue - hoverSpeed);
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent background
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);

	gl.uniform1f(u_time, t * 0.001);
	gl.uniform2f(u_mouse, mouseX, mouseY);
	gl.uniform1f(u_hover, hoverValue);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textTex);
	gl.uniform1i(u_text, 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	requestAnimationFrame(draw);
}

// Handle window resize
window.addEventListener('resize', function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// Recreate text canvas with new size
	textCanvas.width = Math.max(window.innerWidth, 1600);
	textCanvas.height = Math.max(window.innerHeight, 600);
	
	const fontSize = Math.min(textCanvas.width / 14, 100);
	tctx.fillStyle = '#c4d5bc';
	tctx.font = 'bold ' + fontSize + 'px Helvetica, Arial, sans-serif';
	tctx.textAlign = 'center';
	tctx.textBaseline = 'middle';
	
	const centerX = textCanvas.width / 2;
	const centerY = textCanvas.height * 0.4; // Move up (40% from top instead of 50%)
	const lineHeight = fontSize * 1.2;
	
	tctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
	tctx.fillText(line1, centerX, centerY - lineHeight / 2);
	tctx.fillText(line2, centerX, centerY + lineHeight / 2);
	
	// Update texture
	gl.bindTexture(gl.TEXTURE_2D, textTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
});

requestAnimationFrame(draw);

}); // End DOMContentLoaded
