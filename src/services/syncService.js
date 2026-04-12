// Sync service for extension-web app integration
import { supabase } from './supabase';

class SyncService {
  constructor() {
    this.isExtension = typeof chrome !== 'undefined' && chrome.runtime;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Check if running in extension context
  isExtensionContext() {
    return this.isExtension;
  }

  // Get data from extension storage
  async getExtensionData() {
    if (!this.isExtensionContext()) {
      throw new Error('Not running in extension context');
    }

    try {
      const result = await chrome.storage.local.get(['recentScans', 'savedCollections']);
      return {
        recentScans: result.recentScans || [],
        savedCollections: result.savedCollections || []
      };
    } catch (error) {
      console.error('Error getting extension data:', error);
      throw error;
    }
  }

  // Save data to extension storage
  async saveExtensionData(data) {
    if (!this.isExtensionContext()) {
      throw new Error('Not running in extension context');
    }

    try {
      await chrome.storage.local.set(data);
      return true;
    } catch (error) {
      console.error('Error saving extension data:', error);
      throw error;
    }
  }

  // Sync extension collections to Supabase
  async syncCollectionsToCloud() {
    if (!this.isOnline) {
      this.addToSyncQueue('collectionsToCloud');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const extensionData = await this.getExtensionData();
      const collections = extensionData.savedCollections || [];

      // Sync each collection to Supabase
      for (const collection of collections) {
        const paletteData = {
          user_id: user.id,
          name: collection.name,
          colors: collection.colors,
          is_public: false,
          is_favorite: false,
          source: 'extension',
          extension_id: collection.id,
          created_at: collection.timestamp
        };

        // Check if already synced
        const { data: existing } = await supabase
          .from('palettes')
          .select('id')
          .eq('extension_id', collection.id)
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from('palettes')
            .update(paletteData)
            .eq('extension_id', collection.id);
        } else {
          // Insert new
          await supabase
            .from('palettes')
            .insert(paletteData);
        }
      }

      this.lastSyncTime = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('Error syncing collections to cloud:', error);
      this.addToSyncQueue('collectionsToCloud');
      return false;
    }
  }

  // Sync cloud palettes to extension
  async syncCloudToExtension() {
    if (!this.isOnline) {
      this.addToSyncQueue('cloudToExtension');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's palettes from cloud
      const { data: cloudPalettes } = await supabase
        .from('palettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Get current extension data
      const extensionData = await this.getExtensionData();
      let savedCollections = extensionData.savedCollections || [];

      // Merge cloud palettes with extension collections
      for (const cloudPalette of cloudPalettes) {
        // Skip if already exists in extension
        const exists = savedCollections.find(c => c.cloudId === cloudPalette.id);
        if (exists) continue;

        // Convert cloud palette to extension collection format
        const extensionCollection = {
          id: Date.now() + Math.random(), // Generate unique ID
          name: cloudPalette.name,
          colors: cloudPalette.colors,
          timestamp: cloudPalette.created_at,
          sourceUrl: cloudPalette.source_url || 'cloud',
          cloudId: cloudPalette.id,
          synced: true
        };

        savedCollections.unshift(extensionCollection);
      }

      // Save merged data back to extension
      await this.saveExtensionData({ savedCollections });
      this.lastSyncTime = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('Error syncing cloud to extension:', error);
      this.addToSyncQueue('cloudToExtension');
      return false;
    }
  }

  // Add sync operation to queue
  addToSyncQueue(operation) {
    this.syncQueue.push({
      operation,
      timestamp: new Date().toISOString()
    });
  }

  // Process queued sync operations
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const { operation } of operations) {
      try {
        switch (operation) {
          case 'collectionsToCloud':
            await this.syncCollectionsToCloud();
            break;
          case 'cloudToExtension':
            await this.syncCloudToExtension();
            break;
        }
      } catch (error) {
        console.error(`Error processing sync operation ${operation}:`, error);
        // Re-queue failed operations
        this.addToSyncQueue(operation);
      }
    }
  }

  // Manual sync trigger
  async syncAll() {
    if (!this.isOnline) {
      throw new Error('Offline - cannot sync');
    }

    try {
      await this.syncCollectionsToCloud();
      await this.syncCloudToExtension();
      return true;
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      queuedOperations: this.syncQueue.length,
      isExtension: this.isExtensionContext()
    };
  }

  // Export extension data for backup
  async exportExtensionData() {
    try {
      const data = await this.getExtensionData();
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting extension data:', error);
      throw error;
    }
  }

  // Import extension data from backup
  async importExtensionData(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.data) {
        throw new Error('Invalid import data format');
      }

      // Merge with existing data
      const currentData = await this.getExtensionData();
      const mergedData = {
        recentScans: [...currentData.recentScans, ...(importData.data.recentScans || [])],
        savedCollections: [...currentData.savedCollections, ...(importData.data.savedCollections || [])]
      };

      // Remove duplicates based on ID
      mergedData.recentScans = this.removeDuplicates(mergedData.recentScans, 'id');
      mergedData.savedCollections = this.removeDuplicates(mergedData.savedCollections, 'id');

      await this.saveExtensionData(mergedData);
      return true;
    } catch (error) {
      console.error('Error importing extension data:', error);
      throw error;
    }
  }

  // Remove duplicates from array
  removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
}

// Create singleton instance
const syncService = new SyncService();

export default syncService;
