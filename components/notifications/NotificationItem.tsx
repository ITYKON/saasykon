import { formatDistanceToNow } from "date-fns";
import { fr } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  id: string;
  type: string;
  payload: any;
  isRead: boolean;
  createdAt: Date;
  onMarkAsRead?: (id: string) => void;
  className?: string;
}

export function NotificationItem({ 
  id, 
  type, 
  payload, 
  isRead, 
  createdAt, 
  onMarkAsRead, 
  className 
}: NotificationItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'claim.approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'claim.rejected':
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'claim.approved':
        return 'Revendication approuvée';
      case 'claim.rejected':
        return 'Revendication rejetée';
      default:
        return 'Notification';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'claim.approved':
        return `Votre demande de revendication pour "${payload?.businessName || 'votre établissement'}" a été approuvée.`;
      case 'claim.rejected':
        return `Votre demande de revendication pour "${payload?.businessName || 'un établissement'}" a été rejetée.`;
      default:
        return payload?.message || 'Nouvelle notification';
    }
  };

  return (
    <div 
      className={cn(
        "relative p-4 border rounded-lg transition-colors",
        isRead 
          ? "bg-white border-gray-200 hover:bg-gray-50" 
          : "bg-blue-50 border-blue-200",
        className
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {getTitle()}
            </h3>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { 
                addSuffix: true,
                locale: fr 
              })}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-700">
            {getMessage()}
          </p>
          {type === 'claim.approved' && (
            <div className="mt-2">
              <a
                href="/pro/dashboard"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Accéder au tableau de bord →
              </a>
            </div>
          )}
        </div>
        {!isRead && onMarkAsRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 -mt-1 -mr-1"
            onClick={() => onMarkAsRead(id)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Marquer comme lue</span>
          </Button>
        )}
      </div>
      {!isRead && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
