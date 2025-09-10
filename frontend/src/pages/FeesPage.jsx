import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Eye,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Printer,
  Trash2
} from 'lucide-react';

const FeesPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFeeType, setSelectedFeeType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jstc.vercel.app/api';
  const courses = ['PGDCA', 'DCA'];
  const feeTypes = ['Course_Fee', 'Installment', 'Back_Subject', 'Late_Fee', 'Other'];

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(currentPage === 1);
      setRefreshing(currentPage !== 1);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCourse && { course: selectedCourse }),
        ...(selectedFeeType && { feeType: selectedFeeType }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      });

      const response = await fetch(`${API_BASE_URL}/fees/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, selectedCourse, selectedFeeType, dateRange, API_BASE_URL]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats?.collection || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [fetchPayments, fetchStats]);

  const handlePrintReceipt = async (receiptNo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/fees/receipt/${receiptNo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // For now, just show an alert. In a real app, you'd generate and print a receipt
        alert(`Receipt ${receiptNo} ready for printing!\nAmount: ₹${data.receiptData.payment.finalAmount}`);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Error generating receipt');
    }
  };

  const handleDeletePayment = async (paymentId, receiptNo) => {
    if (!window.confirm(`Are you sure you want to delete payment ${receiptNo}? This action cannot be undone and will reverse the fee structure changes.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/fees/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment');
      }

      // Show success message
      alert('Payment deleted successfully and fee structure updated');
      
      // Refresh the list
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(`Error deleting payment: ${error.message}`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedFeeType('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const getPaymentStatusBadge = (status) => {
    const statusColors = {
      'Paid': 'bg-green-100 text-green-800 border-green-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Failed': 'bg-red-100 text-red-800 border-red-200',
      'Refunded': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {status === 'Paid' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'Failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
        {status}
      </span>
    );
  };

  const getFeeTypeBadge = (feeType) => {
    const typeColors = {
      'Course_Fee': 'bg-blue-100 text-blue-800',
      'Installment': 'bg-purple-100 text-purple-800',
      'Back_Subject': 'bg-red-100 text-red-800',
      'Late_Fee': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };

    const colorClass = typeColors[feeType] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {feeType.replace('_', ' ')}
      </span>
    );
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center">
              {changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 p-3 rounded-xl ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  const PaymentCard = ({ payment }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{payment.studentName}</h3>
              <p className="text-sm text-gray-500">Receipt: {payment.receiptNo}</p>
            </div>
          </div>
          <div className="text-right">
            {getPaymentStatusBadge(payment.status)}
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Amount:
            </span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(payment.finalAmount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fee Type:</span>
            {getFeeTypeBadge(payment.feeType)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Student ID:
            </span>
            <span className="text-sm font-medium text-gray-900">{payment.studentId}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Course:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {payment.course}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date:
            </span>
            <span className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Payment Mode:</span>
            <span className="text-sm font-medium text-gray-900">{payment.paymentMode}</span>
          </div>

          {payment.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Discount:</span>
              <span className="text-sm font-medium text-orange-600">
                -{formatCurrency(payment.discount)}
              </span>
            </div>
          )}

          {payment.transactionDetails?.transactionId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Transaction ID:</span>
              <span className="text-sm font-mono text-gray-900 truncate max-w-32">
                {payment.transactionDetails.transactionId}
              </span>
            </div>
          )}
        </div>

        {/* Back Subjects */}
        {payment.backSubjects && payment.backSubjects.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Back Subjects ({payment.backSubjects.length})
            </h4>
            <div className="space-y-1">
              {payment.backSubjects.map((subject, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-red-700">{subject.name}</span>
                  <span className="font-medium text-red-600">{formatCurrency(subject.fee)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.href = `/students/details/${payment.studentId}`}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Student
            </button>
            
            <button
              onClick={() => handlePrintReceipt(payment.receiptNo)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Printer className="h-3 w-3 mr-1" />
              Print Receipt
            </button>
          </div>
          
          <button
            onClick={() => handleDeletePayment(payment._id, payment.receiptNo)}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Fees Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Track and manage fee payments ({total} total payments)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchPayments}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={() => {
                  alert('Export feature coming soon!');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button 
                onClick={() => window.location.href = '/fees/add-payment'}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Collect Fee
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Collection"
            value={formatCurrency(stats.total || 0)}
            change="This month"
            changeType="increase"
            icon={DollarSign}
            color="bg-green-500"
          />
          
          <StatCard
            title="Today's Collection"
            value={formatCurrency(stats.todaysCollection || 0)}
            change="+12% from yesterday"
            changeType="increase"
            icon={TrendingUp}
            color="bg-blue-500"
          />
          
          <StatCard
            title="Course Fees"
            value={formatCurrency(stats.byFeeType?.Course_Fee?.amount || 0)}
            change={`${stats.byFeeType?.Course_Fee?.count || 0} payments`}
            changeType="increase"
            icon={FileText}
            color="bg-purple-500"
          />
          
          <StatCard
            title="Back Subject Fees"
            value={formatCurrency(stats.byFeeType?.Back_Subject?.amount || 0)}
            change={`${stats.byFeeType?.Back_Subject?.count || 0} payments`}
            changeType="increase"
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search by student name, ID, or receipt..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(selectedCourse || selectedFeeType || dateRange.start || dateRange.end) && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                  {[selectedCourse, selectedFeeType, dateRange.start, dateRange.end].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {/* Fee Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    value={selectedFeeType}
                    onChange={(e) => {
                      setSelectedFeeType(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Types</option>
                    {feeTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <CreditCard className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCourse || selectedFeeType || dateRange.start || dateRange.end 
                ? 'Try adjusting your search criteria or filters' 
                : 'Get started by collecting your first payment'
              }
            </p>
            <button 
              onClick={() => window.location.href = '/fees/add-payment'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Collect First Payment
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {payments.map((payment) => (
                <PaymentCard key={payment._id} payment={payment} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 10, total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{total}</span>
                        {' '}payments
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center p-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center p-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Fee Collection Summary */}
        {payments.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Collection Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.finalAmount, 0))}
                </p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-3">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                <p className="text-sm text-gray-600">Total Payments</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.finalAmount, 0) / payments.length)}
                </p>
                <p className="text-sm text-gray-600">Average Payment</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.feeType === 'Back_Subject').length}
                </p>
                <p className="text-sm text-gray-600">Back Subject Payments</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Payment Methods Breakdown</h4>
                  <p className="text-xs text-gray-500">
                    Distribution of payment modes used
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Cash', 'Online', 'UPI', 'Card'].map(method => {
                  const count = payments.filter(p => p.paymentMode === method).length;
                  const percentage = payments.length > 0 ? (count / payments.length * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={method} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-600">{method} ({percentage}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/fees/add-payment'}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Collect New Payment
                </button>
                
                <button 
                  onClick={() => window.location.href = '/reports'}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View Detailed Reports
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeesPage;