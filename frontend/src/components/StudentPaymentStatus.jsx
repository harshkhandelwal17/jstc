import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  BookOpen,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Info,
  Receipt,
  Plus
} from 'lucide-react';
import axiosInstance from '../utils/axios';

const StudentPaymentStatus = ({ studentId, onRefresh, autoRefresh = false }) => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaymentStatus = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      }
      const response = await axiosInstance.get(`/students/${studentId}/payment-status?t=${Date.now()}`);
      setPaymentStatus(response.data.paymentStatus);
      setError(null);
      console.log('Payment status updated:', response.data.paymentStatus);
    } catch (err) {
      console.error('Error fetching payment status:', err);
      
      // Don't set error state for authentication errors as they're handled by interceptor
      const status = err.response?.status;
      const message = err.response?.data?.message || '';
      
      if (status === 401) {
        // Check if it's a genuine auth error
        const tokenErrors = ['Access token required', 'Invalid token', 'Token expired', 'Authentication error'];
        const isAuthError = tokenErrors.some(tokenError => 
          message.toLowerCase().includes(tokenError.toLowerCase())
        );
        
        if (!isAuthError) {
          // This is an API-specific 401, not an auth error
          setError('Payment status not available');
        }
        // If it is an auth error, the interceptor will handle the redirect
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch payment status');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchPaymentStatus();
    }
  }, [studentId]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && studentId) {
      const interval = setInterval(() => {
        fetchPaymentStatus(true);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, studentId]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh(() => fetchPaymentStatus(true));
    }
  }, [onRefresh]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'Due': return 'text-red-600 bg-red-50 border-red-200';
      case 'Partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Back_Pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Not_Due': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'Overdue': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="h-4 w-4" />;
      case 'Due': return <AlertTriangle className="h-4 w-4" />;
      case 'Partial': return <Clock className="h-4 w-4" />;
      case 'Back_Pending': return <AlertCircle className="h-4 w-4" />;
      case 'Overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePayment = (payment) => {
    // Navigate to payment page with pre-filled data
    const paymentData = {
      studentId: paymentStatus.studentInfo.studentId,
      studentName: paymentStatus.studentInfo.name,
      semester: payment.semester,
      amount: payment.amount,
      type: payment.type,
      description: payment.description
    };
    
    localStorage.setItem('pendingPayment', JSON.stringify(paymentData));
    window.location.href = '/fees/add-payment';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payment Status</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchPaymentStatus}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Payment Data</h3>
          <p className="text-gray-500">Payment status information is not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-6 w-6 mr-3 text-blue-600" />
            Payment Status
          </h2>
          <button
            onClick={fetchPaymentStatus}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">Total Course Fee</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(paymentStatus.feeStructure.totalCourseFee)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">Total Paid</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(paymentStatus.feeStructure.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-700">Total Remaining</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(paymentStatus.feeStructure.totalRemaining)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Student:</span>
              <span className="font-medium text-gray-900 ml-2">
                {paymentStatus.studentInfo.name}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Course:</span>
              <span className="font-medium text-gray-900 ml-2">
                {paymentStatus.studentInfo.course}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Current Sem:</span>
              <span className="font-medium text-gray-900 ml-2">
                {paymentStatus.studentInfo.currentSemester}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Sems:</span>
              <span className="font-medium text-gray-900 ml-2">
                {paymentStatus.studentInfo.totalSemesters}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {paymentStatus.pendingPayments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            Pending Payments ({paymentStatus.pendingPayments.length})
          </h3>
          
          {paymentStatus.totalPendingAmount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Total Pending Amount</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(paymentStatus.totalPendingAmount)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {paymentStatus.pendingPayments.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(payment.priority)}`}>
                      {payment.priority} Priority
                    </span>
                    {payment.type === 'Back_Subject_Fee' && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        Back Subject
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900">{payment.description}</h4>
                  <p className="text-sm text-gray-600">
                    Semester {payment.semester} • {formatCurrency(payment.amount)}
                  </p>
                  {payment.subjectCode && (
                    <p className="text-xs text-gray-500">
                      Subject: {payment.subjectCode} - {payment.subjectName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handlePayment(payment)}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semester-wise Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
          Semester-wise Payment Status
        </h3>

        <div className="space-y-4">
          {paymentStatus.semesterWiseStatus.map((semester, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Semester {semester.semester}
                </h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(semester.status)}`}>
                  {getStatusIcon(semester.status)}
                  <span className="ml-1">{semester.status.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Course Fee</p>
                  <p className="font-medium text-gray-900">{formatCurrency(semester.courseFee)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(semester.courseFeePaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Remaining</p>
                  <p className="font-medium text-red-600">{formatCurrency(semester.courseFeeRemaining)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Back Sub Fees</p>
                  <p className="font-medium text-orange-600">{formatCurrency(semester.backSubjectFees)}</p>
                </div>
              </div>

              {/* Subjects */}
              {semester.subjects && semester.subjects.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Subjects:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {semester.subjects.map((subject, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium">{subject.subjectCode}</span>
                        <span className="text-gray-600 ml-1">- {subject.subjectName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back Subjects */}
              {semester.pendingBackSubjects && semester.pendingBackSubjects.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-800 mb-2">
                    Pending Back Subjects ({semester.pendingBackSubjects.length}):
                  </p>
                  <div className="space-y-2">
                    {semester.pendingBackSubjects.map((backSub, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-red-700">{backSub.subjectCode}</span>
                          <span className="text-red-600 ml-2">- {backSub.subjectName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-red-600">{formatCurrency(backSub.feeAmount)}</span>
                          {backSub.feePaid ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-red-600" />
                          )}
                          {backSub.isCleared && (
                            <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">Cleared</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Payment Date */}
              {semester.lastPaymentDate && (
                <div className="text-xs text-gray-500 mt-2">
                  Last payment: {new Date(semester.lastPaymentDate).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {paymentStatus.pendingPayments.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">All Payments Up to Date!</h3>
          <p className="text-green-700">This student has no pending payments at this time.</p>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentStatus;