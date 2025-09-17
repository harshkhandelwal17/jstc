import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  CreditCard,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  FileText,
  Eye,
  Download,
  Printer,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import StudentPaymentStatus from '../components/StudentPaymentStatus';
import BackSubjectManager from '../components/BackSubjectManager';
import axiosInstance from '../utils/axios';

const StudentDetailsPage = () => {
  const [student, setStudent] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [feeDetails, setFeeDetails] = useState(null);
  const [results, setResults] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Get student ID from URL params
  const studentId = window.location.pathname.split('/').pop();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'academic', name: 'Academic', icon: GraduationCap },
    { id: 'fees', name: 'Payment Status', icon: DollarSign },
    { id: 'back-subjects', name: 'Back Subjects', icon: BookOpen },
    { id: 'results', name: 'Results', icon: Award },
    { id: 'documents', name: 'Documents', icon: FileText }
  ];

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  // Refresh results when switching to results tab
  useEffect(() => {
    if (activeTab === 'results' && studentId && results.length > 0) {
      fetchLatestResults(results);
    }
  }, [activeTab, studentId]);

  // Toggle result delivery status
  const toggleResultDelivery = async (semester, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'mark as delivered to student' : 'mark as not delivered';
    
    if (!window.confirm(`Are you sure you want to ${action} the result for Semester ${semester}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/results/${studentId}/${semester}/mark-delivered`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          isDelivered: newStatus,
          deliveryDate: newStatus ? new Date().toISOString() : null,
          deliveredBy: newStatus ? 'current_user' : null,
          remarks: newStatus ? 'Delivered to student' : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Result ${newStatus ? 'marked as delivered to student' : 'marked as not delivered'} successfully!`);
        // Refresh results to show updated status
        fetchLatestResults(results);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update result delivery status');
      }
    } catch (error) {
      console.error('Error toggling result delivery:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Debug function to check sync status
  const checkSyncStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/debug/back-subject-sync/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sync Status:', data.syncReport);
        alert(`Sync Status Check Complete!\n\nStudent Collection: ${data.syncReport.student.backSubject ? 'Has Data' : 'No Data'}\nResult Collection: ${data.syncReport.result.backSubject ? 'Has Data' : 'No Data'}\n\nCheck console for detailed report.`);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      setStudent(data.student);
      setFeeHistory(data.feeHistory || []);
      setResults(data.results || []);
      
      // Fetch fee details and payment status for cross-referencing
      await fetchFeeDetails();
      await fetchPaymentStatus();
      
      // Fetch latest results from Result collection to ensure back subjects are up-to-date
      await fetchLatestResults(data.results || []);
    } catch (error) {
      console.error('Error fetching student details:', error);
      alert('Error fetching student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/students/${studentId}/fee-details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeeDetails(data.feeDetails);
      }
    } catch (error) {
      console.error('Error fetching fee details:', error);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return; // Don't throw error, just skip
      }

      const response = await fetch(`${API_BASE_URL}/students/${studentId}/payment-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data.paymentStatus);
      } else if (response.status === 401) {
        // Check if it's a genuine auth error
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || '';
        
        const tokenErrors = ['Access token required', 'Invalid token', 'Token expired', 'Authentication error'];
        const isAuthError = tokenErrors.some(tokenError => 
          errorMessage.toLowerCase().includes(tokenError.toLowerCase())
        );
        
        console.warn('STUDENT DETAILS PAGE: 401 error but not redirecting (temporarily disabled)');
        console.warn('Payment status API returned 401:', errorMessage);
        
        // if (isAuthError) {
        //   localStorage.removeItem('token');
        //   window.location.href = '/login';
        // } else {
        //   console.warn('Payment status API returned 401 but not an auth error:', errorMessage);
        // }
      } else {
        console.warn(`Payment status API error ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const fetchLatestResults = async (currentResults = []) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      // Fetch latest results from Result collection
      const response = await fetch(`${API_BASE_URL}/results?studentId=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Merge with existing results, prioritizing Result collection data
        const latestResults = data.results || [];
        const mergedResults = currentResults.map(studentResult => {
          const latestResult = latestResults.find(lr => lr.semester === studentResult.semester);
          if (latestResult && latestResult.backSubjects) {
            // Update back subjects with latest data from Result collection
            const updatedBackSubjects = studentResult.backSubjects?.map(bs => {
              const latestBackSubject = latestResult.backSubjects.find(lbs => lbs.code === bs.code);
              if (latestBackSubject) {
                return {
                  ...bs,
                  isCleared: latestBackSubject.isCleared || bs.isCleared,
                  feePaid: latestBackSubject.feePaid || bs.feePaid,
                  status: latestBackSubject.status || bs.status,
                  clearedDate: latestBackSubject.clearedDate || bs.clearedDate,
                  marks: latestBackSubject.marks || bs.marks,
                  examDate: latestBackSubject.examDate || bs.examDate
                };
              }
              return bs;
            }) || latestResult.backSubjects;
            
            return {
              ...studentResult,
              backSubjects: updatedBackSubjects
            };
          }
          return studentResult;
        });
        setResults(mergedResults);
      }
    } catch (error) {
      console.error('Error fetching latest results:', error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!window.confirm(`Are you sure you want to delete ${student?.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      alert('Student deleted successfully');
      window.location.href = '/students';
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student');
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

  const getStatusBadge = (status) => {
    const statusColors = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Inactive': 'bg-gray-100 text-gray-800 border-gray-200',
      'Completed': 'bg-blue-100 text-blue-800 border-blue-200',
      'Dropped': 'bg-red-100 text-red-800 border-red-200',
      'Suspended': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
        {status === 'Active' && <CheckCircle className="h-4 w-4 mr-1" />}
        {status === 'Inactive' && <Clock className="h-4 w-4 mr-1" />}
        {status}
      </span>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">{student?.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Student ID</label>
                <p className="text-lg font-semibold text-gray-900">{student?.studentId}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number
                </label>
                <p className="text-lg text-gray-900">{student?.phone}</p>
              </div>
              
              {student?.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <p className="text-lg text-gray-900">{student.email}</p>
                </div>
              )}
              
              {student?.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date of Birth
                  </label>
                  <p className="text-lg text-gray-900">{formatDate(student.dateOfBirth)}</p>
                </div>
              )}
              
              {student?.gender && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-lg text-gray-900">{student.gender}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Address
                </label>
                <div className="text-lg text-gray-900">
                  {student?.address?.street && <p>{student.address.street}</p>}
                  <p>
                    {[student?.address?.city, student?.address?.state].filter(Boolean).join(', ')}
                  </p>
                  {student?.address?.pincode && <p>{student.address.pincode}</p>}
                  {student?.address?.country && <p>{student.address.country}</p>}
                </div>
              </div>
              
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  {getStatusBadge(student?.status)}
                </div>
              </div>
              
              {/* Joining Date */}
              <div>
                <label className="text-sm font-medium text-gray-500">Joining Date</label>
                <p className="text-lg text-gray-900">{formatDate(student?.academicInfo?.joiningDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      {(student?.parentInfo?.fatherName || student?.parentInfo?.motherName || student?.parentInfo?.guardianName) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Parent/Guardian Information
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.parentInfo.fatherName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Father's Name</label>
                  <p className="text-lg text-gray-900">{student.parentInfo.fatherName}</p>
                  {student.parentInfo.fatherPhone && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {student.parentInfo.fatherPhone}
                    </p>
                  )}
                </div>
              )}
              
              {student.parentInfo.motherName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Mother's Name</label>
                  <p className="text-lg text-gray-900">{student.parentInfo.motherName}</p>
                  {student.parentInfo.motherPhone && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {student.parentInfo.motherPhone}
                    </p>
                  )}
                </div>
              )}
              
              {student.parentInfo.guardianName && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Guardian's Name</label>
                  <p className="text-lg text-gray-900">{student.parentInfo.guardianName}</p>
                  {student.parentInfo.guardianPhone && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {student.parentInfo.guardianPhone}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(student?.feeStructure?.totalPaid || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(student?.feeStructure?.remainingAmount || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Back Subjects</p>
              <p className="text-2xl font-bold text-orange-600">
                {student?.totalBackSubjects || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payments</p>
              <p className="text-2xl font-bold text-blue-600">{feeHistory.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AcademicTab = () => (
    <div className="space-y-8">
      {/* Academic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Academic Information
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Course</label>
                <p className="text-lg font-semibold text-gray-900">{student?.academicInfo?.course}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Current Semester</label>
                <p className="text-lg text-gray-900">{student?.academicInfo?.currentSemester}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Total Semesters</label>
                <p className="text-lg text-gray-900">{student?.academicInfo?.totalSemesters}</p>
              </div>
              
              {student?.academicInfo?.batch && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Batch/Session</label>
                  <p className="text-lg text-gray-900">{student.academicInfo.batch}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {student?.academicInfo?.rollNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Roll Number</label>
                  <p className="text-lg text-gray-900">{student.academicInfo.rollNumber}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Joining Date</label>
                <p className="text-lg text-gray-900">{formatDate(student?.academicInfo?.joiningDate)}</p>
              </div>
              
              {student?.academicInfo?.expectedCompletionDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Completion</label>
                  <p className="text-lg text-gray-900">{formatDate(student.academicInfo.expectedCompletionDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Academic Progress
          </h3>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Course Progress</span>
              <span>
                {Math.round(((student?.academicInfo?.currentSemester || 1) / (student?.academicInfo?.totalSemesters || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${((student?.academicInfo?.currentSemester || 1) / (student?.academicInfo?.totalSemesters || 1)) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {student?.academicInfo?.currentSemester || 1}
              </div>
              <div className="text-sm text-blue-700">Current Semester</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.length}</div>
              <div className="text-sm text-green-700">Results Published</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {student?.totalBackSubjects || 0}
              </div>
              <div className="text-sm text-orange-700">Back Subjects</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {results.filter(r => getEffectiveResultStatus(r) === 'Pass').length}
              </div>
              <div className="text-sm text-purple-700">Passed Semesters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const FeesTab = () => (
    <div className="space-y-8">
      {/* Fee Structure */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-green-50 border-b border-green-200">
          <h3 className="text-lg font-semibold text-green-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Fee Structure
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Overall Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(feeDetails?.totalCourseFee || student?.feeStructure?.totalCourseFee || student?.feeStructure?.courseFee || 0)}
              </div>
              <div className="text-sm text-blue-700">Total Course Fee</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(feeDetails?.totalPaid || student?.feeStructure?.totalPaid || 0)}
              </div>
              <div className="text-sm text-green-700">Total Paid</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(feeDetails?.totalRemaining || student?.feeStructure?.remainingAmount || 0)}
              </div>
              <div className="text-sm text-red-700">Total Pending</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(feeDetails?.semesterBreakdown?.reduce((sum, sem) => sum + sem.backSubjectFees, 0) || student?.feeStructure?.backSubjectFees || 0)}
              </div>
              <div className="text-sm text-orange-700">Back Subject Fees</div>
            </div>
          </div>

          {/* Semester-wise Breakdown */}
          {(feeDetails?.semesterBreakdown || student?.feeStructure?.semesterFees) && (feeDetails?.semesterBreakdown?.length > 0 || student?.feeStructure?.semesterFees?.length > 0) ? (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Semester-wise Fee Details
              </h4>
              <div className="space-y-3">
                {(feeDetails?.semesterBreakdown || student?.feeStructure?.semesterFees || []).map((semesterFee, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3">
                          {semesterFee.semester}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Semester {semesterFee.semester}</h5>
                          <p className="text-sm text-gray-500">
                            Status: <span className={`font-medium ${
                              semesterFee.status === 'Paid' ? 'text-green-600' :
                              semesterFee.status === 'Partial' ? 'text-yellow-600' :
                              semesterFee.status === 'Due' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {semesterFee.status || 'Not Due'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          ₹{(semesterFee.remainingAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-blue-50 rounded p-2 text-center">
                        <div className="font-medium text-blue-600">
                          ₹{(semesterFee.courseFee || semesterFee.semesterFee || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-blue-700">Course Fee</div>
                      </div>
                      <div className="bg-green-50 rounded p-2 text-center">
                        <div className="font-medium text-green-600">
                          ₹{(semesterFee.courseFeePaid || semesterFee.paidAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-green-700">Course Paid</div>
                      </div>
                      <div className="bg-orange-50 rounded p-2 text-center">
                        <div className="font-medium text-orange-600">
                          ₹{(semesterFee.backSubjectFees || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-orange-700">Back Fees</div>
                      </div>
                      <div className="bg-purple-50 rounded p-2 text-center">
                        <div className="font-medium text-purple-600">
                          ₹{(semesterFee.backSubjectFeesPaid || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-purple-700">Back Paid</div>
                      </div>
                    </div>
                    
                    {/* Additional Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-3">
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="font-medium text-gray-600 text-xs">
                          {semesterFee.dueDate ? new Date(semesterFee.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-700">Due Date</div>
                      </div>
                      <div className="bg-yellow-50 rounded p-2 text-center">
                        <div className="font-medium text-yellow-600">
                          ₹{(semesterFee.courseFeeRemaining || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-yellow-700">Course Pending</div>
                      </div>
                      <div className="bg-red-50 rounded p-2 text-center">
                        <div className="font-medium text-red-600">
                          ₹{(semesterFee.backSubjectFeesRemaining || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-red-700">Back Pending</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {(semesterFee.courseFee || semesterFee.semesterFee || 0) > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Payment Progress</span>
                          <span>{Math.round(((semesterFee.totalPaid || semesterFee.paidAmount || 0) / (semesterFee.totalDue || (semesterFee.semesterFee || 0) + (semesterFee.backSubjectFees || 0))) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              semesterFee.status === 'Paid' ? 'bg-green-500' :
                              semesterFee.status === 'Partial' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(((semesterFee.totalPaid || semesterFee.paidAmount || 0) / (semesterFee.totalDue || (semesterFee.semesterFee || 0) + (semesterFee.backSubjectFees || 0))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 border border-gray-200 rounded-lg">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>No semester-wise fee breakdown available</p>
              <p className="text-sm">Using legacy fee structure</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-purple-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Recent Payments ({feeHistory.length})
          </h3>
          <button 
            onClick={() => window.location.href = `/fees/history/${studentId}`}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center"
          >
            View All
            <Eye className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {feeHistory.slice(0, 5).map((payment) => (
            <div key={payment._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {payment.feeType.replace('_', ' ')} - Receipt #{payment.receiptNo}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(payment.paymentDate)} • {payment.paymentMode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(payment.finalAmount)}
                  </p>
                  {payment.discount > 0 && (
                    <p className="text-xs text-orange-600">
                      Discount: {formatCurrency(payment.discount)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {feeHistory.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No payments yet</p>
              <p className="text-sm">Payment history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper function to get back subject clear status from payment data
  const getBackSubjectClearStatus = (semester, subjectCode) => {
    if (!paymentStatus || !paymentStatus.semesterWiseStatus) return null;
    
    const semesterData = paymentStatus.semesterWiseStatus.find(s => s.semester === semester);
    if (!semesterData || !semesterData.pendingBackSubjects) return null;
    
    const backSubject = semesterData.pendingBackSubjects.find(bs => bs.subjectCode === subjectCode);
    return backSubject ? {
      isCleared: backSubject.isCleared || false,
      feePaid: backSubject.feePaid || false,
      feeAmount: backSubject.feeAmount || 500
    } : null;
  };

  // Helper function to calculate effective result status based on back subject clearance
  const getEffectiveResultStatus = (result) => {
    // If original result is Pass, return as-is
    if (result.result === 'Pass') {
      return result.result;
    }

    // If result is Fail, check if all back subjects are cleared
    if (result.result === 'Fail' && result.backSubjects && result.backSubjects.length > 0) {
      const allBackSubjectsCleared = result.backSubjects.every(bs => {
        const paymentInfo = getBackSubjectClearStatus(result.semester, bs.code);
        return paymentInfo?.isCleared || bs.isCleared;
      });

      // If all back subjects are cleared, the result should be Pass
      if (allBackSubjectsCleared) {
        return 'Pass';
      }
    }

    // Return original result for all other cases
    return result.result;
  };

  const ResultsTab = () => (
    <div className="space-y-8">
      {/* Results Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Results</p>
              <p className="text-xl font-bold text-gray-900">{results.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Passed</p>
              <p className="text-xl font-bold text-green-600">
                {results.filter(r => getEffectiveResultStatus(r) === 'Pass').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-500 shadow-sm">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Back Cleared</p>
              <p className="text-xl font-bold text-green-600">
                {(() => {
                  let clearedCount = 0;
                  results.forEach(r => {
                    if (r.backSubjects) {
                      r.backSubjects.forEach(bs => {
                        const paymentInfo = getBackSubjectClearStatus(r.semester, bs.code);
                        if (paymentInfo?.isCleared || bs.isCleared) {
                          clearedCount++;
                        }
                      });
                    }
                  });
                  return clearedCount;
                })()}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-500 shadow-sm">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Back Pending</p>
              <p className="text-xl font-bold text-red-600">
                {(() => {
                  let pendingCount = 0;
                  results.forEach(r => {
                    if (r.backSubjects) {
                      r.backSubjects.forEach(bs => {
                        const paymentInfo = getBackSubjectClearStatus(r.semester, bs.code);
                        if (!(paymentInfo?.isCleared || bs.isCleared)) {
                          pendingCount++;
                        }
                      });
                    }
                  });
                  return pendingCount;
                })()}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Delivered</p>
              <p className="text-xl font-bold text-green-600">
                {results.filter(r => r.isDelivered).length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-500 shadow-sm">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Not Delivered</p>
              <p className="text-xl font-bold text-blue-600">
                {results.filter(r => !r.isDelivered).length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500 shadow-sm">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-900 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Semester Results
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchLatestResults(results)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Results
            </button>
            <button
              onClick={checkSyncStatus}
              className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Debug Sync
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {results.map((result) => (
            <div key={result._id} className="px-4 py-6 md:px-6">
              {/* Header Section - Mobile Optimized */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                
                {/* Left Section - Semester Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h4 className="text-xl font-bold text-gray-900">
                      Semester {result.semester}
                    </h4>
                    
                    {/* Delivery Status Badge */}
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      result.isDelivered 
                        ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm'
                    }`}>
                      {result.isDelivered ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          <span className="font-medium">Delivered to Student</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span className="font-medium">Pending Delivery</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Date Information */}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Exam Date: <span className="font-medium ml-1">{formatDate(result.examDate)}</span>
                    </p>
                    {result.isDelivered && result.deliveryDate && (
                      <p className="text-sm text-green-700 flex items-center font-medium bg-green-50 px-2 py-1 rounded-md">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Delivered on: {formatDate(result.deliveryDate)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Right Section - Status & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3">
                  
                  {/* Result Status Badge */}
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${
                    getEffectiveResultStatus(result) === 'Pass' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : getEffectiveResultStatus(result) === 'Fail'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {getEffectiveResultStatus(result) === 'Pass' && <CheckCircle className="h-4 w-4 mr-2" />}
                    {getEffectiveResultStatus(result) === 'Fail' && <AlertTriangle className="h-4 w-4 mr-2" />}
                    {getEffectiveResultStatus(result) === 'Pending' && <Clock className="h-4 w-4 mr-2" />}
                    {getEffectiveResultStatus(result)}
                    {getEffectiveResultStatus(result) === 'Pass' && result.result === 'Fail' && (
                      <span className="ml-2 text-xs opacity-75">(Back Cleared)</span>
                    )}
                  </div>
                  
                  {/* Result Declared Date */}
                  <p className="text-sm text-gray-500 text-center lg:text-right">
                    Result declared on<br />
                    <span className="font-medium text-gray-700">{new Date(result.resultDate).toLocaleDateString()}</span>
                  </p>
                  
                  {/* Delivery Toggle Button */}
                  <button
                    onClick={() => toggleResultDelivery(result.semester, result.isDelivered)}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      result.isDelivered 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300 hover:shadow-md'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 hover:shadow-md'
                    }`}
                  >
                    {result.isDelivered ? (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Mark as Not Delivered
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                  <div className="text-xl font-bold text-green-600">{result.subjects?.filter(s => s.result === 'Pass').length || 0}</div>
                  <div className="text-xs text-green-700 font-medium">Passed</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                  <div className="text-xl font-bold text-red-600">{result.subjects?.filter(s => s.result === 'Fail').length || 0}</div>
                  <div className="text-xs text-red-700 font-medium">Failed</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                  <div className="text-xl font-bold text-green-600">{result.backSubjects?.filter(bs => bs.isCleared)?.length || 0}</div>
                  <div className="text-xs text-green-700 font-medium">Back Cleared</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                  <div className="text-xl font-bold text-red-600">{result.backSubjects?.filter(bs => !bs.isCleared)?.length || 0}</div>
                  <div className="text-xs text-red-700 font-medium">Back Pending</div>
                </div>
              </div>

              {/* Subject-wise Results */}
              {result.subjects && result.subjects.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    Subject-wise Results
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.subjects.map((subject, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-0">
                          <span className="font-semibold text-gray-900 text-sm">{subject.name}</span>
                          {subject.isBackSubject && (
                            <span className="mt-1 sm:mt-0 sm:ml-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Back Subject Cleared
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${
                          subject.result === 'Pass' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : subject.result === 'Fail'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : subject.result === 'Absent'
                                ? 'bg-gray-100 text-gray-800 border border-gray-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {subject.result === 'Pass' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {subject.result === 'Fail' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {subject.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back Subjects Status */}
              {result.backSubjects && result.backSubjects.length > 0 && (
                <div className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-orange-800 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Back Subjects ({result.backSubjects.length})
                    </h5>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {result.backSubjects.filter(s => s.isCleared).length} Cleared
                      </span>
                      <span className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {result.backSubjects.filter(s => !s.isCleared).length} Pending
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.backSubjects.map((subject, index) => (
                      <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                        subject.isCleared 
                          ? 'bg-green-50 border-green-200 hover:border-green-300' 
                          : 'bg-white border-orange-200 hover:border-orange-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                              subject.isCleared ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              {subject.isCleared ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{subject.name}</span>
                              <span className="text-gray-500 text-sm ml-2">({subject.code})</span>
                              {subject.isCleared && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  ✓ Back Clear
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {subject.isCleared ? (
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-600 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Successfully Cleared
                                </div>
                                <div className="text-xs text-gray-500">
                                  {subject.clearedDate ? `Cleared on ${new Date(subject.clearedDate).toLocaleDateString('en-IN')}` : 'Cleared'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-right">
                                <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                                  subject.feePaid ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {subject.feePaid ? '✓ Fee Paid - Pending Exam' : '⚠ Fee Pending'}
                                </div>
                                <div className="text-sm font-medium text-orange-600 mt-1">
                                  ₹{subject.feeAmount || 500}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress indicator */}
                        {!subject.isCleared && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="flex items-center mr-4">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  subject.feePaid ? 'bg-blue-500' : 'bg-red-500'
                                }`}></div>
                                Step 1: {subject.feePaid ? 'Fee Paid ✓' : 'Pay Exam Fee'}
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2 bg-gray-300"></div>
                                Step 2: Take Exam & Clear
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.remarks && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Remarks</h5>
                  <p className="text-sm text-gray-600">{result.remarks}</p>
                </div>
              )}
            </div>
          ))}
          
          {results.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No results yet</p>
              <p className="text-sm">Exam results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="space-y-8">
      {/* Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Student Documents
          </h3>
        </div>
        
        <div className="p-6">
          {student?.documents && student.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {student.documents.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Uploaded: {formatDate(doc.uploadedAt)}
                  </p>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.open(doc.url, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No documents uploaded</p>
              <p className="text-sm">Student documents will appear here</p>
              <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Notes
          </h3>
        </div>
        
        <div className="p-6">
          {student?.notes ? (
            <div className="prose max-w-none">
              <p className="text-gray-700">{student.notes}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No notes available for this student</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="h-6 w-6 bg-gray-200 rounded mr-4"></div>
                <div className="h-8 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-96"></div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Student not found</h3>
            <p className="text-gray-500 mb-6">The student you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => window.location.href = '/students'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
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
              <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
              <p className="mt-2 text-lg text-gray-600">
                Complete profile and academic information
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStudentDetails}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button 
                onClick={() => window.location.href = `/students/edit/${studentId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button 
                onClick={handleDeleteStudent}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg shadow-sm bg-white text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Student Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-24 w-24 rounded-full overflow-hidden">
                {student.profileImage ? (
                  <img 
                    src={student.profileImage} 
                    alt={student.name}
                    className="h-24 w-24 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ${student.profileImage ? 'hidden' : ''}`}>
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-lg text-gray-600">ID: {student.studentId}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {student.academicInfo?.course}
                  </span>
                  {getStatusBadge(student.status)}
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.location.href = `/fees/history/${studentId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Fee History
              </button>
              <button 
                onClick={() => window.location.href = '/fees/add-payment'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'academic' && <AcademicTab />}
            {activeTab === 'fees' && <StudentPaymentStatus studentId={studentId} />}
            {activeTab === 'back-subjects' && <BackSubjectManager studentId={studentId} />}
            {activeTab === 'results' && <ResultsTab />}
            {activeTab === 'documents' && <DocumentsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsPage;