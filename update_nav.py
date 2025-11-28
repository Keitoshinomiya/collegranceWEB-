import re

def update_nav_menu():
    index_path = '/home/user/webapp/index.html'
    new_menu_path = '/home/user/webapp/new_nav_menu.html'
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    with open(new_menu_path, 'r', encoding='utf-8') as f:
        new_menu_html = f.read()

    # Regex to match the <ul class="nav-menu"> ... </ul> block
    # Pattern handles potential newlines and nested content
    pattern = re.compile(r'<ul class="nav-menu">.*?</ul>', re.DOTALL)
    
    if pattern.search(content):
        updated_content = pattern.sub(new_menu_html, content)
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print("Successfully updated nav-menu.")
    else:
        print("Could not find nav-menu block.")

if __name__ == "__main__":
    update_nav_menu()
