// Renderizador + pós-processamento (bloom, vinheta, granulação, aberração cromática).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.06 },
    vignette: { value: 1.15 },
    aberration: { value: 0.0018 },
    fear: { value: 0 },        // 0..1 aumenta distorção
    flash: { value: 0 },       // relâmpago / susto
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, vignette, aberration, fear, flash;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*7.13) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float wob = fear * 0.004 * sin(time*3.0 + uv.y*20.0);
      uv.x += wob;
      float ab = aberration * (1.0 + fear*3.0) * length(c) * 2.0;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c*ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c*ab).b;
      // grade de cor: sombras frias, médios quentes
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(col, col * vec3(0.86,0.93,1.08), smoothstep(0.25, 0.0, l) * 0.6);
      col = mix(vec3(l), col, 0.88 - fear*0.3);
      // vinheta
      float v = smoothstep(0.85, 0.2, length(c) * vignette * (1.0 + fear*0.25));
      col *= mix(0.25, 1.0, v);
      // granulação
      float n = hash(uv * vec2(1920.0, 1080.0)) - 0.5;
      col += n * grain * (1.0 + fear);
      col += flash * vec3(0.75, 0.8, 0.95);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020202);
  scene.fog = new THREE.FogExp2(0x050403, 0.06);

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.03, 120);
  scene.add(camera);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.45, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass(FilmShader);
  composer.addPass(film);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  return { renderer, scene, camera, composer, bloom, film };
}
