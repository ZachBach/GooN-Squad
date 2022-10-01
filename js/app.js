import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import VirtualScroll from 'virtual-scroll';
// import GUI from 'lil-gui';
// import gsap from "gsap";

// Fonts
import { MSDFTextGeometry, MSDFTextMaterial, uniforms } from "three-msdf-text";
import fnt from '../font/zookahs-msdf.json';
import atlasURL from '../font/zookahs.png';


const TEXT = [
  'ZooKaH',
  'fayze',
  'MATTAKAICEMAN',
  'The Treemiester',
  'DAFFODILRAT',
  'Reddshinobi',
  'QUBX',
  'STLfromHell67',


].reverse();

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.group = new THREE.Group();
    this.groupPlane = new THREE.Group();
    this.scene.add(this.group);
    this.scene.add(this.groupPlane);

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio, 2);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    // scroller values and speed of scroll
    this.position = 0
    this.speed = 0
    this.targetSpeed = 0
    this.scroller = new VirtualScroll()
    this.scroller.on(event => {
	    // wrapper.style.transform = `translateY(${event.y}px)`
      this.position = event.y/2000
      this.speed = event.deltaY/1000
    });

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoloader = new DRACOLoader();
    this.dracoloader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/dracos/')
    this.gltf = new GLTFLoader();
    this.gltf.setDRACOLoader(this.dracoloader);

    this.isPlaying = true;
    
    this.addObjects();
    this.addTexts();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.imageAspect = 853/1280;
    let a1; let a2;
    

    // this.material.uniforms.resolution.value.x = this.width;
    // this.material.uniforms.resolution.value.y = this.height;
    // this.material.uniforms.resolution.value.z = a1;
    // this.material.uniforms.resolution.value.w = a2;

    this.camera.updateProjectionMatrix();
  }

  addTexts() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      defines: {
          IS_SMALL: false,
      },
      extensions: {
          derivatives: true,
      },
      uniforms: {
        uSpeed : { value: 0 },
          // Common
          ...uniforms.common,
          
          // Rendering
          ...uniforms.rendering,
          
          // Strokes
          ...uniforms.strokes,
      },
      vertexShader: `
          // Attribute
          #include <three_msdf_attributes>
  
          // Varyings
          #include <three_msdf_varyings>
          

          mat4 rotationMatrix(vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
            
            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0);
          }
        
          vec3 rotate(vec3 v, vec3 axis, float angle) {
          mat4 m = rotationMatrix(axis, angle);
          return (m * vec4(v, 1.0)).xyz;
          } 

          uniform float uSpeed;
  
          void main() {


            // Varyings
            vUv = uv;
            vLayoutUv = layoutUv;
            vNormal = normal;
            
            vLineIndex = lineIndex;
            
            vLineLettersTotal = lineLettersTotal;
            vLineLetterIndex = lineLetterIndex;
            
            vLineWordsTotal = lineWordsTotal;
            vLineWordIndex = lineWordIndex;
            
            vWordIndex = wordIndex;
            
            vLetterIndex = letterIndex;

            // Output
            vec3 newpos = position;

            float xx = position.x*.005;
            newpos = rotate(newpos, vec3(.0, 0.0, 1.0), uSpeed*xx*xx*xx);

            vec4 mvPosition = vec4(newpos, 1.0);
            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;

            vViewPosition = -mvPosition.xyz;
          }
      `,
      fragmentShader: `
          // Varyings
          #include <three_msdf_varyings>
  
          // Uniforms
          #include <three_msdf_common_uniforms>
          #include <three_msdf_strokes_uniforms>
  
          // Utils
          #include <three_msdf_median>
  
          void main() {
              // Common
              #include <three_msdf_common>
  
              // Strokes
              #include <three_msdf_strokes>
  
              // Alpha Test
              #include <three_msdf_alpha_test>
  
              // Outputs
              #include <three_msdf_strokes_output>


              gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
      `,
  });

  // start of promise for three-msdf-text

      Promise.all([loadFontAtlas(atlasURL),]).then(([atlas]) => {

        this.size = 0.2;

        this.material.uniforms.uMap.value = atlas;
        TEXT.forEach((text, i) => { 
            const geometry = new MSDFTextGeometry({
            text: text.toUpperCase(),
            font: fnt,
        });
      
    
      this.material.uniforms.uMap.value = atlas;
    
      const mesh = new THREE.Mesh(geometry, this.material);

      let s = 0.005;
      mesh.scale.set(s, -s, s);
      mesh.position.x = -0.9;
      mesh.position.y = this.size*i;
      


      this.group.add(mesh);
    });

  });
  
      function loadFontAtlas(path) {
      const promise = new Promise((resolve, reject) => {
          const loader = new THREE.TextureLoader();
          loader.load(path, resolve);
      });
  
      return promise;
    }
  }

  addObjects() {
    let that = this;
    this.planematerial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1)
        }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.PlaneGeometry(1.77, 1, 1, 1).translate(0, 0, 1);

    this.plane = new THREE.Mesh(this.geometry, this.planematerial);
    this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.speed *= 0.9
    this.targetSpeed += (this.speed-this.targetSpeed)*0.1
    this.material.uniforms.uSpeed.value = this.targetSpeed;
    this.group.position.y = -this.position;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});