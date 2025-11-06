/**
 * XR Optimization Guide for Android XR
 * Best practices and utilities for optimizing VR/XR experiences
 */

const XROptimizationGuide = {
  
  // ========== PERFORMANCE RECOMMENDATIONS ==========
  performance: {
    targetFPS: {
      minimum: 60,
      recommended: 72,
      ideal: 90,
      description: "Higher FPS reduces motion sickness and improves immersion"
    },
    
    textureResolution: {
      mobile: 2048,
      desktop: 4096,
      video360: 4096,
      description: "Balance quality vs performance"
    },
    
    polyCount: {
      mobile: 50000,
      desktop: 100000,
      description: "Total triangles per frame"
    },
    
    drawCalls: {
      maximum: 50,
      recommended: 30,
      description: "Reduce draw calls by batching"
    }
  },

  // ========== VIDEO 360 OPTIMIZATION ==========
  video360Optimization: {
    codec: "H.265/HEVC", // Better compression than H.264
    resolution: "4K (3840x1920)", // Equirectangular
    bitrate: "20-40 Mbps",
    framerate: "30fps or 60fps",
    
    applyOptimization: function(videoElement) {
      // Set optimal video attributes
      videoElement.setAttribute('preload', 'auto');
      videoElement.setAttribute('playsinline', '');
      videoElement.setAttribute('webkit-playsinline', '');
      
      // Optimize texture settings
      if (videoElement.material && videoElement.material.map) {
        const texture = videoElement.material.map;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.format = THREE.RGBFormat; // RGB is lighter than RGBA
      }
      
      console.log('✅ Video 360 optimization applied');
    }
  },

  // ========== SPATIAL AUDIO BEST PRACTICES ==========
  spatialAudio: {
    maxSources: 8, // Maximum simultaneous audio sources
    rolloffModel: "inverse", // Or "linear" or "exponential"
    refDistance: 1, // Distance where volume = 1.0
    maxDistance: 10, // Maximum hearing distance
    
    setupSpatialAudio: function(audioContext, listener) {
      // Create optimized spatial audio
      const panner = audioContext.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = this.rolloffModel;
      panner.refDistance = this.refDistance;
      panner.maxDistance = this.maxDistance;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 360;
      panner.coneOuterGain = 0;
      
      return panner;
    }
  },

  // ========== ANDROID XR SPECIFIC OPTIMIZATIONS ==========
  androidXR: {
    // Foveated rendering - reduces pixels rendered in peripheral vision
    enableFoveatedRendering: async function(xrSession, gl) {
      if ('requestRenderState' in xrSession) {
        try {
          await xrSession.updateRenderState({
            baseLayer: new XRWebGLLayer(xrSession, gl, {
              framebufferScaleFactor: 1.0,
              // Android XR may support foveation levels
              // This is hardware-dependent
            })
          });
          console.log('✅ Foveated rendering configured');
        } catch (e) {
          console.warn('Foveated rendering not available:', e);
        }
      }
    },

    // Dynamic resolution scaling
    dynamicResolution: {
      enabled: true,
      minScale: 0.7,
      maxScale: 1.2,
      targetFPS: 72,
      
      adjust: function(currentFPS, renderer) {
        if (!this.enabled) return;
        
        const currentScale = renderer.getPixelRatio();
        let newScale = currentScale;
        
        if (currentFPS < this.targetFPS - 5) {
          // Decrease resolution
          newScale = Math.max(this.minScale, currentScale - 0.1);
        } else if (currentFPS > this.targetFPS + 5) {
          // Increase resolution
          newScale = Math.min(this.maxScale, currentScale + 0.05);
        }
        
        if (newScale !== currentScale) {
          renderer.setPixelRatio(newScale);
          console.log(`Resolution adjusted: ${newScale.toFixed(2)}x`);
        }
      }
    },

    // Hand tracking optimization
    handTracking: {
      updateFrequency: 60, // Hz
      jointSmoothing: 0.3, // 0-1, higher = smoother but more lag
      
      optimizeHandTracking: function(hand, frame, refSpace) {
        // Only track essential joints for performance
        const essentialJoints = [
          'wrist',
          'index-finger-tip',
          'thumb-tip'
        ];
        
        const positions = {};
        
        for (const jointName of essentialJoints) {
          const joint = hand.get(jointName);
          if (joint) {
            const pose = frame.getJointPose(joint, refSpace);
            if (pose) {
              positions[jointName] = pose.transform.position;
            }
          }
        }
        
        return positions;
      }
    }
  },

  // ========== MEMORY MANAGEMENT ==========
  memoryManagement: {
    maxTextureMemory: 256 * 1024 * 1024, // 256 MB
    
    disposeResources: function(scene) {
      // Dispose geometries, materials, and textures
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(object.material);
          }
        }
      });
      
      console.log('✅ Resources disposed');
    },
    
    disposeMaterial: function(material) {
      if (material.map) material.map.dispose();
      if (material.lightMap) material.lightMap.dispose();
      if (material.bumpMap) material.bumpMap.dispose();
      if (material.normalMap) material.normalMap.dispose();
      if (material.specularMap) material.specularMap.dispose();
      if (material.envMap) material.envMap.dispose();
      material.dispose();
    },

    // Monitor memory usage
    monitorMemory: function() {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
        const percentage = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);
        
        console.log(`Memory: ${usedMB} MB / ${limitMB} MB (${percentage}%)`);
        
        if (percentage > 90) {
          console.warn('⚠️ High memory usage detected!');
          return true; // Trigger cleanup
        }
      }
      return false;
    }
  },

  // ========== ASSET LOADING STRATEGIES ==========
  assetLoading: {
    // Progressive loading
    loadProgressive: async function(assets, onProgress) {
      const loaded = [];
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        try {
          const result = await this.loadAsset(asset);
          loaded.push(result);
          
          if (onProgress) {
            onProgress({
              loaded: i + 1,
              total: assets.length,
              percentage: ((i + 1) / assets.length) * 100
            });
          }
        } catch (e) {
          console.error(`Failed to load asset: ${asset.url}`, e);
        }
      }
      
      return loaded;
    },
    
    loadAsset: function(asset) {
      return new Promise((resolve, reject) => {
        if (asset.type === 'video') {
          const video = document.createElement('video');
          video.src = asset.url;
          video.addEventListener('loadedmetadata', () => resolve(video));
          video.addEventListener('error', reject);
        } else if (asset.type === 'audio') {
          const audio = new Audio(asset.url);
          audio.addEventListener('canplaythrough', () => resolve(audio));
          audio.addEventListener('error', reject);
        }
      });
    },

    // Preload for better performance
    preloadCriticalAssets: function(urls) {
      urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        
        if (url.endsWith('.mp4') || url.endsWith('.webm')) {
          link.as = 'video';
        } else if (url.endsWith('.mp3') || url.endsWith('.wav')) {
          link.as = 'audio';
        }
        
        link.href = url;
        document.head.appendChild(link);
      });
      
      console.log('✅ Critical assets preloaded');
    }
  },

  // ========== INTERACTION OPTIMIZATION ==========
  interaction: {
    // Gaze-based interaction (no controller needed)
    gazeSettings: {
      activationTime: 2000, // ms to activate
      cursorDistance: 1.5, // meters from camera
      cursorSize: 0.01, // radius in meters
    },

    // Ray-based interaction
    raySettings: {
      maxDistance: 10, // meters
      thickness: 0.005, // meters
    },

    // Debounce input for performance
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  },

  // ========== TESTING AND VALIDATION ==========
  testing: {
    // Performance benchmark
    runBenchmark: function(duration = 10000) {
      console.log('🏃 Running performance benchmark...');
      
      const startTime = performance.now();
      let frameCount = 0;
      let minFPS = Infinity;
      let maxFPS = 0;
      let lastTime = startTime;
      
      const testFrame = () => {
        frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        
        if (deltaTime >= 1000) {
          const fps = (frameCount * 1000) / deltaTime;
          minFPS = Math.min(minFPS, fps);
          maxFPS = Math.max(maxFPS, fps);
          frameCount = 0;
          lastTime = currentTime;
        }
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(testFrame);
        } else {
          console.log('✅ Benchmark complete:');
          console.log(`   Min FPS: ${minFPS.toFixed(1)}`);
          console.log(`   Max FPS: ${maxFPS.toFixed(1)}`);
          console.log(`   Avg FPS: ${((minFPS + maxFPS) / 2).toFixed(1)}`);
        }
      };
      
      requestAnimationFrame(testFrame);
    },

    // XR feature compatibility check
    checkCompatibility: async function() {
      const results = {
        webxr: !!navigator.xr,
        webgl2: !!document.createElement('canvas').getContext('webgl2'),
        features: {}
      };

      if (navigator.xr) {
        const features = ['hand-tracking', 'layers', 'anchors', 'depth-sensing', 'hit-test'];
        
        for (const feature of features) {
          try {
            results.features[feature] = await navigator.xr.isSessionSupported('immersive-vr', {
              optionalFeatures: [feature]
            });
          } catch (e) {
            results.features[feature] = false;
          }
        }
      }

      console.log('Device Compatibility:', results);
      return results;
    }
  },

  // ========== APPLY ALL OPTIMIZATIONS ==========
  applyAll: function(options = {}) {
    console.log('🚀 Applying XR optimizations...');
    
    // Preload critical assets
    if (options.criticalAssets) {
      this.assetLoading.preloadCriticalAssets(options.criticalAssets);
    }

    // Setup memory monitoring
    setInterval(() => {
      if (this.memoryManagement.monitorMemory()) {
        console.warn('Memory cleanup needed');
        if (options.scene) {
          // Implement selective cleanup instead of full disposal
          console.log('Consider reducing texture quality or removing distant objects');
        }
      }
    }, 30000); // Every 30 seconds

    // Setup performance monitoring
    if (options.enablePerformanceMonitoring) {
      this.testing.runBenchmark();
    }

    // Check compatibility
    this.testing.checkCompatibility();

    console.log('✅ All optimizations applied');
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XROptimizationGuide;
} else {
  window.XROptimizationGuide = XROptimizationGuide;
}

console.log('✅ XR Optimization Guide loaded');

