/*
Test Video File Conversion with Magic Bytes Detection
Tests different video formats and file type detection
*/

const fileConverterNode = require('./src/nodes/actions/fileConverterNode');

async function testVideoConversion() {
    console.log('🎬 VIDEO CONVERSION TEST');
    console.log('========================');
    
    // Test 1: Real MP4 video (base64 encoded minimal MP4)
    // This is a tiny valid MP4 file (about 200 bytes)
    const tinyMp4Base64 = 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAXRtZGF0AAABAA==';
    
    const testConfigs = [
        {
            name: 'Real MP4 Video',
            config: {
                inputType: 'base64',
                base64Data: tinyMp4Base64,
                fileExtension: 'mp4',
                hostingService: 'temp_server',
                cacheDurationHours: 1
            }
        },
        {
            name: 'Fake MP4 (Actually JPEG)',
            config: {
                inputType: 'base64',
                base64Data: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EACUQAAEDAwMEAwEAAAAAAAAAAAABESECEgMxYVFBcYGRobHB8P/aAAgBAQAAPwDv6fXyOm5gCdmhKGM9fQKkN7eaQZ1qMYZCU3VHXO/r9fI6bmAJ2aEoYz19AqQ3t5pBnWoxhkJTdUdc7+v1',
                fileExtension: 'mp4', // Wrong extension
                hostingService: 'temp_server',
                cacheDurationHours: 1
            }
        }
    ];
    
    for (let i = 0; i < testConfigs.length; i++) {
        const test = testConfigs[i];
        console.log(`\n📋 Test ${i + 1}: ${test.name}`);
        console.log('─'.repeat(40));
        
        try {
            const result = await fileConverterNode.execute(test.config, {});
            
            console.log('✅ Conversion Result:');
            console.log(`   📁 File Name: ${result.fileName}`);
            console.log(`   🎭 MIME Type: ${result.mimeType}`);
            console.log(`   📏 File Size: ${result.fileSizeMB} MB`);
            console.log(`   🔗 URL: ${result.convertedUrl}`);
            
            // Test URL accessibility
            console.log('\n🌐 Testing URL accessibility...');
            try {
                const response = await fetch(result.convertedUrl);
                if (response.ok) {
                    console.log(`   ✅ HTTP ${response.status} - ${response.statusText}`);
                    console.log(`   📦 Content-Type: ${response.headers.get('content-type')}`);
                    console.log(`   📏 Content-Length: ${response.headers.get('content-length')}`);
                    
                    // For videos, check if it has video-specific headers
                    if (result.mimeType.startsWith('video/')) {
                        console.log('   🎬 Video file detected - checking headers...');
                        console.log(`   🎯 Accept-Ranges: ${response.headers.get('accept-ranges')}`);
                    }
                } else {
                    console.log(`   ❌ HTTP ${response.status} - ${response.statusText}`);
                }
            } catch (fetchError) {
                // Try with require instead
                const https = require('https');
                const http = require('http');
                const url = require('url');
                
                const urlObj = url.parse(result.convertedUrl);
                const client = urlObj.protocol === 'https:' ? https : http;
                
                const req = client.request({
                    hostname: urlObj.hostname,
                    port: urlObj.port,
                    path: urlObj.path,
                    method: 'HEAD'
                }, (res) => {
                    console.log(`   ✅ HTTP ${res.statusCode} - ${res.statusMessage}`);
                    console.log(`   📦 Content-Type: ${res.headers['content-type']}`);
                    console.log(`   📏 Content-Length: ${res.headers['content-length']}`);
                });
                
                req.on('error', (err) => {
                    console.log(`   ❌ Request failed: ${err.message}`);
                });
                
                req.end();
            }
            
        } catch (error) {
            console.log(`❌ Test Failed: ${error.message}`);
        }
    }
}

// Run the test
testVideoConversion().catch(console.error);