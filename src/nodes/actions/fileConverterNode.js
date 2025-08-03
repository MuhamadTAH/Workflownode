/*
=================================================================
BACKEND FILE: src/nodes/actions/fileConverterNode.js
=================================================================
File Converter/Proxy Node for Telegram-compatible URLs.
Converts various file sources to publicly accessible URLs that Telegram can use.
*/

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const fileConverterNode = {
    description: {
        displayName: 'File Converter',
        name: 'fileConverter',
        icon: 'fa:file-arrow-up',
        group: 'actions',
        version: 1,
        description: 'Converts files from various sources (Google Drive, Base64, local files) to Telegram-compatible URLs.',
        defaults: {
            name: 'File Converter',
        },
        properties: [
            {
                displayName: 'Input Type',
                name: 'inputType',
                type: 'options',
                options: [
                    { name: 'Telegram file_id', value: 'telegram_file_id' },
                    { name: 'Google Drive URL', value: 'google_drive' },
                    { name: 'Base64 Data', value: 'base64' },
                    { name: 'Direct URL (needs proxy)', value: 'direct_url' },
                    { name: 'OneDrive/SharePoint URL', value: 'onedrive' },
                    { name: 'Dropbox URL', value: 'dropbox' },
                    { name: 'Local File Path', value: 'local_file' },
                ],
                default: 'google_drive',
                required: true,
                description: 'Type of file source to convert.',
            },
            
            // Telegram file_id fields
            {
                displayName: 'Telegram Bot Token',
                name: 'telegramBotToken',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Bot token for accessing Telegram files. Supports template variables.',
                placeholder: '1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ',
                displayOptions: {
                    show: {
                        inputType: ['telegram_file_id']
                    }
                }
            },
            {
                displayName: 'Telegram file_id',
                name: 'telegramFileId',
                type: 'string',
                default: '',
                required: true,
                description: 'Telegram file_id from received media. Supports template variables.',
                placeholder: 'BAADBAADBgADBREAAR4BAAFXvv0lAg',
                displayOptions: {
                    show: {
                        inputType: ['telegram_file_id']
                    }
                }
            },
            
            // Google Drive fields
            {
                displayName: 'Google Drive URL',
                name: 'googleDriveUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'Google Drive sharing URL or file ID. Supports template variables.',
                placeholder: 'https://drive.google.com/file/d/1ABC123.../view or 1ABC123...',
                displayOptions: {
                    show: {
                        inputType: ['google_drive']
                    }
                }
            },
            
            // Base64 fields
            {
                displayName: 'Base64 Data',
                name: 'base64Data',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                required: true,
                description: 'Base64 encoded file data. Supports template variables.',
                placeholder: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ... or just the base64 string',
                displayOptions: {
                    show: {
                        inputType: ['base64']
                    }
                }
            },
            {
                displayName: 'File Extension',
                name: 'fileExtension',
                type: 'string',
                default: '',
                required: true,
                description: 'File extension for base64 data (e.g., jpg, png, mp4, pdf)',
                placeholder: 'jpg',
                displayOptions: {
                    show: {
                        inputType: ['base64']
                    }
                }
            },
            
            // Direct URL fields
            {
                displayName: 'File URL',
                name: 'fileUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'Direct URL to file that needs proxying. Supports template variables.',
                placeholder: 'https://example.com/protected/file.jpg',
                displayOptions: {
                    show: {
                        inputType: ['direct_url', 'onedrive', 'dropbox']
                    }
                }
            },
            
            // Local file fields
            {
                displayName: 'Local File Path',
                name: 'localFilePath',
                type: 'string',
                default: '',
                required: true,
                description: 'Path to local file on server. Supports template variables.',
                placeholder: '/tmp/uploads/image.jpg',
                displayOptions: {
                    show: {
                        inputType: ['local_file']
                    }
                }
            },
            
            // Output options
            {
                displayName: 'Output Format',
                name: 'outputFormat',
                type: 'options',
                options: [
                    { name: 'Keep Original', value: 'original' },
                    { name: 'Convert to JPG', value: 'jpg' },
                    { name: 'Convert to PNG', value: 'png' },
                    { name: 'Convert to WebP', value: 'webp' },
                    { name: 'Convert to MP4', value: 'mp4' },
                    { name: 'Convert to PDF', value: 'pdf' },
                ],
                default: 'original',
                required: false,
                description: 'Convert file to specific format (requires conversion service).',
            },
            
            {
                displayName: 'Hosting Service',
                name: 'hostingService',
                type: 'options',
                options: [
                    { name: 'Temporary File Server', value: 'temp_server' },
                    { name: 'ImgBB (Images only)', value: 'imgbb' },
                    { name: 'Imgur (Images only)', value: 'imgur' },
                    { name: 'File.io (Temporary)', value: 'fileio' },
                    { name: 'Telegraph (Images only)', value: 'telegraph' },
                ],
                default: 'temp_server',
                required: false,
                description: 'Service to host the converted file.',
            },
            
            // API keys for hosting services
            {
                displayName: 'ImgBB API Key',
                name: 'imgbbApiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: false,
                description: 'ImgBB API key (get from https://api.imgbb.com/)',
                displayOptions: {
                    show: {
                        hostingService: ['imgbb']
                    }
                }
            },
            
            {
                displayName: 'Imgur Client ID',
                name: 'imgurClientId',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: false,
                description: 'Imgur Client ID (get from https://api.imgur.com/)',
                displayOptions: {
                    show: {
                        hostingService: ['imgur']
                    }
                }
            },
            
            // Advanced options
            {
                displayName: 'Image Quality (1-100)',
                name: 'imageQuality',
                type: 'number',
                default: 85,
                required: false,
                description: 'JPEG compression quality (1-100, higher = better quality)',
                displayOptions: {
                    show: {
                        outputFormat: ['jpg']
                    }
                }
            },
            
            {
                displayName: 'Max File Size (MB)',
                name: 'maxFileSizeMB',
                type: 'number',
                default: 50,
                required: false,
                description: 'Maximum file size allowed in MB (Telegram limit: 50MB)',
            },
            
            {
                displayName: 'Cache Duration (hours)',
                name: 'cacheDurationHours',
                type: 'number',
                default: 24,
                required: false,
                description: 'How long to keep the file accessible (1-168 hours)',
            },
        ],
    },

    // Execute the File Converter node
    async execute(nodeConfig, inputData, connectedNodes = []) {
        console.log('=== FILE CONVERTER DEBUG ===');
        console.log('Input Type:', nodeConfig.inputType);
        console.log('Hosting Service:', nodeConfig.hostingService);
        
        // Universal Template Parser
        const parseUniversalTemplate = (inputStr, json) => {
            if (!inputStr || typeof inputStr !== 'string') return inputStr || '';
            
            let result = inputStr;
            
            // Handle {{$json.path}} format
            result = result.replace(/\{\{\s*\$json\.(.*?)\s*\}\}/g, (match, path) => {
                try {
                    if (!json) return match;
                    
                    if (Object.keys(json).some(key => key.startsWith('step_'))) {
                        for (const [stepKey, stepValue] of Object.entries(json)) {
                            if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
                                const keys = path.split('.');
                                let value = stepValue;
                                let found = true;
                                
                                for (const key of keys) {
                                    if (value && typeof value === 'object' && key in value) {
                                        value = value[key];
                                    } else {
                                        found = false;
                                        break;
                                    }
                                }
                                
                                if (found) {
                                    return String(value || '');
                                }
                            }
                        }
                        return match;
                    } else {
                        const keys = path.split('.');
                        let value = json;
                        for (const key of keys) {
                            if (value && typeof value === 'object' && key in value) {
                                value = value[key];
                            } else {
                                return match;
                            }
                        }
                        return String(value || '');
                    }
                } catch (error) {
                    console.error('Error parsing template:', error);
                    return match;
                }
            });
            
            // Handle {{nodePrefix.path}} format
            result = result.replace(/\{\{\s*([a-zA-Z_]+)\.(.+?)\s*\}\}/g, (match, nodePrefix, path) => {
                try {
                    let dataSource = null;
                    
                    if (Object.keys(json).some(key => key.startsWith('step_'))) {
                        for (const [stepKey, stepValue] of Object.entries(json)) {
                            if (stepKey.startsWith('step_') && typeof stepValue === 'object') {
                                const stepName = stepKey.replace(/^step_\d+_/, '').toLowerCase().replace(/_/g, '');
                                const prefixName = nodePrefix.toLowerCase().replace(/_/g, '');
                                
                                if (stepName.includes(prefixName) || prefixName.includes(stepName)) {
                                    dataSource = stepValue;
                                    break;
                                }
                            }
                        }
                    } else {
                        if (json[nodePrefix]) {
                            dataSource = json[nodePrefix];
                        } else {
                            dataSource = json;
                        }
                    }
                    
                    if (!dataSource) return match;
                    
                    const keys = path.split('.');
                    let value = dataSource;
                    
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            return match;
                        }
                    }
                    
                    return String(value || '');
                } catch (error) {
                    console.error('Error parsing nodePrefix template:', error);
                    return match;
                }
            });
            
            return result;
        };

        const { 
            inputType,
            telegramBotToken,
            telegramFileId,
            googleDriveUrl,
            base64Data,
            fileExtension,
            fileUrl,
            localFilePath,
            outputFormat = 'original',
            hostingService = 'temp_server',
            imgbbApiKey,
            imgurClientId,
            imageQuality = 85,
            maxFileSizeMB = 50,
            cacheDurationHours = 24
        } = nodeConfig;
        
        try {
            let fileBuffer, fileName, mimeType;
            
            // Step 1: Get file from source
            switch (inputType) {
                case 'telegram_file_id':
                    const processedBotToken = parseUniversalTemplate(telegramBotToken, inputData);
                    const processedFileId = parseUniversalTemplate(telegramFileId, inputData);
                    const telegramResult = await this.getTelegramFile(processedBotToken, processedFileId);
                    fileBuffer = telegramResult.buffer;
                    fileName = telegramResult.fileName;
                    mimeType = telegramResult.mimeType;
                    break;
                    
                case 'google_drive':
                    const processedGoogleUrl = parseUniversalTemplate(googleDriveUrl, inputData);
                    const result = await this.getGoogleDriveFile(processedGoogleUrl);
                    fileBuffer = result.buffer;
                    fileName = result.fileName;
                    mimeType = result.mimeType;
                    break;
                    
                case 'base64':
                    const processedBase64 = parseUniversalTemplate(base64Data, inputData);
                    const processedExtension = parseUniversalTemplate(fileExtension, inputData);
                    const base64Result = await this.getBase64File(processedBase64, processedExtension);
                    fileBuffer = base64Result.buffer;
                    fileName = base64Result.fileName;
                    mimeType = base64Result.mimeType;
                    break;
                    
                case 'direct_url':
                case 'onedrive':
                case 'dropbox':
                    const processedFileUrl = parseUniversalTemplate(fileUrl, inputData);
                    const urlResult = await this.getUrlFile(processedFileUrl, inputType);
                    fileBuffer = urlResult.buffer;
                    fileName = urlResult.fileName;
                    mimeType = urlResult.mimeType;
                    break;
                    
                case 'local_file':
                    const processedLocalPath = parseUniversalTemplate(localFilePath, inputData);
                    const localResult = await this.getLocalFile(processedLocalPath);
                    fileBuffer = localResult.buffer;
                    fileName = localResult.fileName;
                    mimeType = localResult.mimeType;
                    break;
                    
                default:
                    throw new Error(`Unsupported input type: ${inputType}`);
            }
            
            // Step 2: Validate file size
            const fileSizeBytes = fileBuffer.length;
            const fileSizeMB = fileSizeBytes / (1024 * 1024);
            
            if (fileSizeMB > maxFileSizeMB) {
                throw new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxFileSizeMB}MB)`);
            }
            
            console.log(`File retrieved: ${fileName} (${fileSizeMB.toFixed(2)}MB, ${mimeType})`);
            
            // Step 3: Convert format if needed
            if (outputFormat !== 'original') {
                const convertResult = await this.convertFile(fileBuffer, fileName, mimeType, outputFormat, imageQuality);
                fileBuffer = convertResult.buffer;
                fileName = convertResult.fileName;
                mimeType = convertResult.mimeType;
            }
            
            // Step 4: Upload to hosting service
            const uploadResult = await this.uploadToHostingService(
                fileBuffer, 
                fileName, 
                mimeType, 
                hostingService,
                { imgbbApiKey, imgurClientId, cacheDurationHours }
            );
            
            console.log(`File uploaded successfully: ${uploadResult.url}`);
            
            return {
                success: true,
                originalUrl: inputType === 'telegram_file_id' ? telegramFileId :
                           inputType === 'google_drive' ? googleDriveUrl : 
                           inputType === 'base64' ? 'base64_data' : 
                           inputType === 'local_file' ? localFilePath : fileUrl,
                convertedUrl: uploadResult.url,
                fileName: fileName,
                mimeType: mimeType,
                fileSize: fileSizeBytes,
                fileSizeMB: fileSizeMB,
                inputType: inputType,
                outputFormat: outputFormat,
                hostingService: hostingService,
                expiresAt: uploadResult.expiresAt,
                deleteUrl: uploadResult.deleteUrl,
                metadata: uploadResult.metadata || {},
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('=== FILE CONVERTER ERROR ===');
            console.error('Error:', error.message);
            
            throw new Error(`File conversion failed: ${error.message}`);
        }
    },

    // Get file from Telegram file_id
    async getTelegramFile(botToken, fileId) {
        console.log('Getting Telegram file:', fileId);
        
        try {
            // Step 1: Get file info from Telegram API
            const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile`;
            const fileInfoResponse = await axios.post(getFileUrl, {
                file_id: fileId
            });

            if (!fileInfoResponse.data.ok) {
                throw new Error(`Telegram API error: ${fileInfoResponse.data.description}`);
            }

            const filePath = fileInfoResponse.data.result.file_path;
            const fileSize = fileInfoResponse.data.result.file_size;
            
            console.log(`File info retrieved: ${filePath} (${fileSize} bytes)`);
            
            // Step 2: Download file from Telegram servers
            const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
            
            const downloadResponse = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 52428800, // 50MB
            });
            
            const buffer = Buffer.from(downloadResponse.data);
            const contentType = downloadResponse.headers['content-type'] || 'application/octet-stream';
            
            // Extract filename from file path
            let fileName = 'telegram_file';
            if (filePath) {
                const pathParts = filePath.split('/');
                fileName = pathParts[pathParts.length - 1];
            }
            
            // Detect actual file type from buffer content (magic bytes)
            const actualMimeType = this.detectFileTypeFromBuffer(buffer) || contentType;
            const actualExtension = this.getExtensionFromMimeType(actualMimeType);
            
            // If filename has wrong extension, fix it based on actual content
            if (fileName.includes('.')) {
                const currentExtension = fileName.split('.').pop().toLowerCase();
                const expectedExtension = this.getExtensionFromMimeType(actualMimeType);
                
                if (currentExtension !== expectedExtension) {
                    console.log(`🔧 File type mismatch detected: ${fileName} is actually ${actualMimeType}`);
                    console.log(`🔧 Correcting extension from .${currentExtension} to .${expectedExtension}`);
                    fileName = fileName.replace(/\.[^.]+$/, `.${expectedExtension}`);
                }
            } else {
                // Add extension based on actual content type
                fileName += `.${actualExtension}`;
            }
            
            return {
                buffer: buffer,
                fileName: fileName,
                mimeType: actualMimeType
            };
            
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 400) {
                    throw new Error('Invalid file_id or file not found');
                } else if (status === 401) {
                    throw new Error('Invalid bot token');
                } else if (status === 403) {
                    throw new Error('Bot doesn\'t have access to this file');
                }
            }
            throw new Error(`Failed to get Telegram file: ${error.message}`);
        }
    },

    // Get file from Google Drive
    async getGoogleDriveFile(url) {
        console.log('Getting Google Drive file:', url);
        
        // Extract file ID from various Google Drive URL formats
        let fileId = url;
        const patterns = [
            /\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /^([a-zA-Z0-9-_]+)$/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                fileId = match[1];
                break;
            }
        }
        
        // Use Google Drive direct download URL
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        try {
            const response = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 52428800, // 50MB
            });
            
            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            
            // Try to get filename from headers
            let fileName = 'file';
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }
            
            // Add extension based on content type if not present
            if (!fileName.includes('.')) {
                const extension = this.getExtensionFromMimeType(contentType);
                fileName += `.${extension}`;
            }
            
            return {
                buffer: buffer,
                fileName: fileName,
                mimeType: actualMimeType
            };
            
        } catch (error) {
            if (error.response && error.response.status === 429) {
                throw new Error('Google Drive download quota exceeded. Try again later.');
            }
            throw new Error(`Failed to download from Google Drive: ${error.message}`);
        }
    },

    // Get file from Base64 data
    async getBase64File(base64Data, extension) {
        console.log('Processing Base64 file with extension:', extension);
        
        let base64String = base64Data;
        
        // Remove data URL prefix if present
        if (base64String.startsWith('data:')) {
            base64String = base64String.split(',')[1];
        }
        
        try {
            const buffer = Buffer.from(base64String, 'base64');
            const mimeType = this.getMimeTypeFromExtension(extension);
            const fileName = `file.${extension}`;
            
            return {
                buffer: buffer,
                fileName: fileName,
                mimeType: mimeType
            };
            
        } catch (error) {
            throw new Error(`Invalid Base64 data: ${error.message}`);
        }
    },

    // Get file from direct URL
    async getUrlFile(url, inputType) {
        console.log(`Getting file from ${inputType}:`, url);
        
        let processedUrl = url;
        
        // Handle OneDrive sharing URLs
        if (inputType === 'onedrive' && url.includes('1drv.ms')) {
            // Convert OneDrive sharing URL to direct download
            processedUrl = url.replace('1drv.ms', '1drv.ms/download');
        }
        
        // Handle Dropbox sharing URLs
        if (inputType === 'dropbox' && url.includes('dropbox.com') && url.includes('dl=0')) {
            processedUrl = url.replace('dl=0', 'dl=1');
        }
        
        try {
            const response = await axios.get(processedUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 52428800, // 50MB
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            
            // Extract filename from URL or headers
            let fileName = 'file';
            const urlParts = processedUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
                fileName = lastPart.split('?')[0];
            }
            
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }
            
            if (!fileName.includes('.')) {
                const extension = this.getExtensionFromMimeType(contentType);
                fileName += `.${extension}`;
            }
            
            return {
                buffer: buffer,
                fileName: fileName,
                mimeType: actualMimeType
            };
            
        } catch (error) {
            throw new Error(`Failed to download from URL: ${error.message}`);
        }
    },

    // Get local file
    async getLocalFile(filePath) {
        console.log('Getting local file:', filePath);
        
        try {
            const buffer = await fs.readFile(filePath);
            const fileName = path.basename(filePath);
            const extension = path.extname(filePath).substring(1);
            const mimeType = this.getMimeTypeFromExtension(extension);
            
            return {
                buffer: buffer,
                fileName: fileName,
                mimeType: mimeType
            };
            
        } catch (error) {
            throw new Error(`Failed to read local file: ${error.message}`);
        }
    },

    // Convert file format (basic implementation)
    async convertFile(buffer, fileName, mimeType, outputFormat, quality) {
        console.log(`Converting ${mimeType} to ${outputFormat}`);
        
        // For now, return original file (would need image processing library like Sharp)
        // This is a placeholder for future implementation
        const newMimeType = this.getMimeTypeFromExtension(outputFormat);
        const newFileName = fileName.replace(/\.[^.]+$/, `.${outputFormat}`);
        
        return {
            buffer: buffer,
            fileName: newFileName,
            mimeType: newMimeType
        };
    },

    // Upload to hosting service
    async uploadToHostingService(buffer, fileName, mimeType, service, options) {
        console.log(`Uploading to ${service}:`, fileName);
        
        switch (service) {
            case 'imgbb':
                return await this.uploadToImgBB(buffer, fileName, options.imgbbApiKey);
                
            case 'imgur':
                return await this.uploadToImgur(buffer, fileName, options.imgurClientId);
                
            case 'telegraph':
                return await this.uploadToTelegraph(buffer, fileName);
                
            case 'fileio':
                return await this.uploadToFileIO(buffer, fileName);
                
            case 'temp_server':
            default:
                return await this.uploadToTempServer(buffer, fileName, mimeType, options.cacheDurationHours);
        }
    },

    // Upload to ImgBB
    async uploadToImgBB(buffer, fileName, apiKey) {
        if (!apiKey) {
            throw new Error('ImgBB API key is required');
        }
        
        const base64String = buffer.toString('base64');
        
        try {
            const response = await axios.post('https://api.imgbb.com/1/upload', {
                key: apiKey,
                image: base64String,
                name: fileName
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            if (response.data.success) {
                return {
                    url: response.data.data.url,
                    deleteUrl: response.data.data.delete_url,
                    expiresAt: null, // ImgBB doesn't expire
                    metadata: response.data.data
                };
            } else {
                throw new Error('ImgBB upload failed');
            }
        } catch (error) {
            throw new Error(`ImgBB upload error: ${error.message}`);
        }
    },

    // Upload to temporary server (real implementation)
    async uploadToTempServer(buffer, fileName, mimeType, hours) {
        const fileId = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        
        try {
            // Create directory structure: temp-files/fileId/fileName
            const tempFilesDir = path.join(process.cwd(), 'temp-files');
            const fileDir = path.join(tempFilesDir, fileId);
            
            // Ensure directories exist
            await fs.mkdir(fileDir, { recursive: true });
            
            // Save the file
            const filePath = path.join(fileDir, fileName);
            await fs.writeFile(filePath, buffer);
            
            console.log(`File saved to temp server: ${filePath}`);
            
            // Determine the base URL (local vs production)
            const baseUrl = process.env.BASE_URL || 'http://localhost:10000';
            
            return {
                url: `${baseUrl}/temp-files/${fileId}/${fileName}`,
                deleteUrl: `${baseUrl}/temp-files/delete/${fileId}`,
                expiresAt: expiresAt,
                metadata: { fileId, originalName: fileName, filePath: filePath }
            };
        } catch (error) {
            console.error('Error saving file to temp server:', error);
            throw new Error(`Failed to save file to temp server: ${error.message}`);
        }
    },

    // Detect file type from buffer content (magic bytes)
    detectFileTypeFromBuffer(buffer) {
        if (!buffer || buffer.length < 4) return null;
        
        // Check magic bytes for common file types
        const bytes = buffer.subarray(0, 12);
        
        // JPEG: FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return 'image/jpeg';
        }
        
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return 'image/png';
        }
        
        // GIF: 47 49 46 38 (GIF8)
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            return 'image/gif';
        }
        
        // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50 (RIFF????WEBP)
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
            return 'image/webp';
        }
        
        // MP4: ?? ?? ?? ?? 66 74 79 70 (????ftyp)
        if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
            return 'video/mp4';
        }
        
        // AVI: 52 49 46 46 ?? ?? ?? ?? 41 56 49 20 (RIFF????AVI )
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes[8] === 0x41 && bytes[9] === 0x56 && bytes[10] === 0x49 && bytes[11] === 0x20) {
            return 'video/x-msvideo';
        }
        
        // PDF: 25 50 44 46 (%PDF)
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            return 'application/pdf';
        }
        
        // MP3: ID3 tag (49 44 33) or MPEG sync (FF FB or FF F3 or FF F2)
        if ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
            (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2))) {
            return 'audio/mpeg';
        }
        
        // OGG: 4F 67 67 53 (OggS)
        if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
            return 'audio/ogg';
        }
        
        return null; // Unknown file type
    },

    // Helper functions
    getMimeTypeFromExtension(extension) {
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain'
        };
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    },

    getExtensionFromMimeType(mimeType) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'video/quicktime': 'mov',
            'video/x-msvideo': 'avi',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'audio/ogg': 'ogg',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'text/plain': 'txt'
        };
        return extensions[mimeType] || 'bin';
    }
};

module.exports = fileConverterNode;