// test-pexels.js
import 'dotenv/config';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

async function fetchPexelsImage(query) {
    try {
        // Check if API key exists
        if (!process.env.PEXELS_API_KEY) {
            console.error('❌ PEXELS_API_KEY not found in environment variables');
            return FALLBACK_IMAGE;
        }

        // Build search query with food context
        const searchQuery = `${query} food meal`;
        const q = encodeURIComponent(searchQuery);
        const url = `https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=landscape`;
        
        console.log('🔍 Searching Pexels for:', searchQuery);

        const res = await fetch(url, {
            headers: { 
                Authorization: process.env.PEXELS_API_KEY
            },
        });

        // Log the response status
        console.log('📡 Pexels API Status:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Pexels API Error:', res.status, errorText);
            return FALLBACK_IMAGE;
        }

        const data = await res.json();
        
        // Check if we got results
        if (!data.photos || data.photos.length === 0) {
            console.warn('⚠️ No images found for:', searchQuery);
            return FALLBACK_IMAGE;
        }

        const photo = data.photos[0];
        const imageUrl = photo.src.large || photo.src.original || FALLBACK_IMAGE;
        
        console.log('✅ Image found:', imageUrl);
        console.log('📸 Photographer:', photo.photographer);
        console.log('🔗 Photo URL:', photo.url);
        return imageUrl;

    } catch (err) {
        console.error('❌ Error fetching image:', err.message);
        console.error('Stack trace:', err.stack);
        return FALLBACK_IMAGE;
    }
}

async function testPexelsAPI() {
    console.log('\n========================================');
    console.log('🧪 TESTING PEXELS API');
    console.log('========================================\n');
    
    const apiKey = process.env.PEXELS_API_KEY;
    
    console.log('📋 ENVIRONMENT CHECK:');
    console.log('  API Key exists:', !!apiKey);
    console.log('  API Key length:', apiKey?.length || 0);
    console.log('  API Key preview:', apiKey ? apiKey.substring(0, 20) + '...' : 'NOT FOUND');
    console.log('');
    
    if (!apiKey) {
        console.error('❌ SETUP ERROR: PEXELS_API_KEY not found!');
        console.log('\n📝 To fix this:');
        console.log('  1. Go to https://www.pexels.com/api/');
        console.log('  2. Sign up and get your API key');
        console.log('  3. Add to .env file: PEXELS_API_KEY=your_key_here');
        console.log('  4. Run this test again\n');
        return;
    }
    
    // Test multiple food items
    const testQueries = ['pasta', 'burger', 'salad', 'sushi', 'pizza'];
    
    console.log('🔍 TESTING MULTIPLE QUERIES:\n');
    
    for (const query of testQueries) {
        console.log(`--- Testing: ${query} ---`);
        const result = await fetchPexelsImage(query);
        
        if (result === FALLBACK_IMAGE) {
            console.log('⚠️ Returned fallback image\n');
        } else {
            console.log('✅ Success!\n');
        }
    }
    
    console.log('========================================');
    console.log('✅ TEST COMPLETE');
    console.log('========================================\n');
}

testPexelsAPI();