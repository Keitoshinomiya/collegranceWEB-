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


    // --- 2. Real-time Search Modal ---
    // Mock Product Data (In a real app, this would be fetched from JSON or API)
    const productDatabase = [
        { id: 1, name: "Lazy Sunday Morning", brand: "Maison Margiela", category: "Floral & Musk", img: "assets/images/MRG-LazySun-EDT.jpg", url: "index.html#products" },
        { id: 2, name: "Santal 33", brand: "LE LABO", category: "Woody", img: "assets/images/placeholder.jpg", url: "index.html#products" },
        { id: 3, name: "Rose Gold", brand: "Tiffany & Co.", category: "Floral", img: "assets/images/tiffany-rosegold-holiday.jpg", url: "article-tiffany-rosegold.html" },
        { id: 4, name: "Jazz Club", brand: "Maison Margiela", category: "Woody & Spicy", img: "assets/images/placeholder.jpg", url: "index.html#products" },
        { id: 5, name: "Do Son", brand: "Diptyque", category: "Floral", img: "assets/images/placeholder.jpg", url: "index.html#products" }
    ];

    let searchModal = document.querySelector('.search-modal');
    if (!searchModal) {
        searchModal = document.createElement('div');
        searchModal.className = 'search-modal';
        searchModal.innerHTML = `
            <button class="search-close-btn">&times;</button>
            <div class="search-container">
                <div class="search-input-wrapper">
                    <input type="text" class="search-input" placeholder="Type to search scents..." autofocus>
                </div>
                <div class="search-results"></div>
            </div>
        `;
        document.body.appendChild(searchModal);
    }

    const searchInput = searchModal.querySelector('.search-input');
    const searchResults = searchModal.querySelector('.search-results');
    const closeBtn = searchModal.querySelector('.search-close-btn');

    // Search Function
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = ''; // Clear previous
        
        if (query.length < 2) return;

        const filtered = productDatabase.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.brand.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            searchResults.innerHTML = '<p style="text-align:center; color:#999;">No matches found.</p>';
        } else {
            filtered.forEach(p => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <img src="${p.img}" class="search-result-thumb" alt="${p.name}">
                    <div class="search-result-info">
                        <h4>${p.name}</h4>
                        <p>${p.brand} | ${p.category}</p>
                    </div>
                `;
                item.addEventListener('click', () => {
                    window.location.href = p.url;
                    searchModal.classList.remove('active');
                });
                searchResults.appendChild(item);
            });
        }
    });

    // Open/Close Logic
    window.openSearch = () => {
        searchModal.classList.add('active');
        setTimeout(() => searchInput.focus(), 100);
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


    // --- 4. Navigation Logic (Existing) ---
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
    
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

    // Modal Logic (Fragrance Quiz)
    // Note: Modal HTML is currently in footer of pages
    window.onclick = function(event) {
        const modal = document.getElementById('fragranceQuizModal');
        if (event.target == modal) {
            modal.style.display = "none";
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
                    <a href="${article.link}" class="journal-link-wrapper" style="display:block; text-decoration:none; color:inherit;">
                        <div class="journal-image-wrapper">
                            <img src="${article.image}" alt="${article.title}" class="journal-image" loading="lazy">
                        </div>
                        <div class="journal-content" style="text-align:left;">
                            <span class="journal-category">${article.category}</span>
                            <span class="journal-date">${article.date.replace(/-/g, '.')}</span>
                            <h3 class="journal-title">${article.title}</h3>
                            <p class="journal-excerpt">${article.excerpt.substring(0, 40)}...</p>
                            <span class="journal-link">READ MORE <span class="arrow">&rarr;</span></span>
                        </div>
                    </a>
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
