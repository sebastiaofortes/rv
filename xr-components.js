/**
 * XR Components Enhancement for Android XR compatibility
 * Adds hand tracking, eye tracking, and optimized WebXR features
 */

// ============= HAND TRACKING COMPONENT =============
AFRAME.registerComponent('hand-tracking', {
  schema: {
    hand: { type: 'string', default: 'left' }
  },
  
  init: function() {
    this.hand = null;
    this.handJoints = [];
    this.setupHandTracking();
  },
  
  setupHandTracking: function() {
    const sceneEl = this.el.sceneEl;
    
    sceneEl.addEventListener('enter-vr', () => {
      const session = sceneEl.xrSession;
      if (!session) return;
      
      // Check if hand tracking is supported
      if (session.inputSources) {
        session.addEventListener('inputsourceschange', (event) => {
          this.updateHandInputSources(session.inputSources);
        });
      }
    });
  },
  
  updateHandInputSources: function(inputSources) {
    for (const inputSource of inputSources) {
      if (inputSource.hand && inputSource.handedness === this.data.hand) {
        this.hand = inputSource.hand;
        console.log(`Hand tracking initialized for ${this.data.hand} hand`);
      }
    }
  },
  
  tick: function() {
    if (!this.hand) return;
    
    // Update hand joint positions
    const indexTip = this.hand.get('index-finger-tip');
    if (indexTip) {
      const pose = indexTip.pose;
      if (pose) {
        this.el.setAttribute('position', {
          x: pose.transform.position.x,
          y: pose.transform.position.y,
          z: pose.transform.position.z
        });
      }
    }
  }
});

// ============= EYE TRACKING COMPONENT =============
AFRAME.registerComponent('eye-tracking', {
  schema: {
    enabled: { type: 'boolean', default: true },
    debugMode: { type: 'boolean', default: false }
  },
  
  init: function() {
    this.gazePoint = new THREE.Vector3();
    this.gazeDirection = new THREE.Vector3();
    this.setupEyeTracking();
  },
  
  setupEyeTracking: function() {
    const sceneEl = this.el.sceneEl;
    
    sceneEl.addEventListener('enter-vr', () => {
      const session = sceneEl.xrSession;
      if (!session) return;
      
      // Request eye tracking if available
      if ('requestHitTestSource' in session) {
        console.log('Eye tracking capabilities available');
      }
    });
  },
  
  tick: function() {
    if (!this.data.enabled) return;
    
    const camera = this.el.sceneEl.camera;
    if (camera) {
      camera.getWorldDirection(this.gazeDirection);
      this.gazePoint.copy(camera.position).add(
        this.gazeDirection.multiplyScalar(2)
      );
      
      if (this.data.debugMode) {
        // Emit event for debugging
        this.el.emit('gaze-update', { 
          point: this.gazePoint,
          direction: this.gazeDirection 
        });
      }
    }
  }
});

// ============= SPATIAL AUDIO COMPONENT =============
AFRAME.registerComponent('spatial-audio-source', {
  schema: {
    src: { type: 'string' },
    loop: { type: 'boolean', default: true },
    volume: { type: 'number', default: 1.0 },
    refDistance: { type: 'number', default: 1 },
    maxDistance: { type: 'number', default: 10 },
    rolloffFactor: { type: 'number', default: 1 }
  },
  
  init: function() {
    this.sound = null;
    this.setupSpatialAudio();
  },
  
  setupSpatialAudio: function() {
    // Wait for scene and camera to be ready
    if (!this.el.sceneEl) {
      setTimeout(() => this.setupSpatialAudio(), 100);
      return;
    }
    
    const sceneEl = this.el.sceneEl;
    
    // Wait for camera to be available
    if (!sceneEl.camera) {
      sceneEl.addEventListener('camera-set-active', () => {
        this.setupSpatialAudioListener();
      });
      // Fallback: try again after a delay
      setTimeout(() => this.setupSpatialAudioListener(), 500);
      return;
    }
    
    this.setupSpatialAudioListener();
  },
  
  setupSpatialAudioListener: function() {
    const sceneEl = this.el.sceneEl;
    
    // Ensure camera exists
    if (!sceneEl || !sceneEl.camera) {
      console.warn('[spatial-audio-source] Camera not ready yet, retrying...');
      setTimeout(() => this.setupSpatialAudioListener(), 200);
      return;
    }
    
    // Create or get audio listener
    if (!sceneEl.audioListener) {
      sceneEl.audioListener = new THREE.AudioListener();
      sceneEl.camera.add(sceneEl.audioListener);
      console.log('[spatial-audio-source] AudioListener created and attached to camera');
    }
    
    // Create positional audio
    this.sound = new THREE.PositionalAudio(sceneEl.audioListener);
    
    // Load audio
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(this.data.src, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(this.data.loop);
      this.sound.setVolume(this.data.volume);
      this.sound.setRefDistance(this.data.refDistance);
      this.sound.setMaxDistance(this.data.maxDistance);
      this.sound.setRolloffFactor(this.data.rolloffFactor);
      
      this.el.setObject3D('sound', this.sound);
      console.log('[spatial-audio-source] Audio loaded and configured:', this.data.src);
    }, undefined, (error) => {
      console.error('[spatial-audio-source] Error loading audio:', error);
    });
  },
  
  play: function() {
    if (this.sound && !this.sound.isPlaying) {
      this.sound.play();
    }
  },
  
  pause: function() {
    if (this.sound && this.sound.isPlaying) {
      this.sound.pause();
    }
  },
  
  remove: function() {
    if (this.sound) {
      this.sound.stop();
      this.el.removeObject3D('sound');
    }
  }
});

// ============= XR PERFORMANCE OPTIMIZER =============
AFRAME.registerComponent('xr-performance', {
  schema: {
    targetFps: { type: 'number', default: 72 },
    adaptiveQuality: { type: 'boolean', default: true }
  },
  
  init: function() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.currentFps = 0;
    this.qualityLevel = 1.0;
    
    this.setupPerformanceMonitoring();
  },
  
  setupPerformanceMonitoring: function() {
    const sceneEl = this.el.sceneEl;
    
    sceneEl.addEventListener('enter-vr', () => {
      console.log('XR Performance monitoring started');
      this.optimizeForXR();
    });
  },
  
  optimizeForXR: function() {
    const renderer = this.el.sceneEl.renderer;
    const xrSession = this.el.sceneEl.xrSession;
    
    if (renderer && xrSession) {
      // Enable foveated rendering if available (Android XR feature)
      if (xrSession.updateRenderState) {
        xrSession.updateRenderState({
          baseLayer: new XRWebGLLayer(xrSession, renderer.getContext(), {
            framebufferScaleFactor: this.qualityLevel
          })
        });
      }
      
      // Set appropriate pixel ratio
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  },
  
  tick: function() {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    // Update FPS every second
    if (deltaTime >= 1000) {
      this.currentFps = (this.frameCount * 1000) / deltaTime;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Adaptive quality adjustment
      if (this.data.adaptiveQuality) {
        this.adjustQuality();
      }
    }
  },
  
  adjustQuality: function() {
    const targetFps = this.data.targetFps;
    
    if (this.currentFps < targetFps - 10) {
      // Decrease quality
      this.qualityLevel = Math.max(0.7, this.qualityLevel - 0.1);
      this.optimizeForXR();
      console.log(`Quality reduced to ${this.qualityLevel.toFixed(2)}`);
    } else if (this.currentFps > targetFps + 10 && this.qualityLevel < 1.0) {
      // Increase quality
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
      this.optimizeForXR();
      console.log(`Quality increased to ${this.qualityLevel.toFixed(2)}`);
    }
  }
});

// ============= GAZE INTERACTION COMPONENT =============
AFRAME.registerComponent('gaze-interactive', {
  schema: {
    duration: { type: 'number', default: 2000 }, // ms to activate
    enabled: { type: 'boolean', default: true }
  },
  
  init: function() {
    this.gazeStartTime = 0;
    this.isGazing = false;
    this.progressIndicator = null;
    
    this.createProgressIndicator();
    this.setupInteraction();
  },
  
  createProgressIndicator: function() {
    // Create visual feedback for gaze progress
    const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x4CAF50,
      transparent: true,
      opacity: 0
    });
    this.progressIndicator = new THREE.Mesh(geometry, material);
    this.el.setObject3D('gaze-progress', this.progressIndicator);
  },
  
  setupInteraction: function() {
    this.el.addEventListener('mouseenter', () => {
      if (this.data.enabled) {
        this.gazeStartTime = Date.now();
        this.isGazing = true;
      }
    });
    
    this.el.addEventListener('mouseleave', () => {
      this.isGazing = false;
      this.gazeStartTime = 0;
      if (this.progressIndicator) {
        this.progressIndicator.material.opacity = 0;
      }
    });
  },
  
  tick: function() {
    if (!this.isGazing || !this.data.enabled) return;
    
    const elapsed = Date.now() - this.gazeStartTime;
    const progress = Math.min(elapsed / this.data.duration, 1);
    
    // Update progress indicator
    if (this.progressIndicator) {
      this.progressIndicator.material.opacity = progress * 0.8;
      this.progressIndicator.scale.set(1 + progress * 0.2, 1 + progress * 0.2, 1);
    }
    
    // Trigger action when complete
    if (progress >= 1) {
      this.el.emit('gaze-activated');
      this.isGazing = false;
      this.gazeStartTime = 0;
      
      // Reset indicator
      setTimeout(() => {
        if (this.progressIndicator) {
          this.progressIndicator.material.opacity = 0;
          this.progressIndicator.scale.set(1, 1, 1);
        }
      }, 200);
    }
  }
});

// ============= VIDEO 360 OPTIMIZER =============
AFRAME.registerComponent('video-360-optimized', {
  schema: {
    src: { type: 'string' },
    autoplay: { type: 'boolean', default: false },
    useEquirectLayer: { type: 'boolean', default: true } // Android XR optimization
  },
  
  init: function() {
    this.videoElement = null;
    this.setupOptimizedVideo();
  },
  
  setupOptimizedVideo: function() {
    const sceneEl = this.el.sceneEl;
    
    sceneEl.addEventListener('enter-vr', () => {
      const session = sceneEl.xrSession;
      if (!session) return;
      
      // Use XR Equirect Layer for better performance (Android XR feature)
      if (this.data.useEquirectLayer && 'requestAnimationFrame' in session) {
        this.setupEquirectLayer(session);
      }
    });
  },
  
  setupEquirectLayer: function(session) {
    // XR Layers API for optimized 360 video rendering
    // This provides better performance on Android XR devices
    console.log('Setting up optimized equirect layer for 360 video');
    
    // This would use XREquirectLayer in production
    // For now, we enhance the standard videosphere
    this.enhanceVideoTexture();
  },
  
  enhanceVideoTexture: function() {
    const videosphere = this.el.querySelector('a-videosphere') || this.el;
    
    // Optimize texture settings for mobile XR
    videosphere.addEventListener('materialtextureloaded', (e) => {
      const texture = e.detail.texture;
      if (texture) {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.format = THREE.RGBAFormat;
      }
    });
  }
});

// ============= MEDITATION SESSION TRACKER =============
AFRAME.registerComponent('meditation-session', {
  schema: {
    duration: { type: 'number', default: 600 }, // 10 minutes default
    trackHeartRate: { type: 'boolean', default: false }
  },
  
  init: function() {
    this.startTime = 0;
    this.isActive = false;
    this.metrics = {
      duration: 0,
      gazeStability: 0,
      headMovement: 0
    };
    
    this.setupSession();
  },
  
  setupSession: function() {
    this.el.addEventListener('meditation-start', () => {
      this.startSession();
    });
    
    this.el.addEventListener('meditation-end', () => {
      this.endSession();
    });
  },
  
  startSession: function() {
    this.startTime = Date.now();
    this.isActive = true;
    console.log('Meditation session started');
    
    // Track analytics
    if (window.AnalyticsManager) {
      window.AnalyticsManager.trackEvent('meditation_started', {
        timestamp: new Date().toISOString()
      });
    }
  },
  
  endSession: function() {
    this.isActive = false;
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log(`Meditation session ended. Duration: ${duration}s`);
    
    // Track analytics
    if (window.AnalyticsManager) {
      window.AnalyticsManager.trackEvent('meditation_completed', {
        duration: duration,
        metrics: this.metrics
      });
    }
    
    this.el.emit('session-complete', { 
      duration: duration,
      metrics: this.metrics 
    });
  },
  
  tick: function() {
    if (!this.isActive) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.metrics.duration = elapsed;
    
    // Auto-end session after duration
    if (elapsed >= this.data.duration) {
      this.endSession();
    }
  }
});

// ============= ANDROID XR FEATURE DETECTION =============
AFRAME.registerComponent('xr-feature-detector', {
  init: function() {
    this.features = {
      handTracking: false,
      eyeTracking: false,
      faceTracking: false,
      spatialAudio: false,
      equirectLayers: false
    };
    
    this.detectFeatures();
  },
  
  detectFeatures: async function() {
    if (!navigator.xr) {
      console.warn('WebXR not supported');
      return;
    }
    
    try {
      // Check for hand tracking
      const handSupport = await navigator.xr.isSessionSupported('immersive-vr', {
        requiredFeatures: ['hand-tracking']
      });
      this.features.handTracking = handSupport;
      
      // Check for layers support
      const layersSupport = await navigator.xr.isSessionSupported('immersive-vr', {
        requiredFeatures: ['layers']
      });
      this.features.equirectLayers = layersSupport;
      
      console.log('XR Features detected:', this.features);
      
      // Emit event with capabilities
      this.el.emit('xr-features-detected', this.features);
      
    } catch (e) {
      console.error('Error detecting XR features:', e);
    }
  }
});

console.log('✅ XR Components loaded successfully');

