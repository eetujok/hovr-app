document.addEventListener('DOMContentLoaded', function() {
    
    // eslint-disable-next-line no-unused-vars
    const buildSelectors = (selectors, srcImage) => {
        const arr = selectors
            .trim()
            .split(",")
            .map((selector) => {
                const trimmedSelector = selector.trim();
                const cleanSrc = srcImage.split("?")[0];
    
                // Remove extension and optional _WIDTHx suffix
                const baseName = cleanSrc.replace(/^.*\/([^/]+?)(?:_[0-9]+x)?\.(jpg|png)$/, '$1')
                                         .replace(/\.(jpg|png)$/, ''); // Just in case regex above fails

                // For srcset, match files that may contain size suffixes like _180x.jpg
                if (trimmedSelector === 'srcset') {
                    return `img[srcset*='/files/${baseName}_'], img[srcset*='/shop/files/${baseName}_']`;
                }
    
                // For other selectors, match exact filename with extension
                const imageNameWithExt = cleanSrc.replace(/^.*\/([^/]+\.(jpg|png))$/, '$1');
    
                return `img[${trimmedSelector}*='/files/${imageNameWithExt}'], img[${trimmedSelector}*='/shop/files/${imageNameWithExt}']`;
            });
            
        return arr.join(", ");
    };

    console.log("Hovr initialized, v. 237")
    var appData = window.__HOVR_DATA__?.appData || []
    console.log("Hovr videos debug:", appData)
    
    var rawAppData = appData.links;
    
    // Add backward compatibility for videoType and OPTIONS
    var appData = rawAppData.map(function(item) {
        // Create a new object with all existing properties
        var newItem = Object.assign({}, item);
        
        // Add default videoType if not present
        if (!newItem.hasOwnProperty('videoType')) {
            newItem.videoType = "HOVER";
        }
        
        // Add default OPTIONS if not present
        if (!newItem.hasOwnProperty('OPTIONS')) {
            newItem.options = "COLLECTION";
        }
        
        return newItem;
    });
    var transitionEnum = window.__HOVR_DATA__?.transitionEnum || false 
    var settingsSelectors = window.__HOVR_DATA__?.settingsSelectors || '';
    var customTheme = window.__HOVR_DATA__?.customTheme || 'default'  // Convert to lowercase for easier comparison
    
    // Check if customTheme is one of the supported themes, otherwise set to default
    if (customTheme !== 'default' && 
        customTheme !== 'grounded' && 
        customTheme !== 'shapes' && 
        customTheme !== 'expanse' && 
        customTheme !== 'empire' && 
        customTheme !== 'beyours' &&
        customTheme !== 'ride' &&
        customTheme !== 'kalles') {
        customTheme = 'default';
    }
    
    /* AUTOPLAY VIDEO FUNCTIONALITY STARTS HERE */
    // Process autoplay videos first
    appData.forEach(function(dataItem) {
        if (dataItem.videoType === 'AUTOPLAY' && (dataItem.options === 'BOTH' || dataItem.options === 'COLLECTION')) {
            
            var srcRoot = dataItem.srcImage
                .replace(/\?.*$/, '')
                .replace(/^files\//, '');
            
            var streamLink = dataItem.streamLink;
            var handle = dataItem.handle;

            // Build selectors for matching images
            var modifiedSelectors = buildSelectors(settingsSelectors, srcRoot);
            var images = document.querySelectorAll(modifiedSelectors);
            
            images.forEach(function(image) {
                // Skip if already processed
                if (image.hasAttribute('data-autoplay-attached')) {
                    return;
                }
                
                // Create autoplay video element
                var video = document.createElement('video');
                video.classList.add('autoplay-video');
                video.style.display = 'block';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                // Set transparent background while loading
                video.style.backgroundColor = 'transparent';
                
                // Set required attributes for autoplay
                video.muted = true;
                video.autoplay = true;
                video.loop = true;
                video.playsInline = true;
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.controls = false;
                
                // Don't set src yet - we'll do that when the video is about to be visible
                // Instead, mark the video as not loaded
                video.setAttribute('data-loaded', 'false');
                
                // Replace the image with the video
                if (image.parentNode) {
                    // Insert video before the image
                    image.parentNode.insertBefore(video, image);
                    
                    // Hide the original image
                    image.style.display = 'none';
                    image.setAttribute('data-autoplay-attached', 'true');
                    
                    if (image.parentNode.classList.contains('media--hover-effect')) {
                        image.parentNode.classList.remove('media--hover-effect');
                    }
                    
                    // Create intersection observer to load video when it's about to be visible
                    var videoObserver = new IntersectionObserver(function(entries, observer) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting && video.getAttribute('data-loaded') === 'false') {
                                // Video is about to be visible and hasn't been loaded yet
                                video.src = streamLink;
                                video.setAttribute('data-loaded', 'true');
                                
                                // Handle video loading errors
                                video.addEventListener('error', function(e) {
                                    console.error('Error loading autoplay video:', e);
                                    // Show the original image if video fails to load
                                    image.style.display = '';
                                    video.style.display = 'none';
                                });
                                
                                // Ensure video plays when it's ready - with multiple fallbacks
                                let videoPlayAttempted = false;
                                
                                function attemptVideoPlay() {
                                    if (videoPlayAttempted) return;
                                    videoPlayAttempted = true;
                                    
                                    console.log("Attempting to play video");
                                    video.style.opacity = '1 !important';
                                    
                                    video.play().then(function() {
                                    }).catch(function(error) {
                                        console.error("❌ Error playing autoplay video:", error);
                                        // Show the original image if video fails to play
                                        image.style.display = '';
                                        video.style.display = 'none';
                                    });
                                }
                                
                                // Multiple event listeners for maximum compatibility
                                video.addEventListener('canplay', function() {
                                    attemptVideoPlay();
                                });
                                
                                video.addEventListener('loadeddata', function() {
                                    // Try to play after a short delay to ensure everything is ready
                                    setTimeout(attemptVideoPlay, 100);
                                });
                                
                                video.addEventListener('loadedmetadata', function() {
                                    // Try to play after metadata is loaded
                                    setTimeout(attemptVideoPlay, 50);
                                });

                                 // 3. Add event listeners to prevent theme interference
                                 video.addEventListener('pause', function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    
                                    // Force resume play after a short delay
                                    setTimeout(() => {
                                        if (video.paused) {
                                            console.log("🔄 Resuming autoplay video after pause attempt");
                                            video.play().catch(console.error);
                                        }
                                    }, 50);
                                }, true); // Use capture phase

                                // Fallback: try to play after a reasonable timeout
                                setTimeout(function() {
                                    if (!videoPlayAttempted && video.readyState >= 2) { // HAVE_CURRENT_DATA
                                        console.log("⏰ Fallback timeout - attempting to play video");
                                        attemptVideoPlay();
                                    }
                                }, 2000);
                                
                                // Additional fallback: check if video is ready and try to play
                                const checkAndPlay = function() {
                                    if (videoPlayAttempted) return;
                                    
                                    if (video.readyState >= 3) { // HAVE_FUTURE_DATA
                                        attemptVideoPlay();
                                    } else if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                                        // Try one more time after a short delay
                                        setTimeout(function() {
                                            if (!videoPlayAttempted) {
                                                console.log("🔍 Video ready state fallback - attempting to play");
                                                attemptVideoPlay();
                                            }
                                        }, 500);
                                    }
                                };
                                
                                // Check periodically for the first few seconds
                                let checkInterval = setInterval(function() {
                                    if (videoPlayAttempted) {
                                        clearInterval(checkInterval);
                                        return;
                                    }
                                    checkAndPlay();
                                }, 200);
                                
                                // Clear interval after 3 seconds to prevent infinite checking
                                setTimeout(function() {
                                    clearInterval(checkInterval);
                                }, 3000);
                            }
                        });
                    }, {
                        // Start loading when video is 200px away from viewport
                        rootMargin: '200px'
                    });
                    
                    // Start observing the video element
                    videoObserver.observe(video);
                }
            });
        }
    });
    /* AUTOPLAY VIDEO FUNCTIONALITY ENDS HERE */

    /* HOVER VIDEO FUNCTIONALITY STARTS HERE*/
    // Only process hover videos in the hover functionality section
    if (customTheme == 'default' || customTheme == 'grounded' || customTheme == "expanse") {
        console.log("Default theme")
        // Function to add srcImage to selectors - moved up
    
        // Add document-wide click listener to stop videos
        document.addEventListener('click', function(e) {
            // Check if the click was outside any product link
            if (!e.target.closest('a[href*="products/"]')) {
                // Find and stop only hover videos
                const hoverVideos = document.querySelectorAll('video.hovr-video');
                hoverVideos.forEach(function(video) {
                    video.style.opacity = "0";
                    video.pause();
                    video.currentTime = 0;
                    
                    // Reset opacity of associated images
                    const parentNode = video.parentNode;
                    if (parentNode) {
                        // Find the image that has the data-video-attached attribute
                        // This is the main product image the video was assigned to
                        const mainImage = parentNode.querySelector('img[data-video-attached="true"]');
                        if (mainImage) {
                            mainImage.style.opacity = "1";
                        }
                        
                        // Make sure all other images remain hidden
                        const otherImages = parentNode.querySelectorAll('img:not([data-video-attached="true"])');
                        otherImages.forEach(function(img) {
                            img.style.opacity = "0";
                        });
                    }
                });
            }
        });

        function attachListenersToImages(dataItem) {
            // Only process HOVER videos in this function
            if (dataItem.videoType !== 'HOVER') {
                return;
            }
            
            var srcRoot = dataItem.srcImage
                // Remove file extension and query parameters
                .replace(/\?.*$/, '')  // Remove query parameters first
                .replace(/^files\//, '');  // Remove 'files/' prefix if present
            
            var srcImage = dataItem.srcImage;
            var streamLink = dataItem.streamLink;
            var handle = dataItem.handle;

            // Add srcImage to user-defined selectors
            var modifiedSelectors = buildSelectors(settingsSelectors, srcRoot);
            // Log the selector string
            var images = document.querySelectorAll(modifiedSelectors);
            var links = document.querySelectorAll('a[href*="'+ handle +'"]');

            images.forEach(function(image) {

                var anchor = image.closest('a');

                // Check if anchor has the "collection-item__media--ratio" class
                if (anchor && anchor.classList.contains('collection-item__media--ratio')) {
                    return; // Skip this image
                }

                if (image.hasAttribute('data-video-attached')) {
                    return; // Skip if already processed
                }

                var parentElement = image.closest('.search');
                if (!parentElement) { // Only proceed if the parent does not contain "search"
                var existingVideo = image.parentNode.querySelector('video');
                if ( !existingVideo ) {


                links.forEach(function(link) {

                    if (!link.closest('.search')) { 

                    var video = document.createElement('video');
                    video.classList.add('hovr-video');
                    
                    // Add CSS class for initial state
                    video.style.backgroundColor = 'transparent';
                    video.style.visibility = 'hidden';  // Hide video initially
                    video.preload = 'none';  // Initially, do not preload
                    
                    video.muted = true;
                    video.loop = true;
                    video.playsInline = true;
                    video.background = 'transparent'
                    video.setAttribute('playsinline', '');
                    video.setAttribute('webkit-playsinline', '');
                    video.controls = false;
                    video.style.position = "absolute";
                    video.style.top = "0";
                    video.style.left = "0";
                    video.style.width = "100%";
                    video.style.height = "100%";
                    video.style.objectFit = "cover";
                    video.style.opacity = "0";
                    
                    // Only apply transition if explicitly enabled
                    if (transitionEnum) {
                        video.style.transition = "opacity 0.3s ease-in-out";
                    } else {
                        // Force no transition to override theme defaults
                        video.style.transition = "none";
                    }

                    video.currentTime = 0;
                    
                    video.addEventListener('error', function(event) {
                        console.error("Error loading video:", event);
                    });
                    
                    // IF Glozin theme insert after
                    var glozinContainer = image.closest('.product-item__media--ratio');

                    if (glozinContainer) {
                        var allImages = glozinContainer.querySelectorAll('img');
                        
                        allImages.forEach(function(img) {
                            img.style.position = 'absolute';
                        });
                        
                        var lastImage = allImages[allImages.length - 1];
                        if (lastImage && lastImage.parentNode) {
                            lastImage.parentNode.insertBefore(video, lastImage.nextSibling);
                        }
                    } else {
                        image.parentNode.insertBefore(video, image);
                    }
                    
                    image.setAttribute('data-video-attached', 'true');

                    var secondaryContainer = image.closest('.grid-product__image-mask')?.querySelector('.grid-product__secondary-image.small--hide');
         
                    var expanseContainer = image.closest('.grid-product__image-wrap')?.querySelector('.grid-product__secondary-image.small--hide');
                    
                    var vestiareContainer = image.closest('.grid__image-ratio')?.querySelector('.grid-product__secondary-image.small--hide');

                    var baselineContainer = image.closest('.featured-collection__image')?.querySelector('.product-item-hover');

                    var dawnSecondaryPicture = image.closest('.card--image-animate')?.querySelector('picture:not(:first-child)');
                    
                    var glozinSecondaryImage = glozinContainer?.querySelector('.secondary-image');

                    var plusThemeContainer = image.closest('.product-item__image-link')?.querySelector('.product-item__image--two');

                    if (glozinSecondaryImage) {
                        glozinSecondaryImage.remove();
                    }

                    if (dawnSecondaryPicture) {
                        dawnSecondaryPicture.remove();
                    }
                    
                    if (vestiareContainer) {
                        vestiareContainer.remove()
                    }

                    if (baselineContainer) {
                        baselineContainer.remove();
                    }      

                    if (secondaryContainer) {
                        secondaryContainer.remove();
                    }
                
                    if (expanseContainer) {
                        expanseContainer.style.opacity = '0';
                    }

                    if (plusThemeContainer) {
                        plusThemeContainer.remove();
                    }

                    // Apply the same transition setting to the image
                    if (transitionEnum) {
                        image.style.transition = "opacity 0.3s ease-in-out";
                    } else {
                        // Force no transition to override theme defaults
                        image.style.transition = "none";
                    }

                    var preloadObserver = new IntersectionObserver(function(entries, observer) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) {
                                // Only set the src attribute when the element is in viewport
                                if (!video.src) {
                                    video.src = streamLink + '#t=0.1';
                                }
                                video.preload = 'auto';  // Preload the video once in viewport
                                video.style.visibility = 'visible';
                                // Optional: unobserve to prevent future calls
                                observer.unobserve(entry.target);
                            }
                        });
                    });
                    // Start observing the image
                    preloadObserver.observe(image);


                    link.addEventListener('mouseover', function() {
                        // Only proceed if video is actually loaded
                        if (video.readyState >= 3) {  // HAVE_FUTURE_DATA or better
                            // Fade out all images within the same parent div
                            var siblingImages = image.parentNode.querySelectorAll('img');
                            siblingImages.forEach(function(siblingImage) {
                                if (siblingImage.classList.contains('product-card--image')) {
                                    siblingImage.style.opacity = "0 !important";
                                } else {
                                    siblingImage.style.opacity = "0";
                                }
                                siblingImage.style.animation = "none";  // Disable the animation
                                siblingImage.style.webkitAnimation = "none";  // For Safari
                            });
                            video.style.opacity = "1";
                            
                            // Play the video
                            video.play().catch(function(error) {
                                console.error("Error playing video:", error);
                            });
                        }
                    });

                    // Modified touch events for mobile
                    let touchStartY;
                    let touchStartTime;
                    let isTouchMove = false;

                    link.addEventListener('touchstart', function(e) {
                        touchStartY = e.touches[0].clientY;
                        touchStartTime = Date.now();
                        isTouchMove = false;
                        
                        // Fade out all images within the same parent div
                        var siblingImages = image.parentNode.querySelectorAll('img');
                        siblingImages.forEach(function(siblingImage) {
                            if (siblingImage.classList.contains('product-card--image')) {
                                siblingImage.style.opacity = "0 !important";
                            } else {
                                siblingImage.style.opacity = "0";
                            }
                            siblingImage.style.animation = "none";  // Disable the animation
                            siblingImage.style.webkitAnimation = "none";  // For Safari
                        });
                        
                        video.style.opacity = "1";
                        
                        // Play the video
                        video.play().catch(function(error) {
                            console.error("Error playing video:", error);
                        });
                    });

                    link.addEventListener('touchmove', function(e) {
                        const touchMoveY = e.touches[0].clientY;
                        const deltaY = Math.abs(touchMoveY - touchStartY);
                        
                        // Consider it a move if user moved more than 10px
                        if (deltaY > 10) {
                            isTouchMove = true;
                        }
                    });

                    link.addEventListener('touchend', function(e) {
                        const touchDuration = Date.now() - touchStartTime;
                        
                        // If it was a quick tap (less than 200ms) and minimal movement,
                        // treat it as a click and allow default behavior
                        if (!isTouchMove && touchDuration < 200) {
                            // Don't prevent default - allow link navigation
                            video.style.opacity = "0";
                            image.style.opacity = "1";
                            return;
                        }

                        // Otherwise handle as a video preview interaction
                        e.preventDefault();

                        video.style.opacity = "0";
                        image.style.opacity = "1";
                        
                        // Only pause the video after the transition completes or immediately if no transition
                        if (transitionEnum === false) {
                            video.pause();
                            video.currentTime = 0;
                        } else {
                            // Wait for transition to complete before pausing
                            video.addEventListener('transitionend', function() {
                                // Only pause if opacity is actually 0 (we're not hovering again)
                                if (video.style.opacity === "0") {
                                    video.pause();
                                    video.currentTime = 0;
                                }
                            }, { once: true });
                        }
                    });

                    link.addEventListener('mouseout', function() {
                        video.style.opacity = "0";
                        image.style.opacity = "1";
                        
                        // Only pause the video after the transition completes or immediately if no transition
                        if (transitionEnum === false) {
                            video.pause();
                            video.currentTime = 0;
                        } else {
                            // Wait for transition to complete before pausing
                            video.addEventListener('transitionend', function() {
                                // Only pause if opacity is actually 0 (we're not hovering again)
                                if (video.style.opacity === "0") {
                                    video.pause();
                                    video.currentTime = 0;
                                }
                            }, { once: true });
                        }
                    });
                }
                });
                }
            }
            });

        }

        appData.forEach(function(dataItem) {
            attachListenersToImages(dataItem);
        });

        // After processing all initial images:
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // If new nodes are added, try re-attaching video logic to any newly added images
                    appData.forEach(function(dataItem) {
                        attachListenersToImages(dataItem);
                    });
                }
            });
        });

        // Start observing after initial setup
        observer.observe(document.body, { childList: true, subtree: true });

    } else if (customTheme == 'kalles') {
        console.log("Kalles theme")

        const buildSelectorsKalles = (selectors, srcImage) => {
            const arr = selectors
                .trim()
                .split(",")
                .map((selector) => `[${selector.trim()}*='${srcImage}']`);
            return arr.join(", ");
        };
        
        // Add document-wide click listener to stop videos
        document.addEventListener('click', function(e) {
            // Check if the click was outside any product link
            if (!e.target.closest('a[href*="products/"]')) {
                // Find and stop only hover videos
                const hoverVideos = document.querySelectorAll('video.hovr-video');
                hoverVideos.forEach(function(video) {
                    video.style.opacity = "0";
                    video.pause();
                    video.currentTime = 0;
                    
                    // Reset opacity of associated images
                    const parentNode = video.parentNode;
                    if (parentNode) {
                        // Find the main product image div
                        const mainImageDiv = parentNode.querySelector('.pr_lazy_img.main-img');
                        if (mainImageDiv) {
                            mainImageDiv.style.opacity = "1";
                        }
                    }
                });
            }
        });

        function attachListenersToImages(dataItem) {
            // Only process HOVER videos in this function
            if (dataItem.videoType !== 'HOVER') {
                return;
            }
            
            var srcRoot = dataItem.srcImage
                .replace(/^.*\//, '')
                .replace(/\?.*$/, '')
                .replace(/\.(jpg|png)$/, '');
            
            var streamLink = dataItem.streamLink;
            var handle = dataItem.handle;

            // For Kalles theme, we need to target the background divs
            var modifiedSelectors = buildSelectorsKalles(settingsSelectors, srcRoot);
            var productContainers = document.querySelectorAll('.product-image.pr.oh');
            
            productContainers.forEach(function(container) {
                // Check if this container has already been processed
                if (container.hasAttribute('data-video-attached')) {
                    return;
                }
                
                // Find the main image div
                var mainImageDiv = container.querySelector('.pr_lazy_img.main-img');
                if (!mainImageDiv) return;
                
                // Check if this is the right product by matching the background image URL
                var bgImage = mainImageDiv.style.backgroundImage;
                if (!bgImage || !bgImage.includes(srcRoot)) return;
                
                // Find the product link
                var link = container.querySelector('a[href*="products/"]');
                if (!link || !link.href.includes(handle)) return;
                
                // Create and set up the video element
                var video = document.createElement('video');
                video.classList.add('hovr-video');
                video.style.backgroundColor = 'transparent';
                video.style.visibility = 'hidden';
                video.preload = 'none';
                
                // Basic video setup
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.controls = false;
                video.style.position = "absolute";
                video.style.top = "0";
                video.style.left = "0";
                video.style.width = "100%";
                video.style.height = "100%";
                video.style.objectFit = "cover";
                video.style.opacity = "0";
                video.style.zIndex = "2"; // Ensure video is above the image
                
                // Apply transition if enabled
                if (transitionEnum) {
                    video.style.transition = "opacity 0.3s ease-in-out";
                } else {
                    video.style.transition = "none";
                }
                
                // Insert the video element into the container
                container.appendChild(video);
                container.setAttribute('data-video-attached', 'true');
                
                // Remove the hover image container as it interferes with the video
                var hoverImgContainer = container.querySelector('.hover_img');
                if (hoverImgContainer) {
                    hoverImgContainer.style.display = 'none';
                }
                
                // Observer to trigger preload when the container appears in the viewport
                var preloadObserver = new IntersectionObserver(function(entries, observer) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            if (!video.src) {
                                video.src = streamLink + '#t=0.1';
                            }
                            video.preload = 'auto';
                            video.style.visibility = 'visible';
                            observer.unobserve(entry.target);
                        }
                    });
                });
                preloadObserver.observe(container);
                
                // Mouseover event (for desktop)
                link.addEventListener('mouseover', function() {
                    if (video.readyState >= 3) {  // Check if the video is ready
                        mainImageDiv.style.opacity = "0";
                        video.style.visibility = "visible";
                        video.style.opacity = "1";
                        video.play().catch(function(error) {
                            console.error("Error playing video:", error);
                        });
                    }
                });
                
                // Touchstart event (activate video on mobile touch)
                link.addEventListener('touchstart', function(e) {
                    mainImageDiv.style.opacity = "0";
                    video.style.visibility = "visible";
                    video.style.opacity = "1";
                    video.play().catch(function(error) {
                        console.error("Error playing video:", error);
                    });
                });
                
                // Modified touch events for mobile
                let touchStartY;
                let touchStartTime;
                let isTouchMove = false;
                
                link.addEventListener('touchstart', function(e) {
                    touchStartY = e.touches[0].clientY;
                    touchStartTime = Date.now();
                    isTouchMove = false;
                });
                
                link.addEventListener('touchmove', function(e) {
                    const touchMoveY = e.touches[0].clientY;
                    const deltaY = Math.abs(touchMoveY - touchStartY);
                    
                    // Consider it a move if user moved more than 10px
                    if (deltaY > 10) {
                        isTouchMove = true;
                    }
                });
                
                link.addEventListener('touchend', function(e) {
                    const touchDuration = Date.now() - touchStartTime;
                    
                    // If it was a quick tap (less than 200ms) and minimal movement,
                    // treat it as a click and allow default behavior
                    if (!isTouchMove && touchDuration < 200) {
                        // Don't prevent default - allow link navigation
                        video.style.opacity = "0";
                        mainImageDiv.style.opacity = "1";
                        return;
                    }
                    
                    // Otherwise handle as a video preview interaction
                    e.preventDefault();
                    
                    video.style.opacity = "0";
                    mainImageDiv.style.opacity = "1";
                    
                    // Only pause the video after the transition completes or immediately if no transition
                    if (transitionEnum === false) {
                        video.pause();
                        video.currentTime = 0;
                    } else {
                        // Wait for transition to complete before pausing
                        video.addEventListener('transitionend', function() {
                            // Only pause if opacity is actually 0 (we're not hovering again)
                            if (video.style.opacity === "0") {
                                video.pause();
                                video.currentTime = 0;
                            }
                        }, { once: true });
                    }
                });
                
                // Mouseout event
                link.addEventListener('mouseout', function() {
                    video.style.opacity = "0";
                    mainImageDiv.style.opacity = "1";
                    
                    // Only pause the video after the transition completes or immediately if no transition
                    if (transitionEnum === false) {
                        video.pause();
                        video.currentTime = 0;
                    } else {
                        // Wait for transition to complete before pausing
                        video.addEventListener('transitionend', function() {
                            // Only pause if opacity is actually 0 (we're not hovering again)
                            if (video.style.opacity === "0") {
                                video.pause();
                                video.currentTime = 0;
                            }
                        }, { once: true });
                    }
                });
            });
        }

        appData.forEach(function(dataItem) {
            attachListenersToImages(dataItem);
        });

        // After processing all initial images:
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // If new nodes are added, try re-attaching video logic to any newly added images
                    appData.forEach(function(dataItem) {
                        attachListenersToImages(dataItem);
                    });
                }
            });
        });

        // Start observing after initial setup
        observer.observe(document.body, { childList: true, subtree: true });
    } else if (customTheme == 'empire') {
        console.log("Empire")
        
        function attachListenersToImages(dataItem) {
            var srcRoot = dataItem.srcImage
                .replace(/\?.*$/, '')
                .replace(/\.(jpg|png)$/, '')
                .replace(/^files\//, '');
            
            var srcImage = dataItem.srcImage;
            var streamLink = dataItem.streamLink;
            var handle = dataItem.handle;

            var modifiedSelectors = buildSelectors(settingsSelectors, srcRoot);
            var images = document.querySelectorAll(modifiedSelectors);
            
            images.forEach(function(image) {
                if (image.hasAttribute('data-video-attached')) {
                    return;
                }

                var parentElement = image.closest('.search');
                if (!parentElement) {
                    var existingVideo = image.parentNode.querySelector('video');
                    if (!existingVideo) {
                        // Create video element
                        var video = document.createElement('video');
                        video.classList.add('hovr-video');
                        
                        video.style.backgroundColor = 'transparent';
                        video.style.visibility = 'hidden';
                        video.preload = 'none';
                        
                        video.addEventListener('loadeddata', function() {
                            video.style.visibility = 'visible';
                        });

                        video.muted = true;
                        video.loop = true;
                        video.playsInline = true;
                        video.background = 'transparent';
                        video.setAttribute('playsinline', '');
                        video.setAttribute('webkit-playsinline', '');
                        video.controls = false;
                        video.style.position = "absolute";
                        video.style.top = "0";
                        video.style.left = "0";
                        video.style.width = "100%";
                        video.style.height = "100%";
                        video.style.objectFit = "cover";
                        video.style.opacity = "0";
                        video.setAttribute('data-playing', 'false');
                        
                        if (transitionEnum === true) {  // Use strict equality check
                            video.style.transition = "opacity 0.3s ease-in-out";
                        }

                        video.currentTime = 0;
                        
                        video.addEventListener('error', function(event) {
                            console.error("Error loading video:", event);
                        });

                        // Position the video behind the image
                        image.parentNode.insertBefore(video, image);
                        image.setAttribute('data-video-attached', 'true');

                        if (transitionEnum === true) {  // Use strict equality check
                            image.style.transition = "opacity 0.3s ease-in-out";
                        }
        
                        var preloadObserver = new IntersectionObserver(function(entries, observer) {
                            entries.forEach(function(entry) {
                                if (entry.isIntersecting) {
                                    // Only set the src attribute when the element is in viewport
                                    if (!video.src) {
                                        video.src = streamLink + '#t=0.1';
                                    }
                                    video.style.visibility = 'visible';
                                    video.preload = 'auto';
                                    observer.unobserve(entry.target);
                                }
                            });
                        });
                        preloadObserver.observe(image);

                        // Find the product item container for Empire theme
                        const productItem = image.closest('.productitem');
                        if (productItem) {
                            // Add hover event to the entire product item
                            productItem.addEventListener('mouseover', function() {
                                if (video.readyState >= 3 && video.getAttribute('data-playing') !== 'true') {
                                    video.setAttribute('data-playing', 'true');
                                    
                                    var siblingImages = image.parentNode.querySelectorAll('img');
                                    siblingImages.forEach(function(siblingImage) {
                                        siblingImage.style.opacity = "0";
                                    });
                                    
                                    video.play().then(function() {
                                        video.style.opacity = "1";
                                    }).catch(function(error) {
                                        console.error("Error playing video:", error);
                                        video.setAttribute('data-playing', 'false');
                                    });
                                }
                            });

                            productItem.addEventListener('mouseout', function() {
                                if (video.getAttribute('data-playing') === 'true') {
                                    video.setAttribute('data-playing', 'transitioning');
                                    
                                    video.style.opacity = "0";
                                    image.style.opacity = "1";
                                    
                                    if (transitionEnum === true) {  // Use strict equality check
                                        setTimeout(function() {
                                            if (video.getAttribute('data-playing') === 'transitioning') {
                                                video.pause();
                                                video.currentTime = 0;
                                                video.setAttribute('data-playing', 'false');
                                            }
                                        }, 350);
                                    } else {
                                        video.pause();
                                        video.currentTime = 0;
                                        video.setAttribute('data-playing', 'false');
                                    }
                                }
                            });

                            // Modified touch events for mobile
                            let touchStartY;
                            let touchStartTime;
                            let isTouchMove = false;

                            productItem.addEventListener('touchstart', function(e) {
                                touchStartY = e.touches[0].clientY;
                                touchStartTime = Date.now();
                                isTouchMove = false;
                                
                                var siblingImages = image.parentNode.querySelectorAll('img');
                                siblingImages.forEach(function(siblingImage) {
                                    siblingImage.style.opacity = "0";
                                });
                                
                                video.style.opacity = "1";
                                
                                video.play().catch(function(error) {
                                    console.error("Error playing video:", error);
                                });
                            });

                            productItem.addEventListener('touchmove', function(e) {
                                const touchMoveY = e.touches[0].clientY;
                                const deltaY = Math.abs(touchMoveY - touchStartY);
                                
                                if (deltaY > 10) {
                                    isTouchMove = true;
                                }
                            });

                            productItem.addEventListener('touchend', function(e) {
                                const touchDuration = Date.now() - touchStartTime;
                                
                                // If it was a quick tap and minimal movement, allow navigation
                                if (!isTouchMove && touchDuration < 200) {
                                    video.style.opacity = "0";
                                    image.style.opacity = "1";
                                    return;
                                }

                                // Otherwise handle as video preview
                                if (e.target.tagName !== 'A') {
                                    e.preventDefault();
                                }

                                video.style.opacity = "0";
                                
                                // Ensure all sibling images are visible again
                                var siblingImages = image.parentNode.querySelectorAll('img');
                                siblingImages.forEach(function(siblingImage) {
                                    siblingImage.style.opacity = "1";
                                    // Reset any transition/animation changes we made
                                    siblingImage.style.transition = '';
                                    siblingImage.style.animation = '';
                                });
                                
                                video.addEventListener('transitionend', function() {
                                    video.pause();
                                    video.currentTime = 0;
                                }, { once: true });
                            });
                        }
                    }
                }
            });
        }

        appData.forEach(function(dataItem) {
            attachListenersToImages(dataItem);
        });

        // After processing all initial images:
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // If new nodes are added, try re-attaching video logic to any newly added images
                    appData.forEach(function(dataItem) {
                        attachListenersToImages(dataItem);
                    });
                }
            });
        });

        // Start observing after initial setup
        observer.observe(document.body, { childList: true, subtree: true });
        console.log("Default theme")
    } else if (customTheme == 'ride') {
        console.log("Ride theme")
          
        const buildSelectorsRide = (selectors, srcImage) => {
            const arr = selectors
                .trim()
                .split(",")
                .map((selector) => `[${selector.trim()}*='${srcImage}']`);
            return arr.join(", ");
        };

        function attachListenersToImages(dataItem) {
            var srcRoot = dataItem.srcImage
                .replace(/\?.*$/, '')
                .replace(/\.(jpg|png)$/, '')
                .replace(/^files\//, '');
            
            var srcImage = dataItem.srcImage;
            var streamLink = dataItem.streamLink;
            var handle = dataItem.handle;

            var modifiedSelectors = buildSelectorsRide(settingsSelectors, srcRoot);
            var images = document.querySelectorAll(modifiedSelectors);
            
            images.forEach(function(image) {
                if (image.hasAttribute('data-video-attached')) {
                    return;
                }

                var parentElement = image.closest('.search');
                if (!parentElement) {
                    var existingVideo = image.parentNode.querySelector('video');
                    if (!existingVideo) {
                        // Create video element
                        var video = document.createElement('video');
                        video.classList.add('hovr-video');
                        
                        video.style.backgroundColor = 'transparent';
                        video.style.visibility = 'hidden';
                        video.preload = 'none';
                        
                        video.addEventListener('loadeddata', function() {
                            video.style.visibility = 'visible';
                        });

                        video.muted = true;
                        video.loop = true;
                        video.playsInline = true;
                        video.background = 'transparent';
                        video.setAttribute('playsinline', '');
                        video.setAttribute('webkit-playsinline', '');
                        video.controls = false;
                        video.style.position = "absolute";
                        video.style.top = "0";
                        video.style.left = "0";
                        video.style.width = "100%";
                        video.style.height = "100%";
                        video.style.objectFit = "cover";
                        video.style.opacity = "0";
                        video.setAttribute('data-playing', 'false');
                        
                        if (transitionEnum === true) {  // Use strict equality check
                            video.style.transition = "opacity 0.3s ease-in-out";
                        }

                        video.currentTime = 0;
                        
                        video.addEventListener('error', function(event) {
                            console.error("Error loading video:", event);
                        });

                        // Position the video behind the image
                        image.parentNode.insertBefore(video, image);
                        image.setAttribute('data-video-attached', 'true');

                        if (transitionEnum === true) {  // Use strict equality check
                            image.style.transition = "opacity 0.3s ease-in-out";
                        }
        
                        var preloadObserver = new IntersectionObserver(function(entries, observer) {
                            entries.forEach(function(entry) {
                                if (entry.isIntersecting) {
                                    // Only set the src attribute when the element is in viewport
                                    if (!video.src) {
                                        video.src = streamLink + '#t=0.1';
                                    }
                                    video.style.visibility = 'visible';
                                    video.preload = 'auto';
                                    observer.unobserve(entry.target);
                                }
                            });
                        });
                        preloadObserver.observe(image);

                        // Find the product item container for Empire theme
                        const productItem = image.closest('.card');
                        if (productItem) {
                            // Add hover event to the entire product item
                            productItem.addEventListener('mouseover', function() {
                                if (video.readyState >= 3 && video.getAttribute('data-playing') !== 'true') {
                                    video.setAttribute('data-playing', 'true');
                                    
                                    var siblingImages = image.parentNode.querySelectorAll('img');
                                    siblingImages.forEach(function(siblingImage) {
                                        siblingImage.style.opacity = "0";
                                    });
                                    
                                    video.play().then(function() {
                                        video.style.opacity = "1";
                                    }).catch(function(error) {
                                        console.error("Error playing video:", error);
                                        video.setAttribute('data-playing', 'false');
                                    });
                                }
                            });

                            productItem.addEventListener('mouseout', function() {
                                if (video.getAttribute('data-playing') === 'true') {
                                    video.setAttribute('data-playing', 'transitioning');
                                    
                                    video.style.opacity = "0";
                                    image.style.opacity = "1";
                                    
                                    if (transitionEnum === true) {  // Use strict equality check
                                        setTimeout(function() {
                                            if (video.getAttribute('data-playing') === 'transitioning') {
                                                video.pause();
                                                video.currentTime = 0;
                                                video.setAttribute('data-playing', 'false');
                                            }
                                        }, 350);
                                    } else {
                                        video.pause();
                                        video.currentTime = 0;
                                        video.setAttribute('data-playing', 'false');
                                    }
                                }
                            });

                            // Modified touch events for mobile
                            let touchStartY;
                            let touchStartTime;
                            let isTouchMove = false;

                            productItem.addEventListener('touchstart', function(e) {
                                touchStartY = e.touches[0].clientY;
                                touchStartTime = Date.now();
                                isTouchMove = false;
                                
                                var siblingImages = image.parentNode.querySelectorAll('img');
                                siblingImages.forEach(function(siblingImage) {
                                    siblingImage.style.opacity = "0";
                                });
                                
                                video.style.opacity = "1";
                                
                                video.play().catch(function(error) {
                                    console.error("Error playing video:", error);
                                });
                            });

                            productItem.addEventListener('touchmove', function(e) {
                                const touchMoveY = e.touches[0].clientY;
                                const deltaY = Math.abs(touchMoveY - touchStartY);
                                
                                if (deltaY > 10) {
                                    isTouchMove = true;
                                }
                            });

                            productItem.addEventListener('touchend', function(e) {
                                const touchDuration = Date.now() - touchStartTime;
                                
                                // If it was a quick tap and minimal movement, allow navigation
                                if (!isTouchMove && touchDuration < 200) {
                                    video.style.opacity = "0";
                                    image.style.opacity = "1";
                                    return;
                                }

                                // Otherwise handle as video preview
                                if (e.target.tagName !== 'A') {
                                    e.preventDefault();
                                }

                                video.style.opacity = "0";
                                
                                // Ensure all sibling images are visible again
                                var siblingImages = image.parentNode.querySelectorAll('img');
                                siblingImages.forEach(function(siblingImage) {
                                    siblingImage.style.opacity = "1";
                                    // Reset any transition/animation changes we made
                                    siblingImage.style.transition = '';
                                    siblingImage.style.animation = '';
                                });
                                
                                video.addEventListener('transitionend', function() {
                                    video.pause();
                                    video.currentTime = 0;
                                }, { once: true });
                            });
                        }
                    }
                }
            });
        }

        appData.forEach(function(dataItem) {
            attachListenersToImages(dataItem);
        });

        // After processing all initial images:
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // If new nodes are added, try re-attaching video logic to any newly added images
                    appData.forEach(function(dataItem) {
                        attachListenersToImages(dataItem);
                    });
                }
            });
        });

        // Start observing after initial setup
        observer.observe(document.body, { childList: true, subtree: true });
        console.log("Default theme")
    }

      /* HOVER VIDEO FUNCTIONALITY ENDS HERE*/
  
});