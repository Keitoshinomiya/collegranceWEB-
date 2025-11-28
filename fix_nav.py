import re

def fix_index_html():
    index_path = '/home/user/webapp/index.html'
    nav_html_path = '/home/user/webapp/clean_nav_menu.html'
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    with open(nav_html_path, 'r', encoding='utf-8') as f:
        nav_html = f.read()

    # 1. Identify the start of the nav block
    # We know it starts around line 31: <ul class="nav-menu">
    start_marker = '<ul class="nav-menu">'
    
    # 2. Identify the end of the nav block container
    # The nav is inside <div class="container"> ... <div class="hamburger"> ... </div> </div> </nav>
    # The hamburger is AFTER the ul.
    # So we need to replace everything from <ul class="nav-menu"> up to <div class="hamburger">
    
    end_marker = '<div class="hamburger">'
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        # Construct new content
        # Keep everything before start_marker
        # Insert new nav_html
        # Keep everything starting from end_marker
        
        new_content = content[:start_idx] + nav_html + "\n                " + content[end_idx:]
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Fixed index.html navigation structure.")
    else:
        print("Could not find markers for replacement.")

if __name__ == "__main__":
    fix_index_html()
