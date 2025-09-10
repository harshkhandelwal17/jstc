import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  XCircle,
  TrendingUp
} from 'lucide-react';

const StatusBadge = ({ status, size = 'sm', showIcon = true }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'Fee_Pending': {
        label: 'Fee Pending',
        color: 'red',
        icon: Clock,
        bgClass: 'bg-red-100 text-red-800 border-red-200',
        description: 'Payment required before exam'
      },
      'Fee_Paid': {
        label: 'Fee Paid',
        color: 'yellow',
        icon: DollarSign,
        bgClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Ready for exam'
      },
      'Exam_Pending': {
        label: 'Exam Pending',
        color: 'blue',
        icon: AlertTriangle,
        bgClass: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Exam scheduled'
      },
      'Cleared': {
        label: 'Cleared',
        color: 'green',
        icon: CheckCircle,
        bgClass: 'bg-green-100 text-green-800 border-green-200',
        description: 'Subject completed successfully'
      },
      'Paid': {
        label: 'Paid',
        color: 'green',
        icon: CheckCircle,
        bgClass: 'bg-green-100 text-green-800 border-green-200',
        description: 'Payment completed'
      },
      'Pending': {
        label: 'Pending',
        color: 'yellow',
        icon: Clock,
        bgClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Awaiting action'
      },
      'Overdue': {
        label: 'Overdue',
        color: 'red',
        icon: XCircle,
        bgClass: 'bg-red-100 text-red-800 border-red-200',
        description: 'Payment overdue'
      },
      'Partial': {
        label: 'Partial',
        color: 'orange',
        icon: TrendingUp,
        bgClass: 'bg-orange-100 text-orange-800 border-orange-200',
        description: 'Partial payment made'
      }
    };
    
    return configs[status] || configs['Pending'];
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium border ${config.bgClass} ${sizeClasses[size]}`}
      title={config.description}
    >
      {showIcon && <IconComponent className={`h-3 w-3 mr-1 ${size === 'lg' ? 'h-4 w-4' : ''}`} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;


