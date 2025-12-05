import glob
import re

# 1. Get the master header from index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

header_pattern = re.compile(r'(<header class="header">.*?</header>)', re.DOTALL)
match = header_pattern.search(index_content)

if not match:
    print("Error: Could not find header in index.html")
    exit(1)

master_header = match.group(1)

# 2. Find all HTML files to update
html_files = glob.glob('*.html')
files_to_ignore = ['index.html', 'megamenu_fragment.html', 'clean_nav_menu.html', 'new_nav_menu.html', 'journal_section.html', 'preview.html', 'ranking_content.html', 'blog_preview_final.html']

# 3. Update each file
count = 0
for file_path in html_files:
    if file_path in files_to_ignore:
        continue
        
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace header
    new_content = header_pattern.sub(master_header, content)
    
    # Also ensure the script.js and styles.css links are correct (if they were different)
    # This is a simple check, assumes assets/ structure is consistent
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Updated {file_path}")
        count += 1
    else:
        print(f"  No changes needed for {file_path}")

print(f"Finished. Updated {count} files.")
