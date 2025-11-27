import re

def process_html():
    path = '/home/user/webapp/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Journal Section Replacement
    try:
        with open('/home/user/webapp/journal_section.html', 'r', encoding='utf-8') as f:
            journal_html = f.read()
        
        brands_pattern = re.compile(r'<section id="brands" class="brands-section">.*?</section>', re.DOTALL)
        if brands_pattern.search(content):
            content = brands_pattern.sub(journal_html, content)
            print("Replaced Brands with Journal.")
        else:
            print("Brands section not found for replacement.")
    except Exception as e:
        print(f"Error replacing brands: {e}")

    # 2. Carousel Wrappers
    # Split by Reviews Section to isolate Ranking and Reviews
    split_marker = '<section class="reviews-section">'
    if split_marker in content:
        parts = content.split(split_marker)
        
        # Part 0: Ranking Section
        # Opening
        parts[0] = parts[0].replace(
            '<div class="ranking-carousel">\n                <div class="ranking-track">',
            '<div class="carousel-container">\n                <button class="carousel-nav prev" aria-label="Previous" onclick="scrollCarousel(\'ranking\', -1)">&#8592;</button>\n                <div class="ranking-carousel" id="rankingCarousel">\n                    <div class="ranking-track" id="rankingTrack">'
        )
        
        # Closing
        # Look for the closing sequence
        block = '                </div>\n            </div>\n        </div>\n    </section>'
        new_block_ranking = '                </div>\n            </div>\n            <button class="carousel-nav next" aria-label="Next" onclick="scrollCarousel(\'ranking\', 1)">&#8594;</button>\n        </div>\n        </div>\n    </section>'
        
        if block in parts[0]:
            parts[0] = parts[0].replace(block, new_block_ranking)
        else:
            print("Warning: Could not match Ranking closing block.")

        # Part 1: Reviews Section
        # Opening
        parts[1] = parts[1].replace(
            '<div class="reviews-carousel">\n                <div class="reviews-track">',
            '<div class="carousel-container">\n                <button class="carousel-nav prev" aria-label="Previous" onclick="scrollCarousel(\'reviews\', -1)">&#8592;</button>\n                <div class="reviews-carousel" id="reviewsCarousel">\n                    <div class="reviews-track" id="reviewsTrack">'
        )
        
        # Closing
        new_block_reviews = '                </div>\n            </div>\n            <button class="carousel-nav next" aria-label="Next" onclick="scrollCarousel(\'reviews\', 1)">&#8594;</button>\n        </div>\n        </div>\n    </section>'
        
        if block in parts[1]:
            parts[1] = parts[1].replace(block, new_block_reviews)
        else:
            print("Warning: Could not match Reviews closing block.")
            
        final_content = split_marker.join(parts)
    else:
        print("Error: Could not find reviews section marker.")
        final_content = content

    with open(path, 'w', encoding='utf-8') as f:
        f.write(final_content)
        print("Written index.html")

if __name__ == "__main__":
    process_html()
