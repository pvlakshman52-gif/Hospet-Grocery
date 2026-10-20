import os

IMAGES = {
    'mixture_snacks.jpg': {
        'title': 'South Indian Mixture',
        'sub': 'Crispy Kara Sev & Peanuts',
        'icon': '🥨',
        'bg1': '#fff7ed',
        'bg2': '#ea580c',
        'accent': '#c2410c'
    },
    'tomatoes.jpg': {
        'title': 'Farm Fresh Tomatoes',
        'sub': 'Hospete Country Fresh',
        'icon': '🍅',
        'bg1': '#fef2f2',
        'bg2': '#ef4444',
        'accent': '#b91c1c'
    },
    'coriander.jpg': {
        'title': 'Fresh Coriander Bunch',
        'sub': 'Tungabhadra Greens',
        'icon': '🌿',
        'bg1': '#ecfdf5',
        'bg2': '#10b981',
        'accent': '#047857'
    },
    'nandini_milk.jpg': {
        'title': 'Nandini Toned Milk',
        'sub': 'Pure Cow Milk 500ml',
        'icon': '🥛',
        'bg1': '#eff6ff',
        'bg2': '#3b82f6',
        'accent': '#1d4ed8'
    },
    'nandini_ghee.jpg': {
        'title': 'Nandini Pure Ghee',
        'sub': 'Golden Aromatic Cow Ghee',
        'icon': '🧈',
        'bg1': '#fefce8',
        'bg2': '#eab308',
        'accent': '#a16207'
    },
    'sona_masoori.jpg': {
        'title': 'Sona Masoori Rice',
        'sub': 'Aged Karnataka Raw Rice',
        'icon': '🌾',
        'bg1': '#fefce8',
        'bg2': '#ca8a04',
        'accent': '#854d0e'
    },
    'aashirvaad_atta.jpg': {
        'title': 'Aashirvaad Chakki Atta',
        'sub': '100% Whole Wheat Flour',
        'icon': '🍞',
        'bg1': '#fffbeb',
        'bg2': '#d97706',
        'accent': '#92400e'
    },
    'bananas.jpg': {
        'title': 'Robusta Bananas',
        'sub': 'Sweet Local Orchard Fresh',
        'icon': '🍌',
        'bg1': '#fefce8',
        'bg2': '#facc15',
        'accent': '#ca8a04'
    },
    'mysore_sandal.jpg': {
        'title': 'Mysore Sandal Soap',
        'sub': 'Pure Sandalwood Oil',
        'icon': '🧼',
        'bg1': '#fef3c7',
        'bg2': '#d97706',
        'accent': '#b45309'
    },
    'sunflower_oil.jpg': {
        'title': 'Sunflower Cooking Oil',
        'sub': 'Heart Friendly Refined',
        'icon': '🌻',
        'bg1': '#fefce8',
        'bg2': '#f59e0b',
        'accent': '#d97706'
    },
    'tata_tea.jpg': {
        'title': 'Tata Tea Gold',
        'sub': 'Rich Leaves & Aroma',
        'icon': '☕',
        'bg1': '#fff7ed',
        'bg2': '#ea580c',
        'accent': '#9a3412'
    },
    'banana_chips.jpg': {
        'title': 'Kerala Banana Chips',
        'sub': 'Pure Coconut Oil Fried',
        'icon': '🥔',
        'bg1': '#fefce8',
        'bg2': '#eab308',
        'accent': '#ca8a04'
    },
    'cat_veggies.jpg': {'title': 'Veggies', 'sub': '', 'icon': '🥦', 'bg1': '#ecfdf5', 'bg2': '#10b981', 'accent': '#059669'},
    'cat_fruits.jpg': {'title': 'Fruits', 'sub': '', 'icon': '🍎', 'bg1': '#fef2f2', 'bg2': '#ef4444', 'accent': '#dc2626'},
    'cat_dairy.jpg': {'title': 'Dairy', 'sub': '', 'icon': '🥛', 'bg1': '#eff6ff', 'bg2': '#3b82f6', 'accent': '#2563eb'},
    'cat_staples.jpg': {'title': 'Staples', 'sub': '', 'icon': '🌾', 'bg1': '#fefce8', 'bg2': '#ca8a04', 'accent': '#a16207'},
    'cat_snacks.jpg': {'title': 'Snacks', 'sub': '', 'icon': '🍿', 'bg1': '#fff7ed', 'bg2': '#f97316', 'accent': '#ea580c'},
    'cat_oils.jpg': {'title': 'Oils', 'sub': '', 'icon': '🌶️', 'bg1': '#fdf2f8', 'bg2': '#ec4899', 'accent': '#db2777'},
    'cat_beverages.jpg': {'title': 'Beverages', 'sub': '', 'icon': '☕', 'bg1': '#f5f3ff', 'bg2': '#8b5cf6', 'accent': '#7c3aed'},
    'cat_household.jpg': {'title': 'Household', 'sub': '', 'icon': '🧼', 'bg1': '#f0fdfa', 'bg2': '#14b8a6', 'accent': '#0d9488'},
    'banner.jpg': {'title': 'Super Grocery Savings', 'sub': 'Flat 30% OFF on Farm Fresh & Nandini', 'icon': '🛒', 'bg1': '#065f46', 'bg2': '#10b981', 'accent': '#34d399'}
}

def generate_svg(data):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{data['bg1']}" />
      <stop offset="100%" stop-color="{data['bg2']}" stop-opacity="0.25" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="20"/>
  <circle cx="200" cy="180" r="105" fill="#ffffff" stroke="{data['accent']}" stroke-width="3" stroke-dasharray="6,4"/>
  <text x="200" y="215" font-size="80" text-anchor="middle">{data['icon']}</text>
  <rect x="25" y="310" width="350" height="65" rx="14" fill="#ffffff" opacity="0.95"/>
  <text x="200" y="338" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle" fill="#0f172a">{data['title']}</text>
  <text x="200" y="360" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="{data['accent']}">{data['sub'] or 'Hospete Fresh Verified'}</text>
</svg>'''

def main():
    dirs = [
        '/app/applet/hospete_fresh_flask/static/images',
        '/app/applet/public/images',
        '/app/applet/public'
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    for filename, data in IMAGES.items():
        svg_content = generate_svg(data)
        for d in dirs:
            target_path = os.path.join(d, filename)
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(svg_content)
    print("All image assets created successfully.")

if __name__ == '__main__':
    main()
