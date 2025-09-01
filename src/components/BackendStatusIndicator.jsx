import { useState, useEffect } from 'react';
import { wakeUpBackendManual, isBackendLikelySleeping, healthCheck } from '../services/api';

export default function BackendStatusIndicator() {
  const [status, setStatus] = useState('checking'); // 'awake', 'sleeping', 'waking', 'checking', 'error'
  const [isWaking, setIsWaking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const checkStatus = async () => {
    setStatus('checking');
    try {
      await healthCheck();
      setStatus('awake');
      setLastCheck(new Date());
    } catch (error) {
      console.log('Backend health check failed:', error.message);
      if (isBackendLikelySleeping()) {
        setStatus('sleeping');
      } else {
        setStatus('error');
      }
      setLastCheck(new Date());
    }
  };

  const wakeUp = async () => {
    setIsWaking(true);
    setStatus('waking');
    try {
      await wakeUpBackendManual();
      setStatus('awake');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('error');
      console.error('Manual wake-up failed:', error);
    } finally {
      setIsWaking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();
    
    // Periodic check every 2 minutes
    const interval = setInterval(checkStatus, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'awake': return 'text-green-600 bg-green-50 border-green-200';
      case 'sleeping': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'waking': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'checking': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'awake': return '🟢';
      case 'sleeping': return '🟡';
      case 'waking': return '🔄';
      case 'checking': return '⏳';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'awake': return 'Backend Online';
      case 'sleeping': return 'Backend Sleeping';
      case 'waking': return 'Waking Up...';
      case 'checking': return 'Checking Status...';
      case 'error': return 'Backend Error';
      default: return 'Unknown Status';
    }
  };

  const showWakeUpButton = status === 'sleeping' || status === 'error';

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-xs border ${getStatusColor()}`}>
      <span className="flex items-center space-x-1">
        <span className={status === 'waking' ? 'animate-spin' : ''}>{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
      </span>
      
      {showWakeUpButton && (
        <button
          onClick={wakeUp}
          disabled={isWaking}
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWaking ? 'Waking...' : 'Wake Up'}
        </button>
      )}
      
      {lastCheck && (
        <span className="text-xs opacity-75">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
