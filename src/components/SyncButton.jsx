import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import syncService from '../services/syncService';
import { useToast } from '../context/ToastContext';

const SyncButton = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSyncTime: null,
    queuedOperations: 0,
    isExtension: false
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(syncService.getSyncStatus());
    };

    // Initial status
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      addToast('Connection restored', 'success');
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      addToast('Connection lost', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  const handleSync = async () => {
    if (!syncStatus.isOnline) {
      addToast('Cannot sync while offline', 'error');
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    
    try {
      await syncService.syncAll();
      setSyncStatus(syncService.getSyncStatus());
      addToast('Sync completed successfully', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      addToast('Sync failed. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <CloudOff size={16} className="text-red-500" />;
    }
    
    if (isSyncing) {
      return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.queuedOperations > 0) {
      return <AlertCircle size={16} className="text-yellow-500" />;
    }
    
    return <CheckCircle size={16} className="text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (syncStatus.queuedOperations > 0) return `${syncStatus.queuedOperations} pending`;
    return 'Synced';
  };

  // Only show if running in extension context or has extension features
  if (!syncStatus.isExtension && !window.chrome?.runtime) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-gray-600">{getStatusText()}</span>
      </div>
      
      <div className="text-xs text-gray-500">
        Last sync: {formatLastSync(syncStatus.lastSyncTime)}
      </div>
      
      <button
        onClick={handleSync}
        disabled={!syncStatus.isOnline || isSyncing}
        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
      >
        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
        Sync
      </button>
    </div>
  );
};

export default SyncButton;
