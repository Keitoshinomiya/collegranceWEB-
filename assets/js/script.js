// COLLEGRANCE Main Script (Pro Version)
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Scroll Reveal Animation (Apple-style) ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Apply observer to elements with .reveal-on-scroll
    document.querySelectorAll('.reveal-on-scroll, section, .product-card-simple, .journal-card').forEach(el => {
        el.classList.add('reveal-on-scroll'); // Force class if missing
        observer.observe(el);
    });


    // --- 2. Brand Search Modal (Selection Based) ---
    // Expanded Product Database based on index.html content
    const productDatabase = [
        { id: 1, name: "Blanche", brand: "BYREDO", type: "EDP", img: "assets/images/BYR-Blanche-EDP.jpg", url: "index.html#products" },
        { id: 2, name: "ck one", brand: "Calvin Klein", type: "EDT", img: "assets/images/CK-One-EDT.jpg", url: "index.html#products" },
        { id: 3, name: "Hypnotic Poison", brand: "DIOR", type: "EDT", img: "assets/images/DIO-Hypnotic-EDT.jpg", url: "index.html#products" },
        { id: 4, name: "Sauvage", brand: "DIOR", type: "EDT", img: "assets/images/DIO-Sauvage-EDT.jpg", url: "index.html#products" },
        { id: 5, name: "Orpheon", brand: "DIPTYQUE", type: "EDP", img: "assets/images/DPTY-Orpheon-EDP.jpg", url: "index.html#products" },
        { id: 6, name: "Light Blue", brand: "Dolce & Gabbana", type: "EDT", img: "assets/images/DG-LightBlue-EDT.jpg", url: "index.html#products" },
        { id: 7, name: "Un Jardin sur le Nil", brand: "HERMÈS", type: "EDT", img: "assets/images/HRM-Nile-EDT.jpg", url: "index.html#products" },
        { id: 8, name: "L'Eau d'Issey", brand: "ISSEY MIYAKE", type: "EDT", img: "assets/images/ISY-LdIssey-EDT.jpg", url: "index.html#products" },
        { id: 9, name: "English Pear & Freesia", brand: "Jo Malone London", type: "Cologne", img: "assets/images/JML-EnglishPear-C.jpg", url: "index.html#products" },
        { id: 10, name: "Another 13", brand: "LE LABO", type: "EDP", img: "assets/images/LLB-Another13-EDP.jpg", url: "index.html#products" },
        { id: 11, name: "001 Woman", brand: "LOEWE", type: "EDP", img: "assets/images/LOW-Woman-EDP.jpg", url: "index.html#products" },
        { id: 12, name: "001 Man", brand: "LOEWE", type: "EDT", img: "assets/images/LOW-Man-EDT.jpg", url: "index.html#products" },
        { id: 13, name: "Lazy Sunday Morning", brand: "Maison Margiela", type: "EDT", img: "assets/images/MRG-LazySun-EDT.jpg", url: "index.html#products" },
        { id: 14, name: "Rose Gold", brand: "TIFFANY & CO.", type: "EDP", img: "assets/images/TFFY-RoseGold-EDP.jpg", url: "index.html#products" },
        { id: 15, name: "LIBRE", brand: "YVES SAINT LAURENT", type: "EDP", img: "assets/images/YSL-Libre-EDP.jpg", url: "index.html#products" },
        { id: 16, name: "Jazz Club", brand: "Maison Margiela", type: "EDT", img: "assets/images/MRG-JazzClub-EDT.jpg", url: "index.html#products" },
        { id: 17, name: "Fleur de Peau", brand: "DIPTYQUE", type: "EDP", img: "assets/images/DPTY-FdPeau-EDP.jpg", url: "index.html#products" },
        { id: 18, name: "The Time", brand: "THE HOUSE OF OUD", type: "EDP", img: "assets/images/THO-TheTime-EDP.jpg", url: "index.html#products" }
    ];

    // Extract unique brands and sort them
    const brands = [...new Set(productDatabase.map(p => p.brand))].sort();

    let searchModal = document.querySelector('.search-modal');
    if (!searchModal) {
        searchModal = document.createElement('div');
        searchModal.className = 'search-modal';
        searchModal.innerHTML = `
            <button class="search-close-btn">&times;</button>
            <div class="search-container">
                <h3 class="search-title">SEARCH BY BRAND</h3>
                <div class="search-brand-list">
                    <!-- Brand buttons will be injected here -->
                </div>
                <div class="search-results-container" style="display:none;">
                    <h4 class="search-results-title">RESULTS</h4>
                    <div class="search-results"></div>
                    <button class="back-to-brands-btn">Select Another Brand</button>
                </div>
            </div>
        `;
        document.body.appendChild(searchModal);
    }

    const brandListContainer = searchModal.querySelector('.search-brand-list');
    const resultsContainer = searchModal.querySelector('.search-results-container');
    const searchResults = searchModal.querySelector('.search-results');
    const closeBtn = searchModal.querySelector('.search-close-btn');
    const backBtn = searchModal.querySelector('.back-to-brands-btn');

    // Populate Brand Buttons
    function renderBrands() {
        brandListContainer.innerHTML = '';
        brands.forEach(brand => {
            const btn = document.createElement('button');
            btn.className = 'search-brand-btn';
            btn.textContent = brand;
            btn.onclick = () => showProductsByBrand(brand);
            brandListContainer.appendChild(btn);
        });
    }
    
    // Initial Render
    renderBrands();

    // Show Products Function
    function showProductsByBrand(brand) {
        // Clear previous results
        searchResults.innerHTML = '';
        
        // Filter products
        const filtered = productDatabase.filter(p => p.brand === brand);
        
        if (filtered.length > 0) {
            filtered.forEach(p => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <img src="${p.img}" class="search-result-thumb" alt="${p.name}">
                    <div class="search-result-info">
                        <h4>${p.name}</h4>
                        <p>${p.brand} | ${p.type}</p>
                    </div>
                `;
                item.addEventListener('click', () => {
                    window.location.href = p.url;
                    searchModal.classList.remove('active');
                });
                searchResults.appendChild(item);
            });
        } else {
            searchResults.innerHTML = '<p style="text-align:center; color:#999;">No products found for this brand.</p>';
        }

        // Switch View
        brandListContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Fade in effect for results
        resultsContainer.style.opacity = 0;
        setTimeout(() => resultsContainer.style.opacity = 1, 50);
    }

    // Back to Brands
    backBtn.addEventListener('click', () => {
        resultsContainer.style.display = 'none';
        brandListContainer.style.display = 'flex'; // Flex is used for grid/wrap layout
    });

    // Open/Close Logic
    window.openSearch = () => {
        searchModal.classList.add('active');
        // Reset view when opening
        resultsContainer.style.display = 'none';
        brandListContainer.style.display = 'flex';
    };

    closeBtn.addEventListener('click', () => {
        searchModal.classList.remove('active');
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            searchModal.classList.remove('active');
        }
    });


    // --- 3. Lazy Load Images (Performance) ---
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
    } else {
        // Fallback could be added here
    }


    // --- 4. Navigation Logic (Enhanced) ---
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // Close menu when ANY link inside nav-menu is clicked
    // This handles standard links, mega-menu links, and CTAs
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger && navMenu && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
    
    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Skip if it's just a placeholder link
            const href = this.getAttribute('href');
            if(href === "#" || !href.startsWith("#")) return;

            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 90;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Header Scroll Effect
    const header = document.querySelector('.header');
    if(header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
            } else {
                header.style.boxShadow = "none";
            }
        });
    }

    // Amazon Link Dynamic Update
    const amazonButtons = document.querySelectorAll('.cta-button, .btn-primary');
    const AMAZON_STORE_URL = "http://www.amazon.co.jp/collegrance"; 

    amazonButtons.forEach(btn => {
        if(btn.textContent.includes("Amazon") || btn.textContent.includes("一覧")) {
             // If it's a generic CTA, point to store. Specific product links should be set in HTML.
             if(btn.getAttribute('href') === "#" || btn.getAttribute('href') === "") {
                 btn.href = AMAZON_STORE_URL;
                 btn.target = "_blank";
                 btn.rel = "noopener";
             }
        }
    });
    
    // Mega Menu Logic (Hover is CSS, but Click for Touch)
    // (Logic handled by CSS hover mostly, but could add touch support here)

    // --- 16. Campaign Modal Logic (Auto Open) ---
    const campaignModal = document.getElementById('campaignModal');
    const closeCampaignBtn = document.querySelector('.campaign-modal-close');
    const cModalBtn = document.querySelector('.c-modal-btn');

    // Auto open after delay (e.g. 2.5s) if not seen
    if (campaignModal && !sessionStorage.getItem('campaignSeen')) {
        setTimeout(() => {
            campaignModal.style.display = "block";
            sessionStorage.setItem('campaignSeen', 'true');
        }, 2500);
    }

    if (closeCampaignBtn) {
        closeCampaignBtn.onclick = function() {
            campaignModal.style.display = "none";
        }
    }

    if (cModalBtn) {
        cModalBtn.onclick = function() {
            campaignModal.style.display = "none";
        }
    }

    // Modal Logic (Fragrance Quiz & Campaign)
    window.onclick = function(event) {
        const quizModal = document.getElementById('fragranceQuizModal');
        const campModal = document.getElementById('campaignModal');
        
        if (event.target == quizModal) {
            quizModal.style.display = "none";
        }
        if (event.target == campModal) {
            campModal.style.display = "none";
        }
    }
    
    const closeSpan = document.getElementsByClassName("quiz-close")[0];
    if(closeSpan) {
        closeSpan.onclick = function() {
            document.getElementById('fragranceQuizModal').style.display = "none";
        }
    }

    // --- 13. Dynamic Journal Rendering ---
    if (window.journalArticles) {
        // Sort by date descending
        const sortedArticles = window.journalArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Mega Menu Latest Story (Top 1)
        const megaMenuLatestContainer = document.getElementById('mega-menu-latest-article');
        if (megaMenuLatestContainer) {
            const latestArticle = sortedArticles[0];
            if (latestArticle) {
                const megaMenuHTML = `
                    <a href="${latestArticle.link}" class="featured-card">
                        <div class="featured-image">
                            <img src="${latestArticle.image}" alt="${latestArticle.title}">
                        </div>
                        <div class="featured-info">
                            <h4>${latestArticle.title}</h4>
                            <p class="brand-name">${latestArticle.category}</p>
                            <p class="featured-desc">${latestArticle.excerpt}</p>
                        </div>
                    </a>
                `;
                megaMenuLatestContainer.innerHTML = megaMenuHTML;
            }
        }

        // Main Journal Section (Top Page Carousel)
        const journalTrack = document.getElementById('journalTrack');
        if (journalTrack) {
             // Use top 6 articles
            const articlesToShow = sortedArticles.slice(0, 6);
            
            // Clear waiting message
            journalTrack.innerHTML = '';

            articlesToShow.forEach(article => {
                const card = document.createElement('div');
                card.className = 'journal-card carousel-item'; // Use generic carousel item class
                card.innerHTML = `
                    <div class="journal-image-wrapper">
                        <a href="${article.link}">
                            <img src="${article.image}" alt="${article.title}" class="journal-image" loading="lazy">
                        </a>
                    </div>
                    <div class="journal-content">
                        <span class="journal-category">${article.category}</span>
                        <span class="journal-date">${article.date.replace(/-/g, '.')}</span>
                        <a href="${article.link}" style="text-decoration:none; color:inherit;">
                            <h3 class="journal-title">${article.title}</h3>
                        </a>
                        <p class="journal-excerpt">${article.excerpt}</p>
                        <a href="${article.link}" class="journal-link">READ MORE <span class="arrow">&rarr;</span></a>
                    </div>
                `;
                journalTrack.appendChild(card);
            });
        }
    }

    // --- 14. FAQ Accordion Logic ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all others (Optional - maybe user wants multiple open)
            // document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));

            if (!isActive) {
                faqItem.classList.add('active');
            } else {
                faqItem.classList.remove('active');
            }
        });
    });

    // --- 15. Trust Section Counter Animation ---
    const counters = document.querySelectorAll('.stat-number');
    const counterObserverOptions = {
        root: null,
        threshold: 0.5
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const targetText = counter.getAttribute('data-target');
                const target = parseInt(targetText);
                
                // If target is NaN, skip
                if (isNaN(target)) return;

                const duration = 2000; // 2 seconds
                const start = 0;
                const startTime = performance.now();

                const updateCounter = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Ease out quart
                    const ease = 1 - Math.pow(1 - progress, 4);
                    
                    const current = Math.floor(start + (target - start) * ease);
                    counter.textContent = current;

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };

                requestAnimationFrame(updateCounter);
                observer.unobserve(counter);
            }
        });
    }, counterObserverOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    // --- 16. Product Notes Interaction (Mobile Click) ---
    // Use event delegation for better performance and robustness
    document.body.addEventListener('click', function(e) {
        // Check if clicked element is inside product-image-container
        const container = e.target.closest('.product-image-container');
        
        if (container) {
            // Only execute on mobile/tablet (width <= 768px)
            // OR if user explicitly wants click behavior on touch devices regardless of width
            if (window.innerWidth <= 768 || 'ontouchstart' in window) {
                
                // Toggle logic
                const wasActive = container.classList.contains('active');
                
                // Close all others first
                document.querySelectorAll('.product-image-container.active').forEach(c => {
                    c.classList.remove('active');
                });
                
                // If it wasn't active, make it active (toggle behavior)
                if (!wasActive) {
                    container.classList.add('active');
                }
            }
        } else {
            // Clicked outside - close all on mobile
            if (window.innerWidth <= 768) {
                document.querySelectorAll('.product-image-container.active').forEach(c => {
                    c.classList.remove('active');
                });
            }
        }
    });

    // --- 17. Product Filter Logic (Collection Page) ---
    document.addEventListener('click', function(e) {
        // Product Filter
        const productBtn = e.target.closest('.filter-btn');
        if (productBtn) {
            e.preventDefault();
            // Update UI
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            productBtn.classList.add('active');

            const filterValue = productBtn.getAttribute('data-filter');
            const cards = document.querySelectorAll('.product-card-simple');
            
            cards.forEach(card => {
                // Check data-category (semantic) first, fallback to data-color (legacy)
                const cardCategory = card.getAttribute('data-category') || card.getAttribute('data-color');
                
                let isMatch = false;
                if (filterValue === 'all') {
                    isMatch = true;
                } else if (cardCategory && cardCategory.toLowerCase() === filterValue.toLowerCase()) {
                    isMatch = true;
                }

                if (isMatch) {
                    card.style.display = ''; // Revert to CSS (Grid Item)
                    card.classList.remove('hidden');
                    // Simple Fade Animation
                    card.style.opacity = '0';
                    card.style.animation = 'none';
                    setTimeout(() => {
                         card.style.opacity = '1';
                         card.style.animation = 'fadeIn 0.5s forwards';
                    }, 10);
                } else {
                    card.style.display = 'none';
                    card.classList.add('hidden');
                }
            });
        }

        // --- 18. Journal Filter Logic (Journal Page) ---
        const journalBtn = e.target.closest('.filter-item');
        if (journalBtn) {
            e.preventDefault();
            // Update UI
            document.querySelectorAll('.filter-item').forEach(b => b.classList.remove('active'));
            journalBtn.classList.add('active');

            const filterValue = journalBtn.getAttribute('data-filter');
            const cards = document.querySelectorAll('.journal-card');

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                let isMatch = false;
                if (filterValue === 'all') {
                    isMatch = true;
                } else if (cardCategory && cardCategory.toLowerCase() === filterValue.toLowerCase()) {
                    isMatch = true;
                }

                if (isMatch) {
                    card.style.display = ''; // Revert to CSS (Flex)
                    // Fade Animation
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.style.display = 'none';
                }
            });
        }
    });

    // --- 19. Fragrance Quiz Logic ---
    const quizOptions = document.querySelectorAll('.quiz-option');
    const quizResult = document.getElementById('quizResult');
    let currentStep = 1;
    let userAnswers = {};

    const quizDatabase = [
        // Citrus & Green
        { type: 'citrus', brand: 'Calvin Klein', name: 'ck one', img: 'assets/images/CK-One-EDT.jpg', top: 'Bergamot', mid: 'Green Tea', base: 'Musk', desc: '誰もが愛する王道のシトラス。迷ったらまずはコレ。', link: 'https://www.amazon.co.jp/dp/B0FSKMB6HR' },
        // Warm & Gourmand
        { type: 'warm', brand: 'Maison Margiela', name: 'Jazz Club', img: 'assets/images/MRG-JazzClub-EDT.jpg', top: 'Pink Pepper', mid: 'Rum', base: 'Tobacco', desc: '甘くスモーキーな大人の香り。夜のデートに最適。', link: 'https://www.amazon.co.jp/dp/B0FSKQBBXN' },
        // Clean & Musk
        { type: 'clean', brand: 'BYREDO', name: 'Blanche', img: 'assets/images/BYR-Blanche-EDP.jpg', top: 'White Rose', mid: 'Neroli', base: 'Musk', desc: '洗いたてのシーツのような、究極の清潔感。', link: 'https://www.amazon.co.jp/dp/B0FRG5XX2Q' },
        // Floral & Fruity
        { type: 'floral', brand: 'TIFFANY & CO.', name: 'Rose Gold', img: 'assets/images/TFFY-RoseGold-EDP.jpg', top: 'Blackcurrant', mid: 'Blue Rose', base: 'Ambrette', desc: '透明感のあるローズとフルーツの華やかな香り。', link: 'https://www.amazon.co.jp/dp/B0FSKRCH5G' }
    ];

    if (quizOptions.length > 0) {
        quizOptions.forEach(option => {
            option.addEventListener('click', function() {
                const step = this.closest('.quiz-step');
                const stepId = step.id; // step1, step2, etc.
                const answer = this.getAttribute('data-answer');
                
                userAnswers[stepId] = answer;

                // Proceed to next
                if (currentStep < 4) {
                    // Hide current with animation
                    step.style.opacity = '0';
                    setTimeout(() => {
                        step.style.display = 'none';
                        step.style.opacity = '1';
                        
                        currentStep++;
                        const nextStep = document.getElementById('step' + currentStep);
                        if(nextStep) {
                            nextStep.style.display = 'block';
                            // Simple fade in
                            nextStep.style.opacity = '0';
                            setTimeout(() => nextStep.style.opacity = '1', 50);
                        }
                    }, 300);
                } else {
                    // Finished
                    step.style.display = 'none';
                    showQuizResult();
                }
            });
        });
    }

    function showQuizResult() {
        // Simple logic: Determine result based on Step 2 (Category)
        const preferredType = userAnswers['step2']; // citrus, warm, clean, floral
        
        // Find match
        let result = quizDatabase.find(p => p.type === preferredType) || quizDatabase[2]; // Default to clean

        // Render Result
        const resImg = document.getElementById('resultImage');
        if(resImg) resImg.src = result.img;
        
        const resBrand = document.getElementById('resultBrand');
        if(resBrand) resBrand.textContent = result.brand;
        
        const resTitle = document.getElementById('resultTitle');
        if(resTitle) resTitle.textContent = result.name;
        
        const resTop = document.getElementById('resultTop');
        if(resTop) resTop.textContent = result.top;
        
        const resMid = document.getElementById('resultMid');
        if(resMid) resMid.textContent = result.mid;
        
        const resBase = document.getElementById('resultBase');
        if(resBase) resBase.textContent = result.base;
        
        const resDesc = document.getElementById('resultDescription');
        if(resDesc) resDesc.textContent = result.desc;
        
        const resLink = document.getElementById('resultLink');
        if(resLink) resLink.href = result.link;

        // Show Result
        if(quizResult) {
            quizResult.style.display = 'block';
            quizResult.style.opacity = '0';
            setTimeout(() => quizResult.style.opacity = '1', 50);
        }
    }

    // Restart Logic
    const restartBtn = document.getElementById('btn-quiz-restart');
    if(restartBtn) {
        restartBtn.addEventListener('click', () => {
            if(quizResult) quizResult.style.display = 'none';
            currentStep = 1;
            userAnswers = {};
            const step1 = document.getElementById('step1');
            if(step1) step1.style.display = 'block';
        });
    }

    // Close Result Logic
    const closeResultBtn = document.getElementById('btn-quiz-close-result');
    if(closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
             const modal = document.getElementById('fragranceQuizModal');
             if(modal) modal.style.display = 'none';
             
             // Reset for next time
             setTimeout(() => {
                if(quizResult) quizResult.style.display = 'none';
                currentStep = 1;
                const step1 = document.getElementById('step1');
                if(step1) step1.style.display = 'block';
             }, 500);
        });
    }

});

// --- Global Functions ---

// Carousel Scroll Function
window.scrollCarousel = (prefix, direction) => {
    const trackId = prefix + 'Track';
    const trackElement = document.getElementById(trackId);
    if(trackElement) {
        // Scroll amount: width of one item approx (300px)
        const scrollAmount = 320; 
        trackElement.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
};
