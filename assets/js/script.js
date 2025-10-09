// COLLEGRANCE Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on links
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Fade In Animation on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class to sections and observe them
    document.querySelectorAll('section, .trust-item, .service-card, .brand-card').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
    
    // Header Background Change on Scroll
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Dynamic Amazon Store URL (You'll need to replace with actual URL)
    const amazonStoreURL = 'https://www.amazon.co.jp/stores/COLLEGRANCE/page/F9EFF672-A578-4332-A93B-CDE6DB8F22D0';
    
    // Update all Amazon store links
    document.querySelectorAll('a[href="#"]').forEach(link => {
        if (link.textContent.includes('Amazon') || link.classList.contains('cta-button')) {
            link.href = amazonStoreURL;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
    });
    
    // Trust Section Counter Animation
    const trustCounters = document.querySelectorAll('.trust-item');
    const statCounters = document.querySelectorAll('.stat-number');
    
    const trustObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTrustItem(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.7 });
    
    statCounters.forEach(counter => {
        statsObserver.observe(counter);
    });
    
    trustCounters.forEach(counter => {
        trustObserver.observe(counter);
    });
    
    function animateTrustItem(item) {
        const icon = item.querySelector('.trust-icon');
        if (icon) {
            setTimeout(() => {
                icon.style.animation = 'bounce 0.6s ease';
            }, 200);
        }
    }
    
    function animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const steps = 60;
        const stepValue = target / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += stepValue;
            if (current >= target) {
                counter.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current).toLocaleString();
            }
        }, duration / steps);
    }
    
    // Parallax Effect for Hero Section
    const hero = document.querySelector('.hero');
    const heroImage = document.querySelector('.bottle-placeholder');
    
    if (hero && heroImage) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (scrolled < hero.offsetHeight) {
                heroImage.style.transform = `translateY(${rate}px)`;
            }
        });
    }
    
    // Form Validation (if contact form is added later)
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Lazy Loading for Images (when images are added)
    function lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('loading');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            img.classList.add('loading');
            imageObserver.observe(img);
        });
    }
    
    // Call lazy loading
    lazyLoadImages();
    
    // Performance optimized scroll handler
    let ticking = false;
    
    function updateScrollEffects() {
        // Update any scroll-based effects here
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    });
    
    // Add click tracking for analytics (when implemented)
    function trackClick(eventName, properties = {}) {
        // Analytics tracking would go here
        console.log('Track click:', eventName, properties);
    }
    
    // Track CTA clicks
    document.querySelectorAll('.btn-primary, .btn-secondary, .cta-button').forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            trackClick('cta_click', {
                button_text: buttonText,
                section: this.closest('section')?.className || 'header'
            });
        });
    });
    
    // Add bounce animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 20%, 60%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-20px);
            }
            80% {
                transform: translateY(-10px);
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translate3d(0, 40px, 0);
            }
            to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
            }
        }
        
        .nav-menu.active {
            display: flex !important;
            position: fixed;
            top: 70px;
            left: 0;
            width: 100%;
            height: calc(100vh - 70px);
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding-top: 50px;
            gap: 30px;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    `;
    document.head.appendChild(style);
    
    // Fragrance Quiz Implementation
    const fragranceQuizButton = document.getElementById('fragranceQuiz');
    const quizModal = document.getElementById('fragranceQuizModal');
    const closeQuiz = document.querySelector('.quiz-close');
    
    let quizAnswers = {};
    let currentStep = 1;
    
    // Quiz data for recommendations
    const fragranceDatabase = {
        'business-floral-light': {
            title: 'エレガント・フローラル',
            description: 'オフィスにぴったりの上品で洗練された花の香り。周りに好印象を与える、控えめで美しい香りです。',
            image: 'https://page.gensparksite.com/v1/base64_upload/a91efc7711a29355588d6c5cd2f6c60a',
            brands: ['エルメス', 'ディプティック', 'ルラボ']
        },
        'business-citrus-light': {
            title: 'フレッシュ・シトラス',
            description: 'ビジネスシーンに最適な清潔感のある爽やかな香り。集中力を高め、清々しい印象を与えます。',
            image: 'https://page.gensparksite.com/v1/base64_upload/ca1fe49ee5836bbff9bd373169332662',
            brands: ['エルメス', 'メゾンマルジェラ']
        },
        'evening-oriental-medium': {
            title: 'セクシー・オリエンタル',
            description: '夜のデートにぴったりの魅惑的で印象的な香り。大人の魅力を引き出す深みのある香りです。',
            image: 'https://page.gensparksite.com/v1/base64_upload/be264a989fb392963e99b537560ff311',
            brands: ['ルラボ', 'ディプティック']
        },
        'casual-woody-medium': {
            title: 'ナチュラル・ウッディ',
            description: 'デイリーユースにぴったりの温かみのある木の香り。自然体で親しみやすい印象を与えます。',
            image: 'https://page.gensparksite.com/v1/base64_upload/8c2c90b4e84d97eba6f4375b3057d5db',
            brands: ['エルメス', 'ルラボ', 'メゾンマルジェラ']
        },
        // Default fallback
        'default': {
            title: 'バランス・クラシック',
            description: 'どんなシーンにも合う万能な香り。上品で洗練された、誰からも愛される香りです。',
            image: 'https://page.gensparksite.com/v1/base64_upload/a5e9db2030063924bb2b93f58db6a186',
            brands: ['エルメス', 'ルラボ', 'ディプティック']
        }
    };
    
    if (fragranceQuizButton) {
        fragranceQuizButton.addEventListener('click', function() {
            quizModal.style.display = 'block';
            currentStep = 1;
            quizAnswers = {};
            showStep(1);
        });
    }
    
    if (closeQuiz) {
        closeQuiz.addEventListener('click', function() {
            quizModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === quizModal) {
            quizModal.style.display = 'none';
        }
    });
    
    function showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.quiz-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // Show current step
        const currentStepElement = document.getElementById(`step${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }
        
        // Add event listeners to options
        const options = currentStepElement.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                const answer = this.getAttribute('data-answer');
                
                if (stepNumber === 1) {
                    quizAnswers.scene = answer;
                    currentStep = 2;
                    showStep(2);
                } else if (stepNumber === 2) {
                    quizAnswers.type = answer;
                    currentStep = 3;
                    showStep(3);
                } else if (stepNumber === 3) {
                    quizAnswers.strength = answer;
                    showResult();
                }
            });
        });
    }
    
    function showResult() {
        // Hide all steps
        document.querySelectorAll('.quiz-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // Show result
        const resultElement = document.getElementById('quizResult');
        resultElement.style.display = 'block';
        
        // Generate recommendation key
        const recommendationKey = `${quizAnswers.scene}-${quizAnswers.type}-${quizAnswers.strength}`;
        
        // Get recommendation (fallback to default if specific combination not found)
        const recommendation = fragranceDatabase[recommendationKey] || fragranceDatabase['default'];
        
        // Update result content
        document.getElementById('resultImage').src = recommendation.image;
        document.getElementById('resultTitle').textContent = recommendation.title;
        document.getElementById('resultDescription').textContent = recommendation.description;
        
        const brandsContainer = document.getElementById('resultBrands');
        brandsContainer.innerHTML = '';
        recommendation.brands.forEach(brand => {
            const brandTag = document.createElement('span');
            brandTag.className = 'brand-tag';
            brandTag.textContent = brand;
            brandsContainer.appendChild(brandTag);
        });
    }
    
    // Console log for debugging
    console.log('COLLEGRANCE website initialized');
    console.log('Trust in quality, trust in COLLEGRANCE');
});

// Utility Functions
const ColleGranceUtils = {
    // Smooth scroll to element
    scrollToElement: function(selector, offset = 80) {
        const element = document.querySelector(selector);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    // Check if element is in viewport
    isInViewport: function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Debounce function
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export utils for global access
window.ColleGranceUtils = ColleGranceUtils;

// Hero Background Slider
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    if (slides.length === 0) return; // Exit if no slides found
    
    function showSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide and dot
        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % totalSlides;
        showSlide(next);
    }
    
    // Auto slide every 6 seconds
    setInterval(nextSlide, 6000);
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;
    
    const heroSlider = document.querySelector('.hero-slider');
    
    if (heroSlider) {
        heroSlider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        heroSlider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = startX - endX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next slide
                    nextSlide();
                } else {
                    // Swipe right - previous slide
                    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
                    showSlide(prev);
                }
            }
        }
    }
});