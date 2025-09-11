import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Search, 
  User, 
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Receipt,
  Clock,
  BookOpen,
  Plus,
  RefreshCw,
  Eye,
  TrendingUp
} from 'lucide-react';
import axiosInstance from '../utils/axios';

const EnhancedAddPaymentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedBackSubjects, setSelectedBackSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    course: '',
    semester: '',
    subjectCode: '',
    amount: '',
    feeType: 'Course_Fee',
    paymentMode: 'Cash',
    transactionDetails: {
      transactionId: '',
      chequeNo: '',
      bankName: '',
      upiId: ''
    },
    discount: 0,
    remarks: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jstcapi.onrender.com/api';

  const getFeeTypes = () => [
    { value: 'Course_Fee', label: 'Semester Fee', description: 'Regular semester fees', color: 'blue' },
    { value: 'Back_Subject', label: 'Back Subject Fee', description: `Failed subject re-exam fee (₹${getBackSubjectFee()})`, color: 'red' },
    { value: 'Late_Fee', label: 'Late Fee', description: 'Late payment penalty', color: 'orange' },
    { value: 'Other', label: 'Other Fee', description: 'Miscellaneous fees', color: 'gray' }
  ];

  const paymentModes = [
    { value: 'Cash', label: 'Cash', icon: '💵' },
    { value: 'Online', label: 'Online Transfer', icon: '💳' },
    { value: 'UPI', label: 'UPI', icon: '📱' },
    { value: 'Card', label: 'Card', icon: '💳' },
    { value: 'Cheque', label: 'Cheque', icon: '📋' },
    { value: 'NEFT', label: 'NEFT', icon: '🏦' },
    { value: 'RTGS', label: 'RTGS', icon: '🏦' }
  ];

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Check for pre-filled data from localStorage
  useEffect(() => {
    const pendingPayment = localStorage.getItem('pendingPayment');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        setFormData(prev => ({
          ...prev,
          studentId: paymentData.studentId || '',
          studentName: paymentData.studentName || '',
          amount: paymentData.amount || '',
          semester: paymentData.semester || '',
          feeType: paymentData.type === 'Back_Subject_Fee' ? 'Back_Subject' : 'Course_Fee',
          remarks: paymentData.description || ''
        }));
        
        if (paymentData.studentId) {
          fetchStudentPaymentStatus(paymentData.studentId);
        }
        
        localStorage.removeItem('pendingPayment');
      } catch (error) {
        console.error('Error parsing pending payment data:', error);
      }
    }
  }, []);

  const searchStudents = async (term) => {
    if (!term.trim()) {
      setStudents([]);
      return;
    }

    try {
      setSearching(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/students?search=${term}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearching(false);
    }
  };

  const fetchStudentPaymentStatus = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/payment-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data.paymentStatus);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentId: student.studentId,
      studentName: student.name,
      course: student.academicInfo?.course || ''
    }));
    setStudents([]);
    setSearchTerm(`${student.name} (${student.studentId})`);
    setSelectedBackSubjects([]);
    fetchStudentPaymentStatus(student.studentId);
  };

  // Get back subject fee from course data
  const getBackSubjectFee = () => {
    if (selectedStudent && courses.length > 0) {
      const studentCourse = courses.find(c => c.name === selectedStudent.academicInfo?.course);
      return studentCourse?.backSubjectFee || 500; // Default to 500 if not found
    }
    return 500;
  };

  // Handle back subject selection (multiple)
  const toggleBackSubjectSelection = (subjectCode, subjectName, semester) => {
    const backSubjectFee = getBackSubjectFee();
    const subjectId = `${semester}_${subjectCode}`;
    
    setSelectedBackSubjects(prev => {
      const existing = prev.find(s => s.id === subjectId);
      let newSelection;
      
      if (existing) {
        // Remove if already selected
        newSelection = prev.filter(s => s.id !== subjectId);
      } else {
        // Add to selection
        newSelection = [...prev, {
          id: subjectId,
          subjectCode,
          subjectName,
          semester,
          fee: backSubjectFee
        }];
      }
      
      // Update total amount
      const totalAmount = newSelection.reduce((sum, subject) => sum + subject.fee, 0);
      setFormData(prev => ({
        ...prev,
        amount: totalAmount.toString()
      }));
      
      return newSelection;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Handle fee type change
    if (name === 'feeType') {
      if (value === 'Back_Subject') {
        // Reset amount and back subject selections when switching to back subject fee
        setSelectedBackSubjects([]);
        setFormData(prev => ({
          ...prev,
          amount: '',
          subjectCode: ''
        }));
      } else {
        // Clear back subject selections for other fee types
        setSelectedBackSubjects([]);
      }
    }

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) newErrors.studentId = 'Student selection is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.feeType) newErrors.feeType = 'Fee type is required';
    if (!formData.semester && (formData.feeType === 'Course_Fee' || formData.feeType === 'Back_Subject')) {
      newErrors.semester = 'Semester is required';
    }
    if (formData.feeType === 'Back_Subject' && selectedBackSubjects.length === 0) {
      newErrors.subjectCode = 'At least one back subject must be selected';
    }

    // Payment mode specific validations
    if (formData.paymentMode === 'Cheque' && !formData.transactionDetails.chequeNo) {
      newErrors['transactionDetails.chequeNo'] = 'Cheque number is required';
    }
    
    if (formData.paymentMode === 'UPI' && !formData.transactionDetails.upiId) {
      newErrors['transactionDetails.upiId'] = 'UPI ID is required';
    }
    
    if (['Online', 'NEFT', 'RTGS'].includes(formData.paymentMode) && !formData.transactionDetails.transactionId) {
      newErrors['transactionDetails.transactionId'] = 'Transaction ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let endpoint, payload;

      if (formData.feeType === 'Course_Fee') {
        // Use semester fee payment endpoint
        endpoint = `${API_BASE_URL}/students/${formData.studentId}/pay-semester-fee`;
        payload = {
          semester: parseInt(formData.semester),
          amount: parseFloat(formData.amount),
          paymentMode: formData.paymentMode,
          transactionDetails: formData.transactionDetails,
          remarks: formData.remarks
        };
      } else if (formData.feeType === 'Back_Subject') {
        // Handle multiple back subject payments
        const responses = [];
        const errors = [];
        
        for (const subject of selectedBackSubjects) {
          try {
            const backSubjectEndpoint = `${API_BASE_URL}/students/${formData.studentId}/back-subjects/pay-fee`;
            const backSubjectPayload = {
              semester: parseInt(subject.semester),
              subjectCode: subject.subjectCode,
              paymentAmount: subject.fee,
              paymentMethod: formData.paymentMode,
              remarks: `${formData.remarks} - ${subject.subjectCode} (${subject.subjectName})`
            };

            const subjectResponse = await fetch(backSubjectEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(backSubjectPayload)
            });

            if (subjectResponse.ok) {
              const subjectData = await subjectResponse.json();
              responses.push({
                subject: `${subject.subjectCode} - ${subject.subjectName}`,
                success: true,
                data: subjectData
              });
            } else {
              const errorData = await subjectResponse.json();
              errors.push({
                subject: `${subject.subjectCode} - ${subject.subjectName}`,
                error: errorData.message || 'Payment failed'
              });
            }
          } catch (error) {
            errors.push({
              subject: `${subject.subjectCode} - ${subject.subjectName}`,
              error: error.message
            });
          }
        }
        
        // Show results
        if (responses.length > 0) {
          let successMessage = `✅ Successfully processed ${responses.length} back subject fee(s):\n`;
          responses.forEach((resp, index) => {
            successMessage += `${index + 1}. ${resp.subject}\n`;
            if (resp.data.receiptNo) {
              successMessage += `   Receipt: ${resp.data.receiptNo}\n`;
            }
          });
          
          if (errors.length > 0) {
            successMessage += `\n❌ Failed payments:\n`;
            errors.forEach((err, index) => {
              successMessage += `${index + 1}. ${err.subject}: ${err.error}\n`;
            });
          }
          
          alert(successMessage);
        } else {
          throw new Error('All back subject payments failed');
        }
        
        // Reset form and navigate
        setFormData({
          studentId: '',
          studentName: '',
          course: '',
          semester: '',
          subjectCode: '',
          amount: '',
          feeType: 'Course_Fee',
          paymentMode: 'Cash',
          transactionDetails: { transactionId: '', chequeNo: '', bankName: '', upiId: '' },
          discount: 0,
          remarks: '',
          paymentDate: new Date().toISOString().split('T')[0]
        });
        setSelectedStudent(null);
        setSelectedBackSubjects([]);
        setSearchTerm('');
        setLoading(false);
        return; // Exit early for back subject handling
      } else {
        // Use general payment endpoint
        endpoint = `${API_BASE_URL}/fees/payment`;
        payload = {
          studentId: formData.studentId,
          amount: parseFloat(formData.amount),
          feeType: formData.feeType,
          paymentMode: formData.paymentMode,
          transactionDetails: formData.transactionDetails,
          discount: parseFloat(formData.discount) || 0,
          remarks: formData.remarks
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\nReceipt: ${data.receiptNo || data.payment?.receiptNo}`);
        
        // Refresh payment status
        if (formData.studentId) {
          fetchStudentPaymentStatus(formData.studentId);
        }
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          amount: '',
          semester: '',
          remarks: '',
          transactionDetails: {
            transactionId: '',
            chequeNo: '',
            bankName: '',
            upiId: ''
          }
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`❌ Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getPaymentModeFields = () => {
    switch (formData.paymentMode) {
      case 'Cheque':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Number *
              </label>
              <input
                type="text"
                name="transactionDetails.chequeNo"
                value={formData.transactionDetails.chequeNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter cheque number"
              />
              {errors['transactionDetails.chequeNo'] && 
                <p className="mt-1 text-sm text-red-600">{errors['transactionDetails.chequeNo']}</p>
              }
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                name="transactionDetails.bankName"
                value={formData.transactionDetails.bankName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank name"
              />
            </div>
          </div>
        );
      
      case 'UPI':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UPI Transaction ID *
            </label>
            <input
              type="text"
              name="transactionDetails.upiId"
              value={formData.transactionDetails.upiId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter UPI transaction ID"
            />
            {errors['transactionDetails.upiId'] && 
              <p className="mt-1 text-sm text-red-600">{errors['transactionDetails.upiId']}</p>
            }
          </div>
        );
      
      case 'Online':
      case 'NEFT':
      case 'RTGS':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID *
            </label>
            <input
              type="text"
              name="transactionDetails.transactionId"
              value={formData.transactionDetails.transactionId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter transaction ID"
            />
            {errors['transactionDetails.transactionId'] && 
              <p className="mt-1 text-sm text-red-600">{errors['transactionDetails.transactionId']}</p>
            }
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/fees')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Collect Fee Payment</h1>
              <p className="mt-2 text-lg text-gray-600">Process student fee payments</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <CreditCard className="h-6 w-6 mr-3 text-green-600" />
                Payment Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Student *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className={`h-5 w-5 ${searching ? 'animate-spin' : ''} text-gray-400`} />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchStudents(e.target.value);
                      }}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search by name or student ID..."
                    />
                  </div>
                  
                  {students.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {students.map((student) => (
                        <button
                          key={student._id}
                          type="button"
                          onClick={() => selectStudent(student)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden mr-3">
                            {student.profileImage ? (
                              <img 
                                src={student.profileImage} 
                                alt={student.name}
                                className="w-10 h-10 object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ${student.profileImage ? 'hidden' : ''}`}>
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.studentId} • {student.academicInfo?.course}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
                </div>

                {/* Fee Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getFeeTypes().map((type) => (
                      <label
                        key={type.value}
                        className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                          formData.feeType === type.value
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="feeType"
                          value={type.value}
                          checked={formData.feeType === type.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="font-medium text-gray-900">{type.label}</div>
                          </div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                        {formData.feeType === type.value && (
                          <CheckCircle className={`h-5 w-5 text-${type.color}-600`} />
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.feeType && <p className="mt-1 text-sm text-red-600">{errors.feeType}</p>}
                </div>

                {/* Semester Selection for Course Fee and Back Subject Fee */}
                {(formData.feeType === 'Course_Fee' || formData.feeType === 'Back_Subject') && selectedStudent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Semester</option>
                      {Array.from({ length: selectedStudent.academicInfo?.totalSemesters || 2 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                      ))}
                    </select>
                    {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
                  </div>
                )}

                {/* Multiple Back Subject Selection */}
                {formData.feeType === 'Back_Subject' && selectedStudent && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Back Subjects * 
                      </label>
                      <div className="text-sm text-gray-600">
                        Fee per subject: <span className="font-semibold text-red-600">₹{getBackSubjectFee()}</span>
                      </div>
                    </div>
                    
                    {paymentStatus?.pendingPayments?.filter(p => p.type === 'Back_Subject_Fee')?.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {paymentStatus.pendingPayments
                          .filter(p => p.type === 'Back_Subject_Fee')
                          .map((payment, index) => {
                            const subjectId = `${payment.semester}_${payment.subjectCode}`;
                            const isSelected = selectedBackSubjects.some(s => s.id === subjectId);
                            
                            return (
                              <div 
                                key={`${payment.subjectCode}_${payment.semester}`}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'bg-red-50 border-2 border-red-200 shadow-sm' 
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => toggleBackSubjectSelection(
                                  payment.subjectCode, 
                                  payment.subjectName, 
                                  payment.semester
                                )}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                      isSelected 
                                        ? 'bg-red-500 border-red-500' 
                                        : 'border-gray-300'
                                    }`}>
                                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {payment.subjectCode} - {payment.subjectName}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Semester {payment.semester}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-red-600">
                                    ₹{getBackSubjectFee()}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No pending back subjects found</p>
                      </div>
                    )}
                    
                    {/* Selected Subjects Summary */}
                    {selectedBackSubjects.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-900">
                            Selected Subjects ({selectedBackSubjects.length})
                          </h4>
                          <div className="font-bold text-blue-900">
                            Total: ₹{selectedBackSubjects.reduce((sum, s) => sum + s.fee, 0)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {selectedBackSubjects.map((subject) => (
                            <div key={subject.id} className="flex items-center justify-between text-sm">
                              <span className="text-blue-800">
                                {subject.subjectCode} - {subject.subjectName} (Sem {subject.semester})
                              </span>
                              <span className="font-medium text-blue-800">₹{subject.fee}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {errors.subjectCode && <p className="mt-1 text-sm text-red-600">{errors.subjectCode}</p>}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                    {formData.feeType === 'Back_Subject' && (
                      <span className="text-sm font-normal text-red-600 ml-2">
                        (Auto-calculated from selected subjects)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      readOnly={formData.feeType === 'Back_Subject'}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        formData.feeType === 'Back_Subject'
                          ? 'border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder={formData.feeType === 'Back_Subject' ? 'Auto-calculated' : 'Enter amount'}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                  {formData.feeType === 'Back_Subject' && selectedBackSubjects.length > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ Amount automatically calculated: ₹{formData.amount}
                    </p>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {paymentModes.map((mode) => (
                      <label
                        key={mode.value}
                        className={`relative flex cursor-pointer rounded-lg border p-3 focus:outline-none ${
                          formData.paymentMode === mode.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value={mode.value}
                          checked={formData.paymentMode === mode.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex-1 text-center">
                          <div className="text-2xl mb-1">{mode.icon}</div>
                          <div className="text-sm font-medium text-gray-900">{mode.label}</div>
                        </div>
                        {formData.paymentMode === mode.value && (
                          <CheckCircle className="h-5 w-5 text-blue-600 absolute top-2 right-2" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment Mode Specific Fields */}
                {getPaymentModeFields()}

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter any additional notes..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/fees')}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.studentId}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4 mr-2" />
                        Collect Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Payment Status Sidebar */}
          <div className="space-y-6">
            {/* Selected Student Info */}
            {selectedStudent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Selected Student
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-medium text-gray-900">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course</p>
                    <p className="font-medium text-gray-900">{selectedStudent.academicInfo?.course}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Semester</p>
                    <p className="font-medium text-gray-900">{selectedStudent.academicInfo?.currentSemester}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/students/details/${selectedStudent.studentId}`)}
                  className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
              </div>
            )}

            {/* Payment Status */}
            {paymentStatus && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Payment Status
                  </h3>
                  <button
                    onClick={() => fetchStudentPaymentStatus(formData.studentId)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-xs text-blue-700">Total Course Fee</div>
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(paymentStatus.feeStructure.totalCourseFee)}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-xs text-green-700">Total Paid</div>
                      <div className="text-lg font-bold text-green-900">
                        {formatCurrency(paymentStatus.feeStructure.totalPaid)}
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-xs text-red-700">Total Remaining</div>
                      <div className="text-lg font-bold text-red-900">
                        {formatCurrency(paymentStatus.feeStructure.totalRemaining)}
                      </div>
                    </div>
                  </div>

                  {/* Pending Payments */}
                  {paymentStatus.pendingPayments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                        Pending Payments
                      </h4>
                      <div className="space-y-2">
                        {paymentStatus.pendingPayments.slice(0, 3).map((payment, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              payment.priority === 'High' 
                                ? 'border-red-200 bg-red-50 hover:bg-red-100'
                                : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                            }`}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                amount: payment.amount,
                                semester: payment.semester,
                                feeType: payment.type === 'Back_Subject_Fee' ? 'Back_Subject' : 'Course_Fee',
                                remarks: payment.description
                              }));
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {payment.description}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Semester {payment.semester} • {payment.priority} Priority
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {paymentStatus.pendingPayments.length > 3 && (
                        <p className="text-xs text-gray-600 mt-2">
                          +{paymentStatus.pendingPayments.length - 3} more pending payments
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/students')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  View All Students
                </button>
                <button
                  onClick={() => navigate('/fees')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Payment History
                </button>
                <button
                  onClick={() => navigate('/results')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Results Management
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAddPaymentPage;