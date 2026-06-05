// Test script to debug admin settings save
const testAdminSave = async () => {
  console.log('🔍 Testing admin settings save functionality...\n');
  
  try {
    // Test the exact payload that frontend would send
    const testPayload = {
      trainerLevelSettings: {
        L1: { totalAssessmentsRequired: 10, minScore: 70, qualifyingAssessmentsRequired: 10, enabled: true },
        L2: { totalAssessmentsRequired: 10, minScore: 85, qualifyingAssessmentsRequired: 5, enabled: true, requiresPreviousLevel: true },
        L3: { totalAssessmentsRequired: 25, minScore: 90, qualifyingAssessmentsRequired: 5, enabled: true, requiresPreviousLevel: true }
      }
    };
    
    console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
    
    // Test the API call directly
    const response = await fetch('http://localhost:4000/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'test-session' // This would fail without proper auth, but let's see the error
      },
      body: JSON.stringify(testPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Save successful:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Save failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Test completed!');
};

testAdminSave();
