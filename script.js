// Carousel functionality
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel-container');
    const carouselWrapper = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoplayInterval;
    const autoplayDelay = 8000; // 8 seconds

    // Use visible width in pixels so each advance shows a full new image (fixes mobile)
    function getSlideWidth() {
        return carouselWrapper ? carouselWrapper.offsetWidth : window.innerWidth;
    }

    function applySlideWidths() {
        const w = getSlideWidth();
        slides.forEach(slide => {
            slide.style.width = w + 'px';
            slide.style.minWidth = w + 'px';
        });
    }

    function applyTransform() {
        const w = getSlideWidth();
        carousel.style.transform = `translateX(-${currentSlide * w}px)`;
    }

    // Initialize carousel
    function initCarousel() {
        applySlideWidths();
        applyTransform();
        updateDots();
        startAutoplay();
    }

    // Go to specific slide
    function goToSlide(slideIndex) {
        if (slideIndex < 0) {
            slideIndex = totalSlides - 1;
        } else if (slideIndex >= totalSlides) {
            slideIndex = 0;
        }

        currentSlide = slideIndex;
        applyTransform();
        updateDots();
        resetAutoplay();
    }

    // Update navigation dots
    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // Next slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // Previous slide
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Start autoplay
    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    // Stop autoplay
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    // Reset autoplay (used when user interacts)
    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Add click event listeners to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Pause autoplay on hover
    const carouselContainer = document.querySelector('.carousel');
    carouselContainer.addEventListener('mouseenter', stopAutoplay);
    carouselContainer.addEventListener('mouseleave', startAutoplay);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    });

    carouselContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchStartX - touchEndX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                nextSlide(); // Swipe left
            } else {
                prevSlide(); // Swipe right
            }
        }
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const elementRect = targetElement.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const targetPosition = absoluteElementTop - headerHeight - 50; // Extra offset for better positioning

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header background on scroll
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 100) {
            header.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        } else {
            header.style.backgroundColor = 'transparent';
        }

        lastScrollY = currentScrollY;
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe sections for fade-in animation
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Observe feature cards for staggered animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Initialize carousel
    initCarousel();

    // Re-measure on resize/orientation so mobile always shows full new images
    window.addEventListener('resize', function() {
        applySlideWidths();
        applyTransform();
    });
});