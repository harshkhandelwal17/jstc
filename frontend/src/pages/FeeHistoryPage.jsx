import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  CreditCard,
  Download,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Mail,
  GraduationCap,
  RefreshCw,
  FileText,
  TrendingUp,
  Target,
  BarChart3,
  Filter,
  Search,
  X
} from 'lucide-react';

const FeeHistoryPage = () => {
  const [student, setStudent] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeeType, setSelectedFeeType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get student ID from URL params (you'll need to implement this based on your routing)
  const studentId = window.location.pathname.split('/').pop();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const feeTypes = ['Course_Fee', 'Installment', 'Back_Subject', 'Late_Fee', 'Other'];

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
      fetchFeeHistory();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      setStudent(data.student);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const fetchFeeHistory = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        search: studentId,
        ...(selectedFeeType && { feeType: selectedFeeType })
      });

      const response = await fetch(`${API_BASE_URL}/fees/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee history');
      }

      const data = await response.json();
      setFeeHistory(data.payments?.filter(p => p.studentId === studentId) || []);
    } catch (error) {
      console.error('Error fetching fee history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
        alert(`Receipt ${receiptNo} ready for printing!\nAmount: ₹${data.receiptData.payment.finalAmount}`);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Error generating receipt');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
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
              <h3 className="text-lg font-semibold text-gray-900">Receipt #{payment.receiptNo}</h3>
              <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
            </div>
          </div>
          <div className="text-right">
            {getPaymentStatusBadge(payment.status)}
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount Paid:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(payment.finalAmount)}
            </span>
          </div>

          {payment.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Original Amount:</span>
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          )}

          {payment.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Discount:</span>
              <span className="text-sm font-medium text-orange-600">
                -{formatCurrency(payment.discount)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fee Type:</span>
            {getFeeTypeBadge(payment.feeType)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Payment Mode:</span>
            <span className="text-sm font-medium text-gray-900">{payment.paymentMode}</span>
          </div>

          {payment.installmentNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Installment:</span>
              <span className="text-sm font-medium text-blue-600">#{payment.installmentNumber}</span>
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

          {payment.transactionDetails?.chequeNo && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cheque No:</span>
              <span className="text-sm font-medium text-gray-900">
                {payment.transactionDetails.chequeNo}
              </span>
            </div>
          )}

          {payment.transactionDetails?.upiId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">UPI ID:</span>
              <span className="text-sm font-medium text-gray-900">
                {payment.transactionDetails.upiId}
              </span>
            </div>
          )}
        </div>

        {/* Back Subjects */}
        {payment.backSubjects && payment.backSubjects.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Back Subjects Payment ({payment.backSubjects.length})
            </h4>
            <div className="space-y-1">
              {payment.backSubjects.map((subject, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-red-700">{subject.name} ({subject.code})</span>
                  <span className="font-medium text-red-600">{formatCurrency(subject.fee)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remarks */}
        {payment.remarks && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-1">Remarks:</h4>
            <p className="text-sm text-gray-600">{payment.remarks}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePrintReceipt(payment.receiptNo)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Printer className="h-3 w-3 mr-1" />
              Print Receipt
            </button>
            
            <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
              <Download className="h-3 w-3 mr-1" />
              Download
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            Created by: {payment.createdBy}
          </div>
        </div>
      </div>
    </div>
  );

  const StudentInfoCard = () => {
    if (!student) return null;

    const totalPaid = feeHistory.reduce((sum, payment) => sum + payment.finalAmount, 0);
    const totalDiscount = feeHistory.reduce((sum, payment) => sum + (payment.discount || 0), 0);
    const paymentCount = feeHistory.length;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 flex items-center">
            <User className="h-6 w-6 mr-2" />
            Student Fee History
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Name:
                  </span>
                  <span className="font-medium text-gray-900">{student.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Student ID:</span>
                  <span className="font-medium text-gray-900">{student.studentId}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone:
                  </span>
                  <span className="font-medium text-gray-900">{student.phone}</span>
                </div>
                
                {student.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email:
                    </span>
                    <span className="font-medium text-gray-900 truncate max-w-48">{student.email}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Course:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {student.academicInfo?.course}
                  </span>
                </div>
              </div>
            </div>

            {/* Fee Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                  <div className="text-sm text-green-700">Total Paid</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{paymentCount}</div>
                  <div className="text-sm text-blue-700">Payments Made</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(student.feeStructure?.remainingAmount || 0)}
                  </div>
                  <div className="text-sm text-purple-700">Remaining</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalDiscount)}</div>
                  <div className="text-sm text-orange-700">Total Discount</div>
                </div>
              </div>

              {/* Fee Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Fee Collection Progress</span>
                  <span>
                    {student.feeStructure?.courseFee > 0 
                      ? Math.round(((student.feeStructure.totalPaid || 0) / student.feeStructure.courseFee) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${student.feeStructure?.courseFee > 0 
                        ? ((student.feeStructure.totalPaid || 0) / student.feeStructure.courseFee) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹{student.feeStructure?.totalPaid || 0}</span>
                  <span>₹{student.feeStructure?.courseFee || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredHistory = feeHistory.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.feeType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFeeType = !selectedFeeType || payment.feeType === selectedFeeType;
    
    return matchesSearch && matchesFeeType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => window.history.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Fee Payment History</h1>
              <p className="mt-2 text-lg text-gray-600">
                Complete payment history for {student?.name || 'Student'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchFeeHistory}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={() => window.location.href = '/fees/add-payment'}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment
              </button>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        <StudentInfoCard />

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
                placeholder="Search by receipt number or fee type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {selectedFeeType && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Fee Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    value={selectedFeeType}
                    onChange={(e) => setSelectedFeeType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {feeTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedFeeType('');
                    }}
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

        {/* Payment History */}
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
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No payment history found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedFeeType 
                ? 'Try adjusting your search criteria or filters' 
                : 'No payments have been made by this student yet'
              }
            </p>
            <button 
              onClick={() => window.location.href = '/fees/add-payment'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Record First Payment
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredHistory.map((payment) => (
                <PaymentCard key={payment._id} payment={payment} />
              ))}
            </div>

            {/* Summary Footer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Payment Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(filteredHistory.reduce((sum, p) => sum + p.finalAmount, 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{filteredHistory.length}</p>
                  <p className="text-sm text-gray-600">Total Payments</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-3">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(filteredHistory.reduce((sum, p) => sum + p.finalAmount, 0) / filteredHistory.length)}
                  </p>
                  <p className="text-sm text-gray-600">Average Payment</p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-3">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(filteredHistory.reduce((sum, p) => sum + (p.discount || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Discount</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => window.location.href = `/students/details/${studentId}`}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-5 w-5 mr-2" />
                    View Student Profile
                  </button>
                  
                  <button 
                    onClick={() => window.location.href = '/fees/add-payment'}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Add New Payment
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeeHistoryPage;