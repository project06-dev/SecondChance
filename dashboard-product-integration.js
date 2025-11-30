// dashboard-product-integration.js
// Integrates product management with Firebase Firestore

console.log('🔄 Loading Product Firebase Integration...');

// Initialize ProductFirebase when DOM is ready
let productFirebase = null;

// Wait for window.db to be available
const initProductFirebase = () => {
    if (window.db && window.ProductFirebase) {
        productFirebase = new window.ProductFirebase(window.db);
        console.log('✅ ProductFirebase initialized');
        
        // Load products from Firestore on init
        loadProductsFromFirestore();
    } else {
        console.log('⏳ Waiting for Firebase...');
        setTimeout(initProductFirebase, 500);
    }
};

// Start initialization
setTimeout(initProductFirebase, 1000);

// Load products from Firestore
async function loadProductsFromFirestore() {
    if (!productFirebase) {
        console.log('❌ ProductFirebase not initialized');
        return;
    }

    try {
        console.log('📦 Loading products from Firestore...');
        const firestoreProducts = await productFirebase.getAllProducts();
        
        if (firestoreProducts.length > 0) {
            // Merge with existing products (keep sample products + add Firestore products)
            const currentUserId = productFirebase.getCurrentUserId();
            
            // Mark Firestore products as mine if they belong to current user
            firestoreProducts.forEach(product => {
                product.isMine = product.userId === currentUserId;
                
                // Ensure product has required fields
                if (!product.id) product.id = product.firestoreId;
            });
            
            // Add Firestore products to the beginning
            window.products = [...firestoreProducts, ...window.products.filter(p => !p.userId)];
            window.currentProducts = [...window.products];
            
            console.log(`✅ Loaded ${firestoreProducts.length} products from Firestore`);
            
            // Re-render products
            if (typeof window.renderProducts === 'function') {
                window.renderProducts();
            }
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
    }
}

// Override submitNewProduct function
window.submitNewProduct = async function(event) {
    event.preventDefault();
    
    if (window.uploadedImages.length === 0) {
        window.showNotification('Minimal upload 1 foto produk!');
        return;
    }
    
    const newProduct = {
        name: document.getElementById('productName').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        originalPrice: parseInt(document.getElementById('productOriginalPrice').value),
        category: document.getElementById('productCategory').value,
        images: [...window.uploadedImages],
        image: window.uploadedImages[0],
        seller: document.getElementById('productSeller').value.trim(),
        location: document.getElementById('productLocation').value.trim(),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value.trim(),
        details: {
            merek: document.getElementById('productBrand').value.trim() || 'Tidak disebutkan',
            kondisi: document.getElementById('productCondition').value,
            berat: document.getElementById('productWeight').value.trim() || 'Tidak disebutkan'
        },
        isMine: true
    };
    
    if (newProduct.price >= newProduct.originalPrice) {
        window.showNotification('Harga jual harus lebih rendah dari harga asli!');
        return;
    }
    
    // Check if user is logged in
    if (!productFirebase || !productFirebase.getCurrentUserId()) {
        // Guest mode - just add to local array (old behavior)
        newProduct.id = window.products.length > 0 ? Math.max(...window.products.map(p => p.id)) + 1 : 1;
        window.products.unshift(newProduct);
        window.showNotification('⚠️ Mode Guest: Produk hanya tersimpan sementara. Login untuk menyimpan permanen!');
    } else {
        // Logged in - save to Firestore
        window.showNotification('💾 Menyimpan produk ke database...');
        
        const result = await productFirebase.addProduct(newProduct);
        
        if (result.success) {
            // Add to local array with Firestore ID
            newProduct.id = result.id;
            newProduct.firestoreId = result.id;
            window.products.unshift(newProduct);
            window.showNotification('✅ Produk berhasil disimpan ke database!');
        } else {
            window.showNotification('❌ Gagal menyimpan: ' + result.error);
            return;
        }
    }
    
    window.activeCategory = 'all';
    window.searchInput.value = '';
    window.currentProducts = [...window.products];
    
    window.categoryFilters.forEach(filter => {
        if (filter.getAttribute('data-category') === 'all') {
            filter.classList.add('active');
        } else {
            filter.classList.remove('active');
        }
    });
    
    window.renderProducts();
    
    // Reset form
    document.getElementById('addProductForm').reset();
    window.uploadedImages = [];
    document.getElementById('imagesPreviewContainer').classList.remove('active');
    document.getElementById('imagesPreviewGrid').innerHTML = '';
    document.getElementById('imageCount').textContent = '0';
    
    // Kembali ke home page
    window.showPage('home');
};

// Override deleteProduct function
window.deleteProduct = async function(productId) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    
    const product = window.products.find(p => p.id === productId);
    if (!product) return;
    
    // If product has firestoreId, delete from Firestore
    if (product.firestoreId && productFirebase) {
        window.showNotification('🗑️ Menghapus produk dari database...');
        
        const result = await productFirebase.deleteProduct(product.firestoreId);
        
        if (result.success) {
            window.showNotification('✅ Produk berhasil dihapus dari database!');
        } else {
            window.showNotification('❌ Gagal menghapus: ' + result.error);
            return;
        }
    }
    
    // Remove from local array
    window.products = window.products.filter(p => p.id !== productId);
    window.currentProducts = [...window.products];
    window.renderProducts();
    window.renderMyProducts();
    
    if (!product.firestoreId) {
        window.showNotification('Produk berhasil dihapus');
    }
};

// Override renderMyProducts to load from Firestore
const originalRenderMyProducts = window.renderMyProducts;
window.renderMyProducts = async function() {
    if (productFirebase && productFirebase.getCurrentUserId()) {
        // Load fresh data from Firestore
        await loadProductsFromFirestore();
    }
    
    // Call original function
    if (originalRenderMyProducts) {
        originalRenderMyProducts();
    }
};

console.log('✅ Product Firebase Integration loaded');
