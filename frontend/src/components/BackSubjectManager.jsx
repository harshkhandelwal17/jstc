import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CreditCard,
  Calendar,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Receipt,
  TrendingUp,
  Save,
  X,
  Award
} from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import { useStudents } from '../hooks/useStudents';
import axiosInstance from '../utils/axios';

const BackSubjectManager = ({ studentId }) => {
  const { 
    fetchStudentBackSubjects, 
    payBackSubjectFee, 
    clearBackSubject, 
    loading, 
    error 
  } = useStudents();
  
  const [backSubjects, setBackSubjects] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    marks: '',
    isCleared: false,
    examDate: '',
    remarks: ''
  });

  const fetchBackSubjects = async () => {
    try {
      const subjects = await fetchStudentBackSubjects(studentId);
      setBackSubjects(subjects);
    } catch (err) {
      console.error('Error fetching back subjects:', err);
    }
  };

  const handlePayment = async (semester, subjectCode, amount) => {
    try {
      await payBackSubjectFee(studentId, {
        semester,
        subjectCode,
        paymentAmount: amount,
        paymentMethod: 'Cash',
        remarks: `Back subject fee payment for ${subjectCode}`
      });
      
      fetchBackSubjects();
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  const handleUpdateResult = async () => {
    if (!selectedSubject) return;

    try {
      setUpdating(true);
      const response = await axiosInstance.put(`/students/${studentId}/back-subjects/update-result`, {
        semester: selectedSubject.semester,
        subjectCode: selectedSubject.subjectCode,
        marks: parseInt(updateForm.marks),
        isCleared: updateForm.isCleared,
        examDate: updateForm.examDate,
        remarks: updateForm.remarks
      });
      
      // Show success message
      alert(response.data.message);
      
      // Close modal and reset form
      setShowUpdateModal(false);
      setSelectedSubject(null);
      setUpdateForm({
        marks: '',
        isCleared: false,
        examDate: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      
      // Refresh back subjects data
      await fetchBackSubjects();
      
      // Force a page refresh to ensure all data is synced
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      alert(`Update failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (subject) => {
    setSelectedSubject(subject);
    setUpdateForm({
      marks: '',
      isCleared: false,
      examDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setShowUpdateModal(true);
  };

  useEffect(() => {
    if (studentId) {
      fetchBackSubjects();
    }
  }, [studentId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getSubjectStatus = (subject) => {
    if (subject.isCleared) {
      return 'Cleared';
    }
    
    if (!subject.feePaid) {
      return 'Fee_Pending';
    }
    
    return 'Fee_Paid';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Back Subjects</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchBackSubjects}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
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
            <BookOpen className="h-6 w-6 mr-3 text-orange-600" />
            Back Subject Management
          </h2>
          <button
            onClick={fetchBackSubjects}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {backSubjects.length === 0 ? (
          <div className="text-center py-8">
            <Award className="mx-auto h-16 w-16 text-green-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Back Subjects!</h3>
            <p className="text-gray-500">This student has no pending back subjects. Great job!</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Total Back Subjects</p>
                  <p className="text-2xl font-bold text-orange-900">{backSubjects.length}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-700">Total Pending Amount</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(backSubjects.reduce((sum, sub) => sum + sub.feeAmount, 0))}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-600" />
              </div>
            </div>

            {/* Back Subjects List */}
            <div className="space-y-4">
              {backSubjects.map((subject, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {subject.subjectName}
                        </h3>
                        <StatusBadge status={getSubjectStatus(subject)} />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Subject Code:</span>
                          <span className="font-medium text-gray-900 ml-2">{subject.subjectCode}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Semester:</span>
                          <span className="font-medium text-gray-900 ml-2">{subject.semester}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Fee Amount:</span>
                          <span className="font-medium text-gray-900 ml-2">{formatCurrency(subject.feeAmount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Exam Date:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {subject.examDate ? new Date(subject.examDate).toLocaleDateString('en-IN') : 'Not scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {subject.isCleared ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Subject cleared successfully!
                        </span>
                      ) : !subject.feePaid ? (
                        <span className="text-red-600">Fee payment required before exam</span>
                      ) : (
                        <span className="text-blue-600">Fee paid - ready for exam</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!subject.feePaid && (
                        <button
                          onClick={() => handlePayment(subject.semester, subject.subjectCode, subject.feeAmount)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Fee ({formatCurrency(subject.feeAmount)})
                        </button>
                      )}
                      
                      {subject.feePaid && !subject.isCleared && (
                        <button
                          onClick={() => openUpdateModal(subject)}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Result
                        </button>
                      )}
                      
                      {subject.isCleared && (
                        <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                          <Award className="h-4 w-4 mr-2" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Update Result Modal */}
      {showUpdateModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Exam Result
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Subject:</p>
              <p className="font-medium text-gray-900">
                {selectedSubject.subjectCode} - {selectedSubject.subjectName}
              </p>
              <p className="text-xs text-gray-500 mt-1">Semester {selectedSubject.semester}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marks Obtained *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={updateForm.marks}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, marks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter marks (0-100)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={updateForm.examDate}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, examDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCleared"
                  checked={updateForm.isCleared}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, isCleared: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isCleared" className="ml-2 block text-sm text-gray-900">
                  Subject cleared (passed)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  rows="3"
                  value={updateForm.remarks}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any remarks about the exam..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateResult}
                disabled={updating || !updateForm.marks}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Result
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackSubjectManager;