/*
=================================================================
DATA STORAGE NODE: Store and retrieve personal/workflow data
=================================================================
*/

class DataStorageNode {
  constructor(config = {}) {
    this.type = 'dataStorage';
    this.config = config;
  }

  // Process the data storage node
  async process(input = {}) {
    try {
      console.log('=== Data Storage Node Processing ===');
      console.log('Input:', input);
      console.log('Node config:', this.config);

      // Get stored data from configuration
      const storedData = this.config.storedData || {};
      
      // Action types: 'store' or 'retrieve'
      const action = this.config.action || 'retrieve';
      
      if (action === 'store') {
        // Store new data (this happens when user saves in ConfigPanel)
        console.log('Storing data:', storedData);
        return {
          success: true,
          action: 'store',
          message: 'Data stored successfully',
          storedFields: Object.keys(storedData),
          data: storedData
        };
      } else {
        // Retrieve stored data for other nodes to use
        console.log('Retrieving stored data:', storedData);
        
        // Create output with all stored fields
        const output = {
          success: true,
          action: 'retrieve',
          message: 'Data retrieved successfully',
          ...storedData // Spread all stored data as individual fields
        };
        
        return output;
      }
      
    } catch (error) {
      console.error('Error in Data Storage Node:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  // Get configuration schema for the frontend
  static getConfigSchema() {
    return {
      type: 'dataStorage',
      name: 'Data Storage',
      description: 'Store personal information and data for other nodes to use',
      inputs: ['Any data to store'],
      outputs: ['Stored data fields'],
      config: {
        action: {
          type: 'select',
          label: 'Action',
          options: [
            { value: 'retrieve', label: 'Retrieve Data' },
            { value: 'store', label: 'Store Data' }
          ],
          default: 'retrieve'
        },
        storedData: {
          type: 'object',
          label: 'Stored Data',
          description: 'Key-value pairs of data to store',
          default: {}
        }
      }
    };
  }
}

module.exports = DataStorageNode;