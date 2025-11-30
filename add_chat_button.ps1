# Change to script directory
Set-Location -Path $PSScriptRoot

# Read file
$content = Get-Content -Path "dashboard.html" -Raw -Encoding UTF8

# Simple string replacement
$oldText = '                        <div class="detail-actions">
                            ${product.stock > 0 ? `
                                <button class="btn-primary" onclick="addToCart(${product.id}); closeDetailModal();">
                                    <i class="fas fa-shopping-cart"></i>
                                    Tambah ke Keranjang
                                </button>
                            ` : `
                                <button class="btn-primary" style="background-color: var(--gray); cursor: not-allowed;" disabled>
                                    <i class="fas fa-times-circle"></i>
                                    Stok Habis
                                </button>
                            `}
                        </div>'

$newText = '                        <div class="detail-actions">
                            <button class="btn-outline" onclick="contactSeller(''${product.seller}'', ''${product.name}'')" style="margin-bottom: 10px; width: 100%;">
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
                        </div>'

# Replace
$content = $content.Replace($oldText, $newText)

# Write back
$content | Out-File -FilePath "dashboard.html" -Encoding UTF8 -NoNewline

Write-Host "✅ Tombol Chat Penjual berhasil ditambahkan!" -ForegroundColor Green
