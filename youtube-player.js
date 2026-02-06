(function () {
  "use strict";

  const App = {
    youtubePlayer: null,
    isMobile: false,
    resizeTimeout: null,

    init() {
      this.detectMobile();
      this.initYouTubePlayer();
      this.setupTabVisibility();
    },

    detectMobile() {
      // Detect mobile devices (for fallback logic only)
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      this.isMobile = isMobileDevice || (isSmallScreen && isTouchDevice);
    },

    showFallback() {
      const fallbackBg = document.getElementById("fallbackBg");
      if (fallbackBg) {
        fallbackBg.classList.add("active");
      }
      
      // On mobile, also hide the video container
      if (this.isMobile) {
        const container = document.getElementById("youtube-background");
        if (container) {
          container.style.display = 'none';
        }
      }
    },

    initYouTubePlayer() {
      // On mobile, check if we should use fallback instead
      if (this.isMobile) {
        // Check if autoplay is likely to be blocked
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // For mobile, we'll still try to load but with fallback ready
        // The fallback will show if video fails or doesn't autoplay
      }

      // Wait for YouTube IFrame API to be ready
      if (window.YT && window.YT.Player) {
        const container = document.getElementById("youtube-background");
        if (!container) {
          this.showFallback();
          return;
        }

        // Create YouTube player instance
        this.youtubePlayer = new YT.Player("youtube-background", {
          videoId: "z977gKXg1_k",
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: "z977gKXg1_k", // Required for looping
            controls: 0,
            showinfo: 0,
            rel: 0,
            mute: 1,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3, // Hide annotations
            cc_load_policy: 0, // Hide captions
            fs: 0, // Disable fullscreen button
            disablekb: 1, // Disable keyboard controls
            enablejsapi: 1,
            origin: window.location.origin // Help prevent UI elements
          },
          events: {
            onReady: (event) => {
              // Set playback quality to highest available
              const qualityLevels = ["highres", "hd1080", "hd720", "large", "medium", "small"];
              for (const quality of qualityLevels) {
                try {
                  event.target.setPlaybackQuality(quality);
                  const currentQuality = event.target.getPlaybackQuality();
                  if (currentQuality && currentQuality !== "unknown") {
                    break;
                  }
                } catch (e) {
                  // Continue to next quality level
                }
              }

              // On mobile, check if video actually started playing (only show fallback if truly failed)
              if (this.isMobile) {
                setTimeout(() => {
                  try {
                    const playerState = event.target.getPlayerState();
                    // Only show fallback if video is definitely not playing after multiple attempts
                    if (playerState === YT.PlayerState.PAUSED || 
                        playerState === YT.PlayerState.CUED ||
                        playerState === YT.PlayerState.ENDED ||
                        playerState === -1) {
                      // Try to play once more
                      event.target.playVideo();
                      
                      // Check again after a longer delay - only show fallback if still not playing
                      setTimeout(() => {
                        try {
                          const newState = event.target.getPlayerState();
                          // Only show fallback if video is definitely not working
                          if (newState !== YT.PlayerState.PLAYING && newState !== YT.PlayerState.BUFFERING) {
                            this.showFallback();
                          }
                        } catch (e) {
                          // Don't show fallback on errors - let video try to load
                        }
                      }, 3000);
                    }
                  } catch (e) {
                    // Don't show fallback on errors - let video try to load
                  }
                }, 2000);
              }
            },
            onStateChange: (event) => {
              // Ensure quality is maintained when video restarts/loops
              if (event.data === YT.PlayerState.PLAYING) {
                const qualityLevels = ["highres", "hd1080", "hd720", "large"];
                for (const quality of qualityLevels) {
                  try {
                    event.target.setPlaybackQuality(quality);
                    break;
                  } catch (e) {
                    // Continue to next quality level
                  }
                }
              }
            },
            onError: (event) => {
              // If video fails to load, show fallback background
              if (event.data >= 100) {
                this.showFallback();
              }
            }
          }
        });
      } else {
        // Retry if API not loaded yet
        setTimeout(() => this.initYouTubePlayer(), 100);
      }
    },

    setupTabVisibility() {
      // Handle tab visibility changes to resume video when tab becomes active
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.youtubePlayer && window.YT) {
          try {
            const playerState = this.youtubePlayer.getPlayerState();
            if (playerState === window.YT.PlayerState.PAUSED || 
                playerState === window.YT.PlayerState.ENDED || 
                playerState === window.YT.PlayerState.CUED ||
                playerState === -1) {
              this.youtubePlayer.playVideo();
            }
          } catch (e) {
            try {
              this.youtubePlayer.playVideo();
            } catch (err) {
              // Video might not be ready yet, ignore
            }
          }
        }
      });

      // Also handle window focus/blur events as fallback
      window.addEventListener("focus", () => {
        if (this.youtubePlayer && window.YT) {
          try {
            const playerState = this.youtubePlayer.getPlayerState();
            if (playerState === window.YT.PlayerState.PAUSED || 
                playerState === window.YT.PlayerState.ENDED || 
                playerState === window.YT.PlayerState.CUED ||
                playerState === -1) {
              this.youtubePlayer.playVideo();
            }
          } catch (e) {
            // Ignore errors
          }
        }
      });
    }
  };

  // YouTube IFrame API callback
  window.onYouTubeIframeAPIReady = () => {
    App.initYouTubePlayer();
  };

  // Suppress YouTube postMessage warnings (harmless but noisy)
  const originalError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('postMessage')) {
      // Suppress postMessage origin warnings from YouTube API
      return;
    }
    originalError.apply(console, args);
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }

  window.YouTubeApp = App;
})();
