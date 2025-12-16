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
    // Separate listener for clarity and performance
    const productFilterContainer = document.querySelector('.filter-container');
    if (productFilterContainer) {
        productFilterContainer.addEventListener('click', function(e) {
            const productBtn = e.target.closest('.filter-btn');
            if (!productBtn) return;

            e.preventDefault();
            
            // Update Active State
            productFilterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            productBtn.classList.add('active');

            const filterValue = productBtn.getAttribute('data-filter');
            const cards = document.querySelectorAll('.product-card-simple');
            
            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category') || card.getAttribute('data-color');
                const safeCategory = cardCategory ? cardCategory.toLowerCase() : '';
                const safeFilter = filterValue.toLowerCase();

                let isMatch = (safeFilter === 'all') || (safeCategory === safeFilter);

                if (isMatch) {
                    card.classList.remove('is-hidden');
                    card.style.display = ''; // Clear inline style to revert to CSS
                    
                    // Trigger reflow for animation
                    void card.offsetWidth; 
                    
                    card.style.opacity = '1';
                } else {
                    card.classList.add('is-hidden');
                    card.style.display = 'none'; // Ensure it is hidden
                    card.style.opacity = '0';
                }
            });
        });
    }

    // --- 18. Journal Filter Logic (Journal Page) ---
    const journalFilterBar = document.querySelector('.filter-bar');
    if (journalFilterBar) {
        journalFilterBar.addEventListener('click', function(e) {
            const journalBtn = e.target.closest('.filter-item');
            if (!journalBtn) return;

            e.preventDefault();

            // Update Active State
            journalFilterBar.querySelectorAll('.filter-item').forEach(b => b.classList.remove('active'));
            journalBtn.classList.add('active');

            const filterValue = journalBtn.getAttribute('data-filter');
            const cards = document.querySelectorAll('.journal-card');

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                const safeCategory = cardCategory ? cardCategory.toLowerCase() : '';
                const safeFilter = filterValue.toLowerCase();

                let isMatch = (safeFilter === 'all') || (safeCategory === safeFilter);

                if (isMatch) {
                    card.classList.remove('is-hidden');
                    card.style.display = ''; // Clear inline style
                    
                    // Simple Fade In
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.classList.add('is-hidden');
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }
            });
        });
    }

    // --- 19. Advanced Fragrance Quiz Logic (v3.2) ---
    // Initialize Restart Logic
    const restartBtn = document.getElementById('btn-quiz-restart');
    const restartBtnNew = document.getElementById('btn-quiz-restart-new');
    
    // Bind both old and new restart buttons if they exist
    [restartBtn, restartBtnNew].forEach(btn => {
        if(btn) {
            btn.addEventListener('click', () => {
                window.restartQuiz();
            });
        }
    });

    // Close Result Logic
    const closeResultBtn = document.getElementById('btn-quiz-close-result');
    if(closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
             const modal = document.getElementById('fragranceQuizModal');
             if(modal) modal.style.display = 'none';
             
             // Reset for next time
             setTimeout(() => {
                window.restartQuiz();
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

// --- Advanced Quiz System Functions ---
// Enhanced Product Database with Scoring Tags
const quizProducts = [
    // Citrus / Fresh / Clean
    { 
        id: 'ck_one', 
        brand: 'Calvin Klein', 
        name: 'ck one', 
        img: 'assets/images/CK-One-EDT.jpg',
        top: 'Bergamot', mid: 'Green Tea', base: 'Musk',
        desc: '世界中で愛されるユニセックスフレグランスの金字塔。ピュアで清潔感のある香りは、オフィスからカジュアルまであらゆるシーンに馴染みます。',
        link: 'https://www.amazon.co.jp/dp/B0FSKMB6HR',
        tags: { scene: ['office', 'daily', 'relax'], type: ['citrus', 'clean'], impression: ['clean', 'friendly'], strength: ['light', 'medium'] }
    },
    { 
        id: 'light_blue', 
        brand: 'Dolce & Gabbana', 
        name: 'Light Blue', 
        img: 'assets/images/DG-LightBlue-EDT.jpg',
        top: 'Sicilian Lemon', mid: 'Apple', base: 'Cedarwood',
        desc: '地中海の陽光を思わせる、とびきりフレッシュなシトラス。気分をリフレッシュさせたい時や、夏の日のスタイルに完璧にマッチします。',
        link: 'https://www.amazon.co.jp/dp/B0FSKNWDG8',
        tags: { scene: ['daily', 'relax', 'office'], type: ['citrus', 'fruity'], impression: ['friendly', 'clean'], strength: ['light', 'medium'] }
    },
    { 
        id: 'blanche', 
        brand: 'BYREDO', 
        name: 'Blanche', 
        img: 'assets/images/BYR-Blanche-EDP.jpg',
        top: 'White Rose', mid: 'Neroli', base: 'Musk',
        desc: '「白」という色を香りで表現した、究極の清潔感。洗いたてのリネンや石鹸を思わせる香りは、誰からも好印象を持たれる魔法の一本。',
        link: 'https://www.amazon.co.jp/dp/B0FRG5XX2Q',
        tags: { scene: ['office', 'daily', 'date'], type: ['clean', 'floral'], impression: ['clean', 'sophisticated'], strength: ['medium', 'light'] }
    },
    { 
        id: 'nile', 
        brand: 'HERMÈS', 
        name: 'Un Jardin sur le Nil', 
        img: 'assets/images/HRM-Nile-EDT.jpg',
        top: 'Green Mango', mid: 'Lotus', base: 'Sycamore',
        desc: 'ナイル川のほとりを散策しているかのような、水と緑の瑞々しさ。甘さを抑えたグリーンマンゴーの香りが、知的で涼やかな印象を与えます。',
        link: 'https://www.amazon.co.jp/dp/B0FSKQGK6Z',
        tags: { scene: ['office', 'relax', 'daily'], type: ['citrus', 'green'], impression: ['sophisticated', 'clean', 'unique'], strength: ['medium', 'light'] }
    },
    { 
        id: 'issey', 
        brand: 'ISSEY MIYAKE', 
        name: 'L\'Eau d\'Issey', 
        img: 'assets/images/ISY-LdIssey-EDT.jpg',
        top: 'Lotus', mid: 'Lily', base: 'Precious Woods',
        desc: '「水の香り」を表現した、透明感あふれるアクアティックフローラル。凛とした強さと優しさを兼ね備え、日本人の美意識に響く香り。',
        link: 'https://www.amazon.co.jp/dp/B0FSKRJKJ7',
        tags: { scene: ['office', 'daily', 'formal'], type: ['clean', 'floral'], impression: ['clean', 'sophisticated'], strength: ['medium'] }
    },
    
    // Floral / Fruity / Sweet
    { 
        id: 'english_pear', 
        brand: 'Jo Malone London', 
        name: 'English Pear & Freesia', 
        img: 'assets/images/JML-EnglishPear-C.jpg',
        top: 'King William Pear', mid: 'Freesia', base: 'Patchouli',
        desc: '熟した洋梨の瑞々しさと、白いフリージアのブーケ。英国の果樹園にいるような、優雅で愛らしい香り。好感度No.1のベストセラー。',
        link: 'https://www.amazon.co.jp/dp/B0FSKNWSN5',
        tags: { scene: ['daily', 'date', 'office'], type: ['floral', 'fruity'], impression: ['friendly', 'clean'], strength: ['light', 'medium'] }
    },
    { 
        id: 'rose_gold', 
        brand: 'TIFFANY & CO.', 
        name: 'Rose Gold', 
        img: 'assets/images/TFFY-RoseGold-EDP.jpg',
        top: 'Blackcurrant', mid: 'Blue Rose', base: 'Ambrette',
        desc: 'ティファニーらしい透明感と、ローズゴールドの温かみを表現。フルーティなトップから上品なローズへ移ろう、女性らしさを高める香り。',
        link: 'https://www.amazon.co.jp/dp/B0FSKRCH5G',
        tags: { scene: ['date', 'office', 'special'], type: ['floral', 'fruity'], impression: ['sophisticated', 'feminine'], strength: ['medium'] }
    },
    { 
        id: 'libre', 
        brand: 'YVES SAINT LAURENT', 
        name: 'LIBRE', 
        img: 'assets/images/YSL-Libre-EDP.jpg',
        top: 'Lavender', mid: 'Orange Blossom', base: 'Vanilla',
        desc: 'マスキュリンなラベンダーとフェミニンなオレンジブロッサムの衝突。自由を愛する女性のための、クールでセクシーなフローラルラベンダー。',
        link: 'https://www.amazon.co.jp/dp/B0FSKSG813',
        tags: { scene: ['night', 'special', 'office'], type: ['floral', 'oriental'], impression: ['sophisticated', 'sensual', 'unique'], strength: ['heavy', 'medium'] }
    },
    { 
        id: 'hypnotic_poison', 
        brand: 'DIOR', 
        name: 'Hypnotic Poison', 
        img: 'assets/images/DIO-Hypnotic-EDT.jpg',
        top: 'Apricot', mid: 'Jasmine', base: 'Vanilla',
        desc: '媚薬のような甘さと中毒性。バニラとアーモンドが織りなすグルマンノートは、一度香ると忘れられない濃厚な存在感を放ちます。',
        link: 'https://www.amazon.co.jp/dp/B0FSKNF4QC',
        tags: { scene: ['date', 'night', 'relax'], type: ['sweet', 'oriental'], impression: ['sensual', 'unique'], strength: ['heavy', 'unique'] }
    },
    
    // Woody / Musk / Complex
    { 
        id: 'lazy_sunday', 
        brand: 'Maison Margiela', 
        name: 'Lazy Sunday Morning', 
        img: 'assets/images/MRG-LazySun-EDT.jpg',
        top: 'Pear', mid: 'Iris', base: 'White Musk',
        desc: '日曜日の朝、洗い立てのリネンのシーツに包まれて過ごす心地よい時間。肌に馴染む柔らかいムスクは、リラックスしたい日に最適。',
        link: 'https://www.amazon.co.jp/dp/B0FSKSJVDC',
        tags: { scene: ['relax', 'daily', 'date'], type: ['musk', 'clean'], impression: ['clean', 'sensual'], strength: ['light', 'medium'] }
    },
    { 
        id: 'another_13', 
        brand: 'LE LABO', 
        name: 'Another 13', 
        img: 'assets/images/LLB-Another13-EDP.jpg',
        top: 'Ambroxan', mid: 'Jasmine', base: 'Moss',
        desc: '都会的で鋭く、それでいて中毒性のあるアニマリックなムスク。体温と混ざり合うことで「あなただけの香り」に変化する、唯一無二の存在感。',
        link: 'https://www.amazon.co.jp/dp/B0FSKQLTQN',
        tags: { scene: ['daily', 'special', 'date'], type: ['musk', 'woody'], impression: ['unique', 'sophisticated', 'sensual'], strength: ['medium', 'unique'] }
    },
    { 
        id: 'fleur_de_peau', 
        brand: 'DIPTYQUE', 
        name: 'Fleur de Peau', 
        img: 'assets/images/DPTY-FdPeau-EDP.jpg',
        top: 'Pink Pepper', mid: 'Iris', base: 'Musk',
        desc: '「肌の花」という名の通り、肌に溶け込むようなパウダリーなムスク。アイリスの優雅さとピンクペッパーのアクセントが、知的な色気を演出します。',
        link: 'https://www.amazon.co.jp/dp/B0FSKQWRJM',
        tags: { scene: ['date', 'office', 'relax'], type: ['musk', 'floral'], impression: ['sensual', 'sophisticated'], strength: ['medium', 'light'] }
    },
    { 
        id: 'loewe_woman', 
        brand: 'LOEWE', 
        name: '001 Woman', 
        img: 'assets/images/LOW-Woman-EDP.jpg',
        top: 'Bergamot', mid: 'Sandalwood', base: 'Vanilla',
        desc: '新しい始まりを予感させる、モダンで温かみのある香り。バニラとサンダルウッドの甘さが、優しく包み込むように香ります。',
        link: 'https://www.amazon.co.jp/dp/B0FSKPQPZ7',
        tags: { scene: ['date', 'daily', 'relax'], type: ['woody', 'sweet'], impression: ['friendly', 'sensual'], strength: ['medium'] }
    },
    { 
        id: 'loewe_man', 
        brand: 'LOEWE', 
        name: '001 Man', 
        img: 'assets/images/LOW-Man-EDT.jpg',
        top: 'Cardamom', mid: 'Cypress', base: 'White Musk',
        desc: 'Womanと対になる、落ち着きのあるウッディノート。ヒノキのような清々しさとムスクの余韻が、知的で落ち着いた大人の余裕を感じさせます。',
        link: 'https://www.amazon.co.jp/dp/B0FSKQ8QV8',
        tags: { scene: ['office', 'date', 'relax'], type: ['woody', 'spicy'], impression: ['sophisticated', 'clean'], strength: ['medium'] }
    },
    { 
        id: 'orpheon', 
        brand: 'DIPTYQUE', 
        name: 'Orpheon', 
        img: 'assets/images/DPTY-Orpheon-EDP.jpg',
        top: 'Juniper Berry', mid: 'Jasmine', base: 'Powder',
        desc: '60年代のパリのバーの雰囲気を再現。タバコの煙、パウダリーな化粧、木の温もり。知的でミステリアスな印象を与える香り。',
        link: 'https://www.amazon.co.jp/dp/B0FSKMB6HG',
        tags: { scene: ['night', 'bar', 'special'], type: ['woody', 'spicy'], impression: ['sophisticated', 'sensual', 'unique'], strength: ['medium', 'heavy'] }
    },
    { 
        id: 'jazz_club', 
        brand: 'Maison Margiela', 
        name: 'Jazz Club', 
        img: 'assets/images/MRG-JazzClub-EDT.jpg',
        top: 'Pink Pepper', mid: 'Rum', base: 'Tobacco',
        desc: 'ブルックリンのジャズクラブ。ラム酒の甘さとタバコの葉のスモーキーさが絡み合う、大人のためのセクシーで甘美な香り。',
        link: 'https://www.amazon.co.jp/dp/B0FSKQBBXN',
        tags: { scene: ['date', 'special', 'night'], type: ['woody', 'sweet'], impression: ['sensual', 'unique'], strength: ['heavy', 'unique'] }
    },
    { 
        id: 'the_time', 
        brand: 'THE HOUSE OF OUD', 
        name: 'The Time', 
        img: 'assets/images/THO-TheTime-EDP.jpg',
        top: 'Bergamot', mid: 'Blue Tea', base: 'Musk',
        desc: '「日本のティータイム」にインスパイアされた、静寂と調和の香り。ブルーティーと花々の香りが、忙しい日々に安らぎをもたらします。',
        link: 'https://www.amazon.co.jp/dp/B0FSKT7V2N',
        tags: { scene: ['relax', 'office', 'daily'], type: ['clean', 'floral', 'tea'], impression: ['sophisticated', 'unique', 'clean'], strength: ['light', 'medium'] }
    },
    { 
        id: 'sauvage', 
        brand: 'DIOR', 
        name: 'Sauvage', 
        img: 'assets/images/DIO-Sauvage-EDT.jpg',
        top: 'Bergamot', mid: 'Pepper', base: 'Ambroxan',
        desc: '広大な大地にインスパイアされた、野性的で力強い香り。フレッシュなシトラスとスパイシーなウッディが、自信と活力を与えてくれます。',
        link: 'https://www.amazon.co.jp/dp/B0FSKQW44P',
        tags: { scene: ['night', 'date', 'daily'], type: ['spicy', 'citrus'], impression: ['masculine', 'sophisticated'], strength: ['heavy', 'medium'] }
    }
];

// Logic Variables
let quizAnswers = {};
const totalSteps = 4;

// Update Progress Bar
window.updateProgress = (step) => {
    const percentage = ((step - 1) / totalSteps) * 100;
    const bar = document.getElementById('progressBar');
    if(bar) bar.style.width = percentage + '%';
};

// Next Step Function
window.nextStep = (currentStepNum, key, value) => {
    // Save Answer
    quizAnswers[key] = value;

    // Animate Current Step Out
    const currentEl = document.getElementById('step' + currentStepNum);
    if(currentEl) {
        currentEl.style.opacity = '0';
        currentEl.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            currentEl.style.display = 'none';
            
            // Animate Next Step In
            const nextStepNum = currentStepNum + 1;
            const nextEl = document.getElementById('step' + nextStepNum);
            
            if(nextEl) {
                nextEl.style.display = 'block';
                nextEl.style.opacity = '0';
                nextEl.style.transform = 'translateX(20px)';
                
                window.updateProgress(nextStepNum);
                
                // Force Reflow
                void nextEl.offsetWidth;
                
                nextEl.style.opacity = '1';
                nextEl.style.transform = 'translateX(0)';
            }
        }, 300);
    }
};

// Finish Quiz Function
window.finishQuiz = (key, value) => {
    quizAnswers[key] = value;
    
    // Hide Step 4
    const step4 = document.getElementById('step4');
    if(step4) {
        step4.style.opacity = '0';
        setTimeout(() => {
            step4.style.display = 'none';
            window.showAnalyzing();
        }, 300);
    }
};

// Show Analysis Animation
window.showAnalyzing = () => {
    const analyzingEl = document.getElementById('analyzingView');
    if(analyzingEl) {
        analyzingEl.style.display = 'block';
        window.updateProgress(5); // Full bar

        // Simulate AI Processing
        setTimeout(() => {
            analyzingEl.style.display = 'none';
            window.calculateAndShowResult();
        }, 1800);
    }
};

// Calculate & Show Result
window.calculateAndShowResult = () => {
    // Scoring Logic
    const scores = quizProducts.map(product => {
        let score = 0;
        
        // 1. Scene Matching (Weight: 3)
        if (product.tags.scene.includes(quizAnswers.scene)) score += 3;
        
        // 2. Type Matching (Weight: 3) - Balanced with others
        // Allow partial match (e.g. citrus vs fresh) mapped roughly
        const typeMap = {
            'citrus': ['citrus', 'fresh', 'clean', 'tea'],
            'floral': ['floral', 'fruity', 'sweet', 'oriental'],
            'woody': ['woody', 'spicy', 'masculine'],
            'musk': ['musk', 'clean', 'skin', 'oriental']
        };
        
        const targetTypes = typeMap[quizAnswers.scent_type] || [];
        const hasTypeMatch = product.tags.type.some(t => targetTypes.includes(t));
        if (hasTypeMatch) score += 3;
        
        // 3. Impression Matching (Weight: 3) - Increased Importance
        if (product.tags.impression.includes(quizAnswers.impression)) score += 3;
        
        // 4. Strength Matching (Weight: 2) - Increased Importance
        if (product.tags.strength.includes(quizAnswers.strength)) score += 2;

        return { product, score };
    });

    // Sort by Score Descending
    scores.sort((a, b) => b.score - a.score);

    // Get Top 2
    const winner = scores[0].product;
    const runnerUp = scores[1].product;

    // Render Winner
    const resBrand = document.getElementById('resultBrand');
    if(resBrand) resBrand.textContent = winner.brand;
    
    const resName = document.getElementById('resultName');
    if(!resName) {
        // Fallback for ID mismatch if any
        document.getElementById('resultTitle').textContent = winner.name;
    } else {
        resName.textContent = winner.name;
    }
    
    const resImg = document.getElementById('resultImage');
    if(resImg) resImg.src = winner.img;
    
    const resTop = document.getElementById('resultTop');
    if(resTop) resTop.textContent = winner.top;
    
    const resMid = document.getElementById('resultMid');
    if(resMid) resMid.textContent = winner.mid;
    
    const resBase = document.getElementById('resultBase');
    if(resBase) resBase.textContent = winner.base;
    
    const resDesc = document.getElementById('resultDescription');
    if(resDesc) resDesc.textContent = winner.desc;
    
    const resLink = document.getElementById('resultLink');
    if(resLink) resLink.href = winner.link;

    // Render Runner Up
    const secRec = document.getElementById('secondRecommendation');
    if(secRec) {
        secRec.onclick = () => { window.location.href = runnerUp.link; };
        const secImg = document.getElementById('secImg');
        if(secImg) secImg.src = runnerUp.img;
        
        const secBrand = document.getElementById('secBrand');
        if(secBrand) secBrand.textContent = runnerUp.brand;
        
        const secName = document.getElementById('secName');
        if(secName) secName.textContent = runnerUp.name;
    }

    // Show Result View
    const resView = document.getElementById('resultView');
    if(resView) {
        resView.style.display = 'block';
        setTimeout(() => {
            resView.style.opacity = '1';
        }, 50);
    }
};

// Restart Quiz Function
window.restartQuiz = () => {
    const resView = document.getElementById('resultView');
    if(resView) {
        resView.style.opacity = '0';
        
        setTimeout(() => {
            resView.style.display = 'none';
            
            quizAnswers = {};
            const step1 = document.getElementById('step1');
            if(step1) step1.style.display = 'block';
            window.updateProgress(1);
            
            // Reset Animations
            step1.style.opacity = '1';
            step1.style.transform = 'translateX(0)';
        }, 500);
    }
};
