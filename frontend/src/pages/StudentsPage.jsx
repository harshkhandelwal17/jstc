
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Edit, 
  Eye, 
  Trash2,
  Users,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  XCircle,
  DollarSign,
  BookOpen,
  MoreHorizontal,
  UserPlus,
  FileText,
  BarChart3
} from 'lucide-react';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const courses = ['PGDCA', 'DCA'];
  const statuses = ['Active', 'Inactive', 'Completed', 'Dropped', 'Suspended'];
  const feeStatuses = ['Paid', 'Pending', 'Partial'];

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchTerm, selectedCourse, selectedStatus, selectedBatch, selectedFeeStatus]);

  const fetchStudents = async () => {
    try {
      setLoading(currentPage === 1);
      setRefreshing(currentPage !== 1);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCourse && { course: selectedCourse }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedBatch && { batch: selectedBatch }),
        ...(selectedFeeStatus && { feeStatus: selectedFeeStatus })
      });

      const response = await fetch(`${API_BASE_URL}/students?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
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
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete student' }));
        throw new Error(errorData.message || 'Failed to delete student');
      }

      const data = await response.json();
      
      // Refresh the list
      fetchStudents();
      alert(data.message || 'Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(`Error: ${error.message}`);
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
    setSelectedStatus('');
    setSelectedBatch('');
    setSelectedFeeStatus('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Inactive': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
      'Completed': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      'Dropped': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      'Suspended': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig['Inactive'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getFeeStatusBadge = (student) => {
    const feeStatus = student.feeStatus || 'Pending';
    
    const statusConfig = {
      'Paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Partial': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Pending': { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[feeStatus] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {feeStatus}
      </span>
    );
  };

  // Grid View Student Card
  const StudentCard = ({ student }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden ring-2 ring-white/30">
              {student.profileImage ? (
                <img 
                  src={student.profileImage} 
                  alt={student.name}
                  className="h-12 w-12 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`h-12 w-12 bg-blue-400 rounded-xl flex items-center justify-center ${student.profileImage ? 'hidden' : ''}`}>
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <h3 className="font-semibold text-white leading-tight truncate">{student.name}</h3>
              <p className="text-blue-100 text-xs mt-1">ID: {student.studentId}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(student.status)}
          </div>
        </div>
        
        {/* Course Badge */}
        <div className="flex items-center">
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-white">
            {student.academicInfo?.course || 'N/A'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{student.phone}</span>
          </div>
          
          {student.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{student.email}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Joined: {formatDate(student.academicInfo?.joiningDate)}</span>
          </div>
        </div>

        {/* Fee Status */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Fee Status</span>
            {getFeeStatusBadge(student)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <span className="text-gray-500">Total Fee</span>
              <div className="font-semibold text-gray-900">
                {formatCurrency(student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee || 0)}
              </div>
            </div>
            <div className={`p-2 rounded border ${
              (student.feeStructure?.remainingAmount || 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <span className="text-gray-500">Pending</span>
              <div className={`font-semibold ${
                (student.feeStructure?.remainingAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(student.feeStructure?.remainingAmount || 0)}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-medium">
                {Math.round(((student.feeStructure?.totalPaid || 0) / (student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  student.feeStatus === 'Paid' ? 'bg-green-500' :
                  student.feeStatus === 'Partial' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(((student.feeStructure?.totalPaid || 0) / (student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee || 1)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = `/students/details/${student.studentId}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </button>
          
          <button
            onClick={() => window.location.href = `/students/edit/${student.studentId}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </button>
          
          <button
            onClick={() => handleDeleteStudent(student.studentId)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // List View Student Row
  const StudentRow = ({ student }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Student Info */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden">
              {student.profileImage ? (
                <img 
                  src={student.profileImage} 
                  alt={student.name}
                  className="h-12 w-12 object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              )}
            </div>
            
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-500">ID: {student.studentId}</p>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(student.status)}
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  {student.academicInfo?.course || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="hidden md:flex flex-col space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              {student.phone}
            </div>
            {student.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {student.email}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Joined: {formatDate(student.academicInfo?.joiningDate)}
            </div>
          </div>

          {/* Fee Status */}
          <div className="hidden lg:flex flex-col items-end space-y-2">
            {getFeeStatusBadge(student)}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee || 0)}
              </div>
              <div className="text-xs text-gray-500">Total Fee</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${
                (student.feeStructure?.remainingAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(student.feeStructure?.remainingAmount || 0)}
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = `/students/details/${student.studentId}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              View
            </button>
            
            <button
              onClick={() => window.location.href = `/students/edit/${student.studentId}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </button>
            
            <button
              onClick={() => handleDeleteStudent(student.studentId)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
                    <p className="text-gray-600 mt-1">Manage and track your student records</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{total}</div>
                    <div className="text-blue-700 text-sm">Total Students</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{students.filter(s => s.status === 'Active').length}</div>
                    <div className="text-green-700 text-sm">Active</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{students.filter(s => s.feeStatus === 'Paid').length}</div>
                    <div className="text-purple-700 text-sm">Fees Paid</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{students.filter(s => s.feeStatus === 'Pending').length}</div>
                    <div className="text-orange-700 text-sm">Fees Pending</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={fetchStudents}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  onClick={() => window.location.href = '/students/add'}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 font-medium hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search students by name, ID, phone, or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg font-medium transition-colors ${
                showFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(selectedCourse || selectedStatus || selectedBatch || selectedFeeStatus) && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold">
                  {[selectedCourse, selectedStatus, selectedBatch, selectedFeeStatus].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter batch year..."
                    value={selectedBatch}
                    onChange={(e) => {
                      setSelectedBatch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Fee Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fee Status</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={selectedFeeStatus}
                    onChange={(e) => {
                      setSelectedFeeStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Fee Status</option>
                    {feeStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCourse || selectedStatus || selectedBatch || selectedFeeStatus) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Students Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                    <div className="ml-3 flex-1">
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
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCourse || selectedStatus || selectedBatch || selectedFeeStatus
                ? 'Try adjusting your search criteria or filters' 
                : 'Get started by adding your first student'
              }
            </p>
            <button 
              onClick={() => window.location.href = '/students/add'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add First Student
            </button>
          </div>
        ) : (
          <>
            {/* Students Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {students.map((student) => (
                  <StudentCard key={student._id} student={student} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {students.map((student) => (
                  <StudentRow key={student._id} student={student} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 12 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 12, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> students
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else {
                          const maxVisible = 5;
                          const half = Math.floor(maxVisible / 2);
                          let start = Math.max(1, currentPage - half);
                          let end = Math.min(totalPages, start + maxVisible - 1);
                          
                          if (end - start < maxVisible - 1) {
                            start = Math.max(1, end - maxVisible + 1);
                          }
                          
                          page = start + i;
                          if (page > end) return null;
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
