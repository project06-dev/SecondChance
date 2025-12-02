// product-firebase.js - Firebase Product Management
// Handles product CRUD operations with Firestore

class ProductFirebase {
    constructor(db) {
        this.db = db;
        this.productsCollection = 'products';
    }

    // Get current user ID
    getCurrentUserId() {
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) return null;
        
        try {
            const userData = JSON.parse(currentUserData);
            return userData.uid || null;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    // Get current user name
    getCurrentUserName() {
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) return 'Unknown';
        
        try {
            const userData = JSON.parse(currentUserData);
            return userData.name || 'Unknown';
        } catch (e) {
            return 'Unknown';
        }
    }

    // Add new product to Firestore
    async addProduct(productData) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }

            const productToSave = {
                ...productData,
                userId: userId,
                userName: this.getCurrentUserName(),
                createdAt: window.firestoreServerTimestamp(),
                updatedAt: window.firestoreServerTimestamp()
            };

            const docRef = await window.firestoreAddDoc(
                window.firestoreCollection(this.db, this.productsCollection),
                productToSave
            );

            console.log('✅ Product added to Firestore:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Error adding product:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all products from Firestore
    async getAllProducts() {
        try {
            const q = window.firestoreQuery(
                window.firestoreCollection(this.db, this.productsCollection),
                window.firestoreOrderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await window.firestoreGetDocs(q);
            const products = [];

            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data(),
                    firestoreId: doc.id
                });
            });

            console.log(`✅ Loaded ${products.length} products from Firestore`);
            return products;
        } catch (error) {
            console.error('❌ Error loading products:', error);
            return [];
        }
    }

    // Get user's own products
    async getMyProducts() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return [];

            const allProducts = await this.getAllProducts();
            const myProducts = allProducts.filter(p => p.userId === userId);
            
            console.log(`✅ Loaded ${myProducts.length} user products`);
            return myProducts;
        } catch (error) {
            console.error('❌ Error loading user products:', error);
            return [];
        }
    }

    // Delete product from Firestore
    async deleteProduct(firestoreId) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }

            await window.firestoreDeleteDoc(
                window.firestoreDoc(this.db, this.productsCollection, firestoreId)
            );

            console.log('✅ Product deleted from Firestore:', firestoreId);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            return { success: false, error: error.message };
        }
    }

    // Update product in Firestore
    async updateProduct(firestoreId, updates) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }

            const updateData = {
                ...updates,
                updatedAt: window.firestoreServerTimestamp()
            };

            await window.firestoreUpdateDoc(
                window.firestoreDoc(this.db, this.productsCollection, firestoreId),
                updateData
            );

            console.log('✅ Product updated in Firestore:', firestoreId);
            return { success: true };
        } catch (error) {
            console.error('❌ Error updating product:', error);
            return { success: false, error: error.message };
        }
    }

    // Update product stock
    async updateStock(firestoreId, newStock) {
        return await this.updateProduct(firestoreId, { stock: newStock });
    }
}

// Initialize and export
console.log('📦 Product Firebase module loaded');
window.ProductFirebase = ProductFirebase;
