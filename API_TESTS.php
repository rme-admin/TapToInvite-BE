<?php
/**
 * API Integration Test Script
 * This script tests the admin content management API endpoints
 */

use PHPUnit\Framework\TestCase;

class AdminContentAPITest extends TestCase {
    private $baseUrl = 'http://localhost:3000/api/admin';
    private $accessToken = 'YOUR_ACCESS_TOKEN_HERE'; // Will be replaced with real token during testing

    /**
     * Test 1: Get all pages content (paginated)
     */
    public function testGetAllPagesContent() {
        $url = $this->baseUrl . '/content?page=1&limit=10';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        echo "Test 1: Get All Pages\n";
        echo "URL: $url\n";
        echo "Status Code: $httpCode\n";
        echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";
    }

    /**
     * Test 2: Get specific page content (landing page)
     */
    public function testGetPageContent() {
        $url = $this->baseUrl . '/content/landing';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        echo "Test 2: Get Landing Page Content\n";
        echo "URL: $url\n";
        echo "Status Code: $httpCode\n";
        echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";
    }

    /**
     * Test 3: Save page content (create or update)
     */
    public function testSavePageContent() {
        $url = $this->baseUrl . '/content/landing';
        
        $content = [
            'title' => 'Landing Page Content',
            'content' => [
                'hero' => [
                    ['key' => 'HeroSection-Title', 'label' => 'Main Title', 'value' => 'Test Title', 'type' => 'text']
                ],
                'collections' => [],
                'collectionsData' => [
                    ['id' => '1', 'title' => 'Test Collection', 'subtitle' => 'Test', 'description' => 'Description', 'image' => '']
                ],
                'benefits' => [],
                'benefitsData' => [
                    ['id' => '1', 'title' => 'Test Benefit', 'description' => 'Description', 'icon' => '']
                ],
                'steps' => [],
                'stepsData' => [
                    ['id' => '1', 'number' => '1', 'title' => 'Step 1', 'description' => 'Description']
                ],
                'testimonials' => [],
                'testimonialsData' => [
                    ['id' => '1', 'name' => 'Test User', 'event' => 'Test Event', 'content' => 'Great!', 'image' => '']
                ]
            ]
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($content));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        echo "Test 3: Save Landing Page Content\n";
        echo "URL: $url (POST)\n";
        echo "Status Code: $httpCode\n";
        echo "Response:\n" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";
    }
}

// Run tests
echo "========================================\n";
echo "Admin Content Management API Tests\n";
echo "========================================\n\n";

$test = new AdminContentAPITest();
$test->testGetAllPagesContent();
$test->testGetPageContent();
$test->testSavePageContent();

echo "========================================\n";
echo "Tests Complete\n";
echo "========================================\n";
?>
