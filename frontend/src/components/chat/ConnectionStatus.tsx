import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocketContext } from '@/contexts/SocketContext';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Visual indicator for Socket.IO connection status
 */
export function ConnectionStatus({ className, showLabel = true }: ConnectionStatusProps) {
  const { isConnected, connectionError } = useSocketContext();

  if (connectionError) {
    return (
      <div className={cn('flex items-center gap-2 text-destructive', className)}>
        <WifiOff className="h-4 w-4" />
        {showLabel && <span className="text-xs">Connection Error</span>}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {showLabel && <span className="text-xs">Connecting...</span>}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-green-500', className)}>
      <Wifi className="h-4 w-4" />
      {showLabel && <span className="text-xs">Connected</span>}
    </div>
  );
}

export default ConnectionStatus;
