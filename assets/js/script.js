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
            const targetId = this.getAttribute('href');
            // If the href has changed to a real URL (not starting with #), allow default behavior
            if (!targetId || !targetId.startsWith('#')) return;

            e.preventDefault();
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
    // Fix: Select by class since ID doesn't exist
    const startBtns = document.querySelectorAll('.btn-quiz'); 
    const closeBtn = document.querySelector('.quiz-close');
    
    // Attach to all quiz buttons (if multiple)
    if (quizModal) {
        startBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default if it's a link
                quizModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent background scroll
                resetQuiz();
            });
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                quizModal.style.display = 'none';
                document.body.style.overflow = ''; // Restore background scroll
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === quizModal) {
                quizModal.style.display = 'none';
                document.body.style.overflow = ''; // Restore background scroll
            }
        });

        // Fix: Add explicit listeners for Result Screen buttons
        const resultCloseBtn = document.getElementById('btn-quiz-close-result');
        const resultRestartBtn = document.getElementById('btn-quiz-restart');

        if (resultCloseBtn) {
            resultCloseBtn.addEventListener('click', () => {
                quizModal.style.display = 'none';
                document.body.style.overflow = ''; // Restore background scroll
            });
        }

        if (resultRestartBtn) {
            resultRestartBtn.addEventListener('click', () => {
                resetQuiz();
            });
        }
        
        // Quiz State
        let currentStep = 1;
        let answers = {};
        
        // 17 Products Database (High Precision)
        const products = [
            {
                id: 'byredo-blanche',
                brand: 'BYREDO',
                name: 'Blanche',
                type: 'clean',
                strength: 'medium',
                vibe: 'clean',
                scenes: ['business', 'casual'],
                notes: { top: 'Aldehydes, Rose', mid: 'Peony, Lily of the Valley', base: 'Musk, Sandalwood, Amber' },
                desc: '「白」という色を香りで表現。洗い立てのシーツのような清潔感と、透明感のあるフローラルが調和した香り。誰からも愛されるピュアな印象を与えます。',
                image: 'assets/images/BYR-Blanche-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FRG5XX2Q'
            },
            {
                id: 'ck-one',
                brand: 'Calvin Klein',
                name: 'ck one',
                type: 'citrus',
                strength: 'light',
                vibe: 'cute',
                scenes: ['casual', 'business'],
                notes: { top: 'Bergamot, Pineapple', mid: 'Jasmine, Violet', base: 'Musk, Amber' },
                desc: '世界中で愛されるシトラスの金字塔。親しみやすく、誰からも好感を持たれる爽やかな香り。リラックスしたい休日やカジュアルな日常に最適です。',
                image: 'assets/images/CK-One-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKMB6HR'
            },
            {
                id: 'dior-hypnotic',
                brand: 'DIOR',
                name: 'Hypnotic Poison',
                type: 'warm',
                strength: 'strong',
                vibe: 'sensual',
                scenes: ['evening', 'special'],
                notes: { top: 'Coconut, Plum, Apricot', mid: 'Rosewood, Jasmine', base: 'Vanilla, Almond, Musk' },
                desc: '甘く魅惑的なバニラとアーモンドの香り。ミステリアスで官能的な印象を残したい、特別な夜やデートにぴったりの一本です。',
                image: 'assets/images/DIO-Hypnotic-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKNF4QC'
            },
            {
                id: 'dior-sauvage',
                brand: 'DIOR',
                name: 'Sauvage',
                type: 'citrus', 
                strength: 'medium',
                vibe: 'mature',
                scenes: ['special', 'evening', 'business'],
                notes: { top: 'Bergamot, Pepper', mid: 'Lavender, Patchouli', base: 'Ambroxan, Cedar' },
                desc: '広大な大地にインスパイアされた、力強くフレッシュな香り。スパイシーさと爽やかさが同居し、自信に満ちた大人の男性像を演出します。',
                image: 'assets/images/DIO-Sauvage-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKQW44P'
            },
            {
                id: 'diptyque-orpheon',
                brand: 'DIPTYQUE',
                name: 'Orpheon',
                type: 'warm', 
                strength: 'strong',
                vibe: 'mature',
                scenes: ['evening', 'special', 'casual'],
                notes: { top: 'Juniper Berry', mid: 'Jasmine', base: 'Cedar, Tonka Bean' },
                desc: '60年代のパリのバーをイメージした香り。ウッディでパウダリーな温かみがあり、知的で洗練された大人の雰囲気を醸し出します。',
                image: 'assets/images/DPTY-Orpheon-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKMB6HG'
            },
            {
                id: 'dg-lightblue',
                brand: 'Dolce & Gabbana',
                name: 'Light Blue',
                type: 'citrus',
                strength: 'light',
                vibe: 'cute',
                scenes: ['casual', 'business'],
                notes: { top: 'Lemon, Apple', mid: 'Jasmine, White Rose', base: 'Cedar, Musk' },
                desc: '地中海の陽光と海を感じさせる、これ以上ないほど爽やかな香り。甘すぎず、性別を問わず夏やリフレッシュしたい時に最高の一本です。',
                image: 'assets/images/DG-LightBlue-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKNWDG8'
            },
            {
                id: 'hermes-nile',
                brand: 'HERMÈS',
                name: 'Un Jardin sur le Nil',
                type: 'citrus',
                strength: 'light',
                vibe: 'mature',
                scenes: ['business', 'casual'],
                notes: { top: 'Green Mango, Citrus', mid: 'Lotus, Calamus', base: 'Sycamore, Incense' },
                desc: '「ナイルの庭」。グリーンマンゴーの瑞々しさとロータスの透明感。知的で上品、決して邪魔にならない美しい香りはオフィスワークに最適です。',
                image: 'assets/images/HRM-Nile-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKQGK6Z'
            },
            {
                id: 'issey-miyake',
                brand: 'ISSEY MIYAKE',
                name: "L'Eau d'Issey",
                type: 'clean',
                strength: 'light',
                vibe: 'clean',
                scenes: ['business', 'casual'],
                notes: { top: 'Lotus, Rose', mid: 'Lily, White Flowers', base: 'Precious Woods' },
                desc: '「水の香り」を追求した名作。透明感あふれるホワイトフローラルとアクアティックなノートは、清潔感そのものです。',
                image: 'assets/images/ISY-LdIssey-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKRJKJ7'
            },
            {
                id: 'jo-malone-pear',
                brand: 'Jo Malone London',
                name: 'English Pear & Freesia',
                type: 'floral',
                strength: 'light',
                vibe: 'cute',
                scenes: ['business', 'casual', 'date'],
                notes: { top: 'Pear', mid: 'Freesia', base: 'Patchouli, Amber' },
                desc: '熟した洋梨の瑞々しさとフリージアの優しさ。甘すぎず、フルーティーで上品な香りは、誰からも好かれる好感度No.1フレグランスです。',
                image: 'assets/images/JML-EnglishPear-C.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKNWSN5'
            },
            {
                id: 'le-labo-another13',
                brand: 'LE LABO',
                name: 'Another 13',
                type: 'clean',
                strength: 'strong',
                vibe: 'sensual',
                scenes: ['special', 'casual', 'evening'],
                notes: { top: 'Pear, Citrus', mid: 'Ambrette, Jasmine', base: 'Ambroxan, Musk' },
                desc: '都会的で中毒性のあるムスクの香り。つける人によって香り立ちが変わり、あなたの「体臭」を最高に魅力的に演出するスキンセントです。',
                image: 'assets/images/LLB-Another13-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKQLTQN'
            },
            {
                id: 'loewe-001-woman',
                brand: 'LOEWE',
                name: '001 Woman',
                type: 'warm',
                strength: 'medium',
                vibe: 'cute',
                scenes: ['date', 'evening', 'casual'],
                notes: { top: 'Bergamot, Pink Pepper', mid: 'Sandalwood, Jasmine', base: 'Vanilla, Amber' },
                desc: '「朝の光」をイメージ。バニラとサンダルウッドの温かみのある甘さが、リラックスした幸福感を与えてくれます。',
                image: 'assets/images/placeholder.svg',
                link: 'https://www.amazon.co.jp/dp/B0FSKPQPZ7'
            },
            {
                id: 'loewe-001-man',
                brand: 'LOEWE',
                name: '001 Man',
                type: 'citrus',
                strength: 'medium',
                vibe: 'mature',
                scenes: ['business', 'casual', 'date'],
                notes: { top: 'Cardamom, Bergamot', mid: 'Cypress, Sandalwood', base: 'Violet, Patchouli' },
                desc: '清潔感のあるウッディノート。落ち着きと知性を感じさせる香りは、ビジネスシーンや大人の休日にマッチします。女性の愛用者も多い香り。',
                image: 'assets/images/LOW-Man-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKQ8QV8'
            },
            {
                id: 'margiela-lazy',
                brand: 'Maison Margiela',
                name: 'Lazy Sunday Morning',
                type: 'clean',
                strength: 'medium',
                vibe: 'clean',
                scenes: ['casual', 'date', 'business'],
                notes: { top: 'Aldehydes, Pear', mid: 'Iris, Rose, Orange Blossom', base: 'White Musk, Patchouli' },
                desc: '日曜日の朝、洗い立てのリネンのシーツに包まれる至福の時間。フローラルムスクの柔らかい香りが、心までリラックスさせてくれます。',
                image: 'assets/images/MRG-LazySun-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKSJVDC'
            },
            {
                id: 'tiffany-rose',
                brand: 'TIFFANY & CO.',
                name: 'Rose Gold',
                type: 'floral',
                strength: 'medium',
                vibe: 'cute',
                scenes: ['business', 'date', 'special'],
                notes: { top: 'Blackcurrant', mid: 'Blue Rose', base: 'Ambrette Seed' },
                desc: 'ティファニーらしい透明感と輝きのあるローズの香り。甘すぎず、凛とした上品さがあり、自分に自信を与えてくれる一本です。',
                image: 'assets/images/TFFY-RoseGold-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKRCH5G'
            },
            {
                id: 'ysl-libre',
                brand: 'YVES SAINT LAURENT',
                name: 'LIBRE',
                type: 'floral',
                strength: 'strong',
                vibe: 'sensual',
                scenes: ['special', 'evening', 'business'],
                notes: { top: 'Lavender, Tangerine', mid: 'Orange Blossom', base: 'Vanilla, Tonka Bean' },
                desc: 'マスキュリンなラベンダーとフェミニンなオレンジブロッサムの衝突。自立したカッコいい女性を演出する、華やかでセクシーな香り。',
                image: 'assets/images/YSL-Libre-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKSG813'
            },
            {
                id: 'margiela-jazz',
                brand: 'Maison Margiela',
                name: 'Jazz Club',
                type: 'warm',
                strength: 'strong',
                vibe: 'sensual',
                scenes: ['evening', 'date', 'special'],
                notes: { top: 'Pink Pepper, Lemon', mid: 'Rum, Vetiver', base: 'Tobacco, Vanilla' },
                desc: 'ブルックリンのジャズクラブ。ラム酒とタバコの葉、レザーの香り。甘くスモーキーでダンディな香りは、秋冬の夜に深く寄り添います。',
                image: 'assets/images/MRG-JazzClub-EDT.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKQBBXN'
            },
            {
                id: 'diptyque-fleur',
                brand: 'DIPTYQUE',
                name: 'Fleur de Peau',
                type: 'clean', 
                strength: 'medium',
                vibe: 'sensual',
                scenes: ['casual', 'date', 'business'],
                notes: { top: 'Bergamot, Pink Pepper', mid: 'Iris, Rose', base: 'Musk, Ambrette' },
                desc: '「肌の花」。コットンのような柔らかさと、アイリスのパウダリーな甘さが肌に溶け込みます。優しく包み込まれるような、極上のムスク体験。',
                image: 'assets/images/DPTY-FdPeau-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKQWRJM'
            },
            {
                id: 'thoo-the-time',
                brand: 'THE HOUSE OF OUD',
                name: 'The Time',
                type: 'clean',
                strength: 'medium',
                vibe: 'mature',
                scenes: ['business', 'casual', 'special'],
                notes: { top: 'Bergamot, Chamomile', mid: 'Blue Tea, Verbena', base: 'Black Tea, Musk' },
                desc: '「現在」という瞬間を大切にするための香り。ブルーティーとバーベナが織りなす、静寂で知的なティーノート。心を落ち着かせたい時に。',
                image: 'assets/images/THO-TheTime-EDP.jpg',
                link: 'https://www.amazon.co.jp/dp/B0FSKT7V2N'
            }
        ];
        
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
                    goToStep(4); // Add Step 4 Logic
                } else if (currentStep === 4) {
                    answers.vibe = answer;
                    showResult();
                }
            });
        });
        
        function goToStep(step) {
            document.getElementById(`step${currentStep}`).style.display = 'none';
            currentStep = step;
            const nextStep = document.getElementById(`step${currentStep}`);
            if(nextStep) nextStep.style.display = 'block';
        }
        
        function calculateBestMatch(userAnswers) {
            // Enhanced Logic for High Precision
            // 1. Vibe Match (Most Important): +20 points
            // 2. Type Match: +15 points
            // 3. Strength Match: +10 points
            // 4. Scene Match: +5 points
            
            let bestProduct = null;
            let maxScore = -1;
            
            // Randomize products array slightly to vary results for ties
            const shuffledProducts = products.sort(() => 0.5 - Math.random());
            
            shuffledProducts.forEach(p => {
                let score = 0;
                
                // Vibe Score (Step 4)
                if (p.vibe === userAnswers.vibe) {
                    score += 20;
                }
                
                // Type Score (Step 2)
                if (p.type === userAnswers.type) {
                    score += 15;
                } else if (
                    // Partial matches
                    (userAnswers.type === 'clean' && p.type === 'citrus') || 
                    (userAnswers.type === 'citrus' && p.type === 'clean') ||
                    (userAnswers.type === 'floral' && p.type === 'warm')
                ) {
                    score += 3; 
                }
                
                // Strength Score (Step 3)
                if (p.strength === userAnswers.strength) {
                    score += 10;
                } else if (
                    (userAnswers.strength === 'medium' && (p.strength === 'light' || p.strength === 'strong'))
                ) {
                    score += 4; 
                }
                
                // Scene Score (Step 1)
                if (p.scenes.includes(userAnswers.scene)) {
                    score += 5;
                }
                
                if (score > maxScore) {
                    maxScore = score;
                    bestProduct = p;
                }
            });
            
            return bestProduct;
        }
        
        function showResult() {
            document.getElementById(`step${currentStep}`).style.display = 'none';
            const resultDiv = document.getElementById('quizResult');
            resultDiv.style.display = 'block';
            
            // Calculate
            const bestMatch = calculateBestMatch(answers);
            
            if (!bestMatch) return; 
            
            // Render
            document.getElementById('resultImage').src = bestMatch.image;
            document.getElementById('resultBrand').textContent = bestMatch.brand;
            document.getElementById('resultTitle').textContent = bestMatch.name;
            document.getElementById('resultDescription').textContent = bestMatch.desc;
            
            // Notes
            document.getElementById('resultTop').textContent = bestMatch.notes.top;
            document.getElementById('resultMid').textContent = bestMatch.notes.mid;
            document.getElementById('resultBase').textContent = bestMatch.notes.base;
            
            // Link
            const linkBtn = document.getElementById('resultLink');
            linkBtn.href = bestMatch.link;
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

    // 9. Mobile Note Toggle for Product Collection
    const productCards = document.querySelectorAll('.product-card-simple');
    
    productCards.forEach(card => {
        const imageContainer = card.querySelector('.product-image-container');
        if(imageContainer) {
            imageContainer.addEventListener('click', function(e) {
                // Toggle notes on click for both mobile and desktop (allows pinning on desktop)
                card.classList.toggle('show-notes');
            });
        }
    });
    
    // 10. Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            const items = document.querySelectorAll('.product-card-simple');
            
            items.forEach(item => {
                const itemColor = item.getAttribute('data-color');
                // Allow displaying all or matching color
                // Normalize case just to be safe
                if (filterValue === 'all' || (itemColor && itemColor.toLowerCase() === filterValue.toLowerCase())) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // 11. Category Discovery to Collection Filter Link
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Let the smooth scroll (anchor link) happen naturally
            // But update the filter
            const targetColor = this.getAttribute('data-filter-target');
            if (targetColor) {
                const filterBtn = document.querySelector(`.filter-btn[data-filter="${targetColor}"]`);
                if (filterBtn) {
                    // Trigger click on the corresponding filter button
                    setTimeout(() => {
                        filterBtn.click();
                    }, 100); // Slight delay to ensure scroll starts smoothly
                }
            }
        });
    });

    // 12. Campaign Modal Logic (Auto Popup)
    const campaignModal = document.getElementById('campaignModal');
    if (campaignModal) {
        const cCloseBtn = campaignModal.querySelector('.campaign-modal-close');
        const cActionBtn = campaignModal.querySelector('.c-modal-btn');
        const hasSeenCampaign = sessionStorage.getItem('hasSeenCampaignModal');

        // Show modal after 1.5 seconds if not seen in this session
        if (!hasSeenCampaign) {
            setTimeout(() => {
                campaignModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent scrolling
                // Mark as seen
                sessionStorage.setItem('hasSeenCampaignModal', 'true');
            }, 1500);
        }

        // Close logic
        const closeCampaignModal = () => {
            campaignModal.style.display = 'none';
            document.body.style.overflow = '';
        };

        if (cCloseBtn) {
            cCloseBtn.addEventListener('click', closeCampaignModal);
        }

        // If user clicks CTA, close modal and scroll (default anchor behavior handles scroll)
        if (cActionBtn) {
            cActionBtn.addEventListener('click', closeCampaignModal);
        }

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === campaignModal) {
                closeCampaignModal();
            }
        });
    }

    // 13. Dynamic Journal Rendering for Top Page & Mega Menu
    if (window.journalArticles) {
        // Sort by date descending
        const sortedArticles = window.journalArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // A. Top Page Journal Section (Top 3)
        const journalGrid = document.getElementById('top-journal-grid');
        if (journalGrid) {
            const latestArticles = sortedArticles.slice(0, 3);
            let journalHTML = '';
            latestArticles.forEach(article => {
                const dateStr = article.date.replace(/-/g, '.');
                journalHTML += `
                    <a href="${article.link}" class="journal-card">
                        <div class="journal-image-wrapper">
                            <div class="journal-image">
                                <img src="${article.image}" alt="${article.title}" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                        </div>
                        <div class="journal-info">
                            <span class="journal-category">${article.category}</span>
                            <span class="journal-date">${dateStr}</span>
                            <h3 class="journal-title">${article.title}</h3>
                            <p class="journal-excerpt">${article.excerpt}</p>
                        </div>
                    </a>
                `;
            });
            journalGrid.innerHTML = journalHTML;
        }

        // B. Mega Menu Latest Story (Top 1)
        const megaMenuLatestContainer = document.getElementById('mega-menu-latest-article');
        if (megaMenuLatestContainer) {
            const latestArticle = sortedArticles[0];
            if (latestArticle) {
                // Create HTML matching the original featured-card structure
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
    }

    // 14. Handle "Buy Full" Links with No Supply
    document.querySelectorAll('.stripe-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // Check if href is empty, #, or just placeholder
            if (!href || href === '#' || href.trim() === '') {
                e.preventDefault();
                
                // Remove existing tooltips
                const existingTooltip = document.querySelector('.unavailable-tooltip');
                if (existingTooltip) existingTooltip.remove();

                // Create tooltip element
                const tooltip = document.createElement('div');
                tooltip.className = 'unavailable-tooltip';
                tooltip.textContent = 'このフルボトルは、現在供給不安定により、取り扱いはございません。';
                
                // Append to body
                document.body.appendChild(tooltip);

                // Calculate Position
                const rect = this.getBoundingClientRect();
                const scrollY = window.scrollY || window.pageYOffset;
                const scrollX = window.scrollX || window.pageXOffset;

                // Initial rendering to get size
                const tooltipRect = tooltip.getBoundingClientRect();
                
                // Position: Center above the button
                // Top: Button Top + Scroll - Tooltip Height - Gap (10px)
                let topPos = rect.top + scrollY - tooltipRect.height - 10;
                // Left: Button Left + Scroll + (Button Width / 2) - (Tooltip Width / 2)
                let leftPos = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);

                // Boundary checks (Mobile fix)
                if (leftPos < 10) leftPos = 10;
                if (leftPos + tooltipRect.width > window.innerWidth - 10) {
                    leftPos = window.innerWidth - tooltipRect.width - 10;
                }

                tooltip.style.top = topPos + 'px';
                tooltip.style.left = leftPos + 'px';
                
                // Trigger reflow for transition
                void tooltip.offsetWidth;
                
                // Show
                tooltip.classList.add('visible');

                // Remove after delay
                setTimeout(() => {
                    tooltip.classList.remove('visible');
                    setTimeout(() => {
                        if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
                    }, 300);
                }, 3000);
            }
        });
    });

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
