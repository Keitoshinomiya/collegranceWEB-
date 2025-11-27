// COLLEGRANCE Refined Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            // Toggle active class on both hamburger and menu
            const isActive = navMenu.classList.contains('active');
            
            if (isActive) {
                navMenu.classList.remove('active');
                // hamburger icon animation logic if needed (currently CSS handles simple lines)
            } else {
                navMenu.classList.add('active');
            }
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
    
    // 2. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
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
    
    // 3. Header Scroll Effect (Minimal)
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 1px 5px rgba(0,0,0,0.05)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

    // 4. Amazon Link Updater
    const amazonStoreURL = 'http://www.amazon.co.jp/collegrance';
    document.querySelectorAll('a').forEach(link => {
        // Only target specific placeholder links
        if (link.getAttribute('href') === '#' && (link.textContent.includes('Amazon') || link.classList.contains('btn-primary'))) {
            link.href = amazonStoreURL;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
    });
    
    // 5. Fragrance Quiz Logic
    const quizModal = document.getElementById('fragranceQuizModal');
    const startBtn = document.getElementById('fragranceQuiz');
    const closeBtn = document.querySelector('.quiz-close');
    
    if (quizModal && startBtn) {
        startBtn.addEventListener('click', () => {
            quizModal.style.display = 'block';
            resetQuiz();
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                quizModal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === quizModal) {
                quizModal.style.display = 'none';
            }
        });
        
        // Quiz State
        let currentStep = 1;
        let answers = {};
        
        // Database
        const recommendations = {
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
            'default': {
                title: 'バランス・クラシック',
                description: 'どんなシーンにも合う万能な香り。上品で洗練された、誰からも愛される香りです。',
                image: 'https://page.gensparksite.com/v1/base64_upload/a5e9db2030063924bb2b93f58db6a186',
                brands: ['エルメス', 'ルラボ', 'ディプティック']
            }
        };
        
        function resetQuiz() {
            currentStep = 1;
            answers = {};
            document.querySelectorAll('.quiz-step').forEach(el => el.style.display = 'none');
            document.getElementById('quizResult').style.display = 'none';
            document.getElementById('step1').style.display = 'block';
        }
        
        // Option Click Handler
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', function() {
                const answer = this.dataset.answer;
                
                if (currentStep === 1) {
                    answers.scene = answer;
                    goToStep(2);
                } else if (currentStep === 2) {
                    answers.type = answer;
                    goToStep(3);
                } else if (currentStep === 3) {
                    answers.strength = answer;
                    showResult();
                }
            });
        });
        
        function goToStep(step) {
            document.getElementById(`step${currentStep}`).style.display = 'none';
            currentStep = step;
            document.getElementById(`step${currentStep}`).style.display = 'block';
        }
        
        function showResult() {
            document.getElementById(`step${currentStep}`).style.display = 'none';
            const resultDiv = document.getElementById('quizResult');
            resultDiv.style.display = 'block';
            
            // Logic to pick recommendation
            const key = `${answers.scene}-${answers.type}-${answers.strength}`;
            const data = recommendations[key] || recommendations['default'];
            
            // Render
            document.getElementById('resultImage').src = data.image;
            document.getElementById('resultTitle').textContent = data.title;
            document.getElementById('resultDescription').textContent = data.description;
            
            const brandsDiv = document.getElementById('resultBrands');
            brandsDiv.innerHTML = '';
            data.brands.forEach(b => {
                const span = document.createElement('span');
                span.className = 'brand-tag';
                span.textContent = b;
                brandsDiv.appendChild(span);
            });
        }
    }

    // 6. Trust Stats Counter Animation
    const statsSection = document.querySelector('.trust-stats');
    if (statsSection) {
        const options = {
            root: null,
            threshold: 0.5 // Trigger when 50% visible
        };
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('data-target');
                        const duration = 2000; // Animation duration in ms
                        const increment = target / (duration / 16); // 60fps
                        
                        let current = 0;
                        const updateCounter = () => {
                            current += increment;
                            if (current < target) {
                                counter.innerText = Math.ceil(current).toLocaleString();
                                requestAnimationFrame(updateCounter);
                            } else {
                                counter.innerText = target.toLocaleString();
                            }
                        };
                        
                        updateCounter();
                    });
                    
                    observer.unobserve(entry.target);
                }
            });
        }, options);
        
        observer.observe(statsSection);
    }
    
    console.log('COLLEGRANCE website loaded.');
    // 7. Ranking Carousel Logic (Drag to Scroll)
    const slider = document.querySelector('.ranking-track');
    let isDown = false;
    let startX;
    let scrollLeft;

    if (slider) {
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });
    }

    // 8. Remove unwanted Cookie Banner if exists
    const cookieBanner = document.getElementById('cookie-consent-banner') || document.querySelector('.cookie-banner');
    if (cookieBanner) {
        cookieBanner.style.display = 'none';
    }
}); // End of DOMContentLoaded

/* Carousel Navigation */
function scrollCarousel(type, direction) {
    const trackId = type + 'Track';
    const track = document.getElementById(trackId);
    
    if (!track) return;
    
    // Determine item width
    let item = track.querySelector('.carousel-item') || track.querySelector('.review-card');
    if (!item) return;
    
    // Get style to find gap
    const style = window.getComputedStyle(track);
    const gap = parseInt(style.columnGap || style.gap || '30');
    
    const itemWidth = item.offsetWidth;
    const scrollAmount = (itemWidth + gap) * direction;
    
    track.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
    
    // Update scroll hint visibility
    updateScrollState(type);
}

function updateScrollState(type) {
    const track = document.getElementById(type + 'Track');
    const container = track.closest('.carousel-container');
    if (!track || !container) return;
    
    const maxScroll = track.scrollWidth - track.clientWidth;
    
    if (track.scrollLeft < maxScroll - 10) {
        container.classList.add('can-scroll-right');
    } else {
        container.classList.remove('can-scroll-right');
    }
}

// Add scroll listeners to update state
document.addEventListener('DOMContentLoaded', () => {
    ['ranking', 'reviews'].forEach(type => {
        const track = document.getElementById(type + 'Track');
        if (track) {
            track.addEventListener('scroll', () => updateScrollState(type));
            updateScrollState(type); // Initial check
        }
    });
});
