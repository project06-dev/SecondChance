import re

# Read the file
with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the detail-actions section
old_pattern = r'''                        <div class="detail-actions">
                            \$\{product\.stock > 0 \? `
                                <button class="btn-primary" onclick="addToCart\(\$\{product\.id\}\); closeDetailModal\(\);">
                                    <i class="fas fa-shopping-cart"></i>
                                    Tambah ke Keranjang
                                </button>
                            ` : `
                                <button class="btn-primary" style="background-color: var\(--gray\); cursor: not-allowed;" disabled>
                                    <i class="fas fa-times-circle"></i>
                                    Stok Habis
                                </button>
                            `\}
                        </div>'''

new_pattern = '''                        <div class="detail-actions">
                            <button class="btn-outline" onclick="contactSeller('${product.seller}', '${product.name}')" style="margin-bottom: 10px; width: 100%;">
                                <i class="fas fa-comments"></i>
                                Chat Penjual
                            </button>
                            ${product.stock > 0 ? `
                                <button class="btn-primary" onclick="addToCart(${product.id}); closeDetailModal();" style="width: 100%;">
                                    <i class="fas fa-shopping-cart"></i>
                                    Tambah ke Keranjang
                                </button>
                            ` : `
                                <button class="btn-primary" style="background-color: var(--gray); cursor: not-allowed; width: 100%;" disabled>
                                    <i class="fas fa-times-circle"></i>
                                    Stok Habis
                                </button>
                            `}
                        </div>'''

# Replace
content = re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

# Write back
with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Tombol Chat Penjual berhasil ditambahkan!")
