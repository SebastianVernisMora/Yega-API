import { YegaClient } from '../src';

// Example usage of the Yega API client
async function basicUsageExample() {
  // Initialize the client
  const client = new YegaClient('https://api.yega.com/v1');

  try {
    // Example: User authentication
    console.log('=== User Authentication ===');
    const authResponse = await client.login({
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('Logged in successfully:', authResponse.user.email);

    // Example: Get current user
    console.log('\n=== Current User ===');
    const currentUser = await client.getCurrentUser();
    console.log('Current user:', currentUser);

    // Example: Get stores
    console.log('\n=== Stores ===');
    const stores = await client.getStores({ page: 1, limit: 10 });
    console.log(`Found ${stores.data.length} stores`);

    // Example: Create a store (if user is a store owner)
    if (currentUser.role === 'store') {
      console.log('\n=== Creating Store ===');
      const newStore = await client.createStore({
        name: 'My Awesome Store',
        description: 'Best products in town'
      });
      console.log('Created store:', newStore.name);
    }

    // Example: Get products
    console.log('\n=== Products ===');
    const products = await client.getProducts({ page: 1, limit: 5 });
    console.log(`Found ${products.data.length} products`);

    // Example: Create an order
    console.log('\n=== Creating Order ===');
    const order = await client.createOrder({
      storeId: 'store_123',
      items: [
        {
          productId: 'prod_123',
          quantity: 2
        }
      ]
    });
    console.log('Order created:', order.id);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Vendor operations
async function vendorOperationsExample() {
  const client = new YegaClient();

  try {
    // Login as vendor
    await client.login({
      email: 'vendor@example.com',
      password: 'vendor123'
    });

    // Get vendor's stores
    const myStores = await client.getMyStores();
    console.log('My stores:', myStores.data);

    if (myStores.data.length > 0) {
      const store = myStores.data[0];

      // Add a product to the store
      const newProduct = await client.createProduct({
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 99.99,
        storeId: store.id
      });
      console.log('Added product:', newProduct.name);

      // Get store orders
      const storeOrders = await client.getStoreOrders(store.id);
      console.log(`Store has ${storeOrders.data.length} orders`);
    }

  } catch (error) {
    console.error('Vendor operations error:', error);
  }
}

// Example: Courier operations
async function courierOperationsExample() {
  const client = new YegaClient();

  try {
    // Login as courier
    await client.login({
      email: 'courier@example.com',
      password: 'courier123'
    });

    // Update location for delivery tracking
    await client.updateLocation({
      latitude: 40.7128,
      longitude: -74.0060
    });
    console.log('Location updated');

    // Get available orders for delivery
    const availableOrders = await client.getOrders({ 
      status: 'ready',
      limit: 10
    });
    console.log(`Found ${availableOrders.data.length} orders ready for pickup`);

  } catch (error) {
    console.error('Courier operations error:', error);
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Yega API Client Examples ===\n');
  
  // Run basic usage example
  basicUsageExample()
    .then(() => console.log('\n=== Basic Usage Complete ===\n'))
    .catch(console.error);
}
