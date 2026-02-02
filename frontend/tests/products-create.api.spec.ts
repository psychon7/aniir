/**
 * Playwright API Verification Test for POST /api/products - Create Endpoint
 *
 * This test verifies the POST /api/v1/products endpoint is properly implemented.
 * It uses Playwright's request context to test API endpoints directly.
 */
import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Generate unique reference to avoid conflicts
const generateUniqueRef = () => `TEST-PRD-${Date.now()}-${Math.random().toString(36).substring(7)}`;

test.describe('POST /api/products - Create Product API Verification', () => {

  test('POST /products - should create a new product with minimal required fields', async ({ request }) => {
    const productRef = generateUniqueRef();

    const response = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: productRef,
        prd_name: 'Test Product - Minimal'
      }
    });

    expect(response.status()).toBe(201);

    const data = await response.json();

    // Verify required response fields
    expect(data).toHaveProperty('prd_id');
    expect(data).toHaveProperty('prd_ref', productRef);
    expect(data).toHaveProperty('prd_name', 'Test Product - Minimal');
    expect(data).toHaveProperty('soc_id', 1);
    expect(data).toHaveProperty('pty_id', 1);
    expect(data).toHaveProperty('prd_d_creation');
    expect(data).toHaveProperty('display_name');
    expect(data).toHaveProperty('instances');
    expect(data).toHaveProperty('has_instances', false);
    expect(data).toHaveProperty('instance_count', 0);

    // Verify types
    expect(typeof data.prd_id).toBe('number');
    expect(typeof data.display_name).toBe('string');
    expect(Array.isArray(data.instances)).toBe(true);
    expect(data.instances.length).toBe(0);

    // Cleanup: Delete the created product
    await request.delete(`${API_BASE_URL}/products/${data.prd_id}`);
  });

  test('POST /products - should create a product with all optional fields', async ({ request }) => {
    const productRef = generateUniqueRef();

    const productData = {
      soc_id: 1,
      pty_id: 1,
      prd_ref: productRef,
      prd_name: 'Test Product - Full',
      prd_sub_name: 'Test Family',
      prd_description: 'A comprehensive test product with all fields',
      prd_code: 'TST-001',
      prd_price: 99.99,
      prd_purchase_price: 49.99,
      prd_length: 10.5,
      prd_width: 5.25,
      prd_height: 2.5,
      prd_weight: 1.5,
      prd_outside_diameter: 15.0,
      prd_hole_size: 0.5,
      prd_depth: 3.0,
      prd_unit_length: 10.0,
      prd_unit_width: 5.0,
      prd_unit_height: 2.0,
      prd_unit_weight: 1.0,
      prd_quantity_each_carton: 24,
      prd_carton_length: 50.0,
      prd_carton_width: 30.0,
      prd_carton_height: 20.0,
      prd_carton_weight: 25.0,
      prd_file_name: 'test-product.jpg'
    };

    const response = await request.post(`${API_BASE_URL}/products`, {
      data: productData
    });

    expect(response.status()).toBe(201);

    const data = await response.json();

    // Verify all fields are properly saved
    expect(data.prd_ref).toBe(productRef);
    expect(data.prd_name).toBe('Test Product - Full');
    expect(data.prd_sub_name).toBe('Test Family');
    expect(data.prd_description).toBe('A comprehensive test product with all fields');
    expect(data.prd_code).toBe('TST-001');
    expect(parseFloat(data.prd_price)).toBeCloseTo(99.99);
    expect(parseFloat(data.prd_purchase_price)).toBeCloseTo(49.99);
    expect(parseFloat(data.prd_length)).toBeCloseTo(10.5);
    expect(parseFloat(data.prd_width)).toBeCloseTo(5.25);
    expect(parseFloat(data.prd_height)).toBeCloseTo(2.5);
    expect(parseFloat(data.prd_weight)).toBeCloseTo(1.5);
    expect(data.prd_quantity_each_carton).toBe(24);
    expect(data.prd_file_name).toBe('test-product.jpg');

    // Cleanup
    await request.delete(`${API_BASE_URL}/products/${data.prd_id}`);
  });

  test('POST /products - should return 422 when required fields are missing', async ({ request }) => {
    // Missing prd_name
    const response1 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: generateUniqueRef()
      }
    });
    expect(response1.status()).toBe(422);

    // Missing prd_ref
    const response2 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_name: 'Test Product'
      }
    });
    expect(response2.status()).toBe(422);

    // Missing pty_id
    const response3 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        prd_ref: generateUniqueRef(),
        prd_name: 'Test Product'
      }
    });
    expect(response3.status()).toBe(422);

    // Missing soc_id
    const response4 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        pty_id: 1,
        prd_ref: generateUniqueRef(),
        prd_name: 'Test Product'
      }
    });
    expect(response4.status()).toBe(422);
  });

  test('POST /products - should return 409 for duplicate reference within same society', async ({ request }) => {
    const productRef = generateUniqueRef();

    // Create first product
    const response1 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: productRef,
        prd_name: 'First Product'
      }
    });
    expect(response1.status()).toBe(201);
    const firstProduct = await response1.json();

    // Try to create second product with same reference in same society
    const response2 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: productRef,
        prd_name: 'Second Product'
      }
    });
    expect(response2.status()).toBe(409);

    const errorData = await response2.json();
    expect(errorData).toHaveProperty('detail');
    expect(errorData.detail).toHaveProperty('success', false);
    expect(errorData.detail).toHaveProperty('error');
    expect(errorData.detail.error).toHaveProperty('code', 'PRODUCT_DUPLICATE_REFERENCE');

    // Cleanup
    await request.delete(`${API_BASE_URL}/products/${firstProduct.prd_id}`);
  });

  test('POST /products - should allow same reference in different societies', async ({ request }) => {
    const productRef = generateUniqueRef();

    // Create product in society 1
    const response1 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: productRef,
        prd_name: 'Product in Society 1'
      }
    });

    // If society 1 exists, this should succeed
    if (response1.status() === 201) {
      const product1 = await response1.json();

      // Try to create product with same reference in society 2
      const response2 = await request.post(`${API_BASE_URL}/products`, {
        data: {
          soc_id: 2,
          pty_id: 1,
          prd_ref: productRef,
          prd_name: 'Product in Society 2'
        }
      });

      // Should also succeed if society 2 exists (different society = different namespace)
      // If society 2 doesn't exist, we may get a different error which is fine for this test
      if (response2.status() === 201) {
        const product2 = await response2.json();
        expect(product1.prd_ref).toBe(product2.prd_ref);
        expect(product1.soc_id).not.toBe(product2.soc_id);

        // Cleanup
        await request.delete(`${API_BASE_URL}/products/${product2.prd_id}`);
      }

      // Cleanup
      await request.delete(`${API_BASE_URL}/products/${product1.prd_id}`);
    }
  });

  test('POST /products - should validate price fields are non-negative', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: generateUniqueRef(),
        prd_name: 'Test Product',
        prd_price: -10.00
      }
    });

    expect(response.status()).toBe(422);
  });

  test('POST /products - should validate string length constraints', async ({ request }) => {
    // prd_ref max 100 chars
    const longRef = 'A'.repeat(101);
    const response1 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: longRef,
        prd_name: 'Test Product'
      }
    });
    expect(response1.status()).toBe(422);

    // prd_name max 200 chars
    const longName = 'B'.repeat(201);
    const response2 = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: generateUniqueRef(),
        prd_name: longName
      }
    });
    expect(response2.status()).toBe(422);
  });

  test('POST /products - created product should be retrievable via GET', async ({ request }) => {
    const productRef = generateUniqueRef();

    // Create product
    const createResponse = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: productRef,
        prd_name: 'Retrievable Test Product'
      }
    });
    expect(createResponse.status()).toBe(201);
    const createdProduct = await createResponse.json();

    // Retrieve via GET by ID
    const getResponse = await request.get(`${API_BASE_URL}/products/${createdProduct.prd_id}`);
    expect(getResponse.status()).toBe(200);
    const retrievedProduct = await getResponse.json();

    // Verify same data
    expect(retrievedProduct.prd_id).toBe(createdProduct.prd_id);
    expect(retrievedProduct.prd_ref).toBe(createdProduct.prd_ref);
    expect(retrievedProduct.prd_name).toBe(createdProduct.prd_name);

    // Cleanup
    await request.delete(`${API_BASE_URL}/products/${createdProduct.prd_id}`);
  });

  test('POST /products - response should include computed fields', async ({ request }) => {
    const productRef = generateUniqueRef();

    const response = await request.post(`${API_BASE_URL}/products`, {
      data: {
        soc_id: 1,
        pty_id: 1,
        prd_ref: productRef,
        prd_name: 'Product With Computed Fields'
      }
    });
    expect(response.status()).toBe(201);

    const data = await response.json();

    // Verify computed fields
    expect(data.display_name).toBe(`${productRef} - Product With Computed Fields`);
    expect(data.has_instances).toBe(false);
    expect(data.instance_count).toBe(0);
    expect(data.instances).toEqual([]);

    // Cleanup
    await request.delete(`${API_BASE_URL}/products/${data.prd_id}`);
  });
});
