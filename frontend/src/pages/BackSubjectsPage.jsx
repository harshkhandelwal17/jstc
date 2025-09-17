import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Cookies from "js-cookie";
import { 
  AlertTriangle,
  CheckCircle,
  Search,
  Users,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Eye,
  Plus,
  Filter,
  BarChart3,
  FileText,
  TrendingUp,
  Clock,
  Calendar,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axiosInstance from '../utils/axios';

const BackSubjectsPage = () => {
  const navigate = useNavigate();
  const [backSubjects, setBackSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('totalCount'); // 'totalCount', 'clearedCount', 'pendingCount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  useEffect(() => {
    fetchBackSubjects();
  }, []);

  const fetchBackSubjects = async () => {
    try {
      setLoading(true);
      console.log('BACK SUBJECTS: Fetching back subjects data...');
      
      const response = await axiosInstance.get('/reports/back-subjects');
      console.log("BACK SUBJECTS: API response:", response);
      console.log("BACK SUBJECTS: Response data:", response.data);
      
      if (response.data.success) {
        setBackSubjects(response.data.data || []);
        console.log("BACK SUBJECTS: Data set successfully:", response.data.data?.length || 0, "items");
      } else {
        console.error("BACK SUBJECTS: API returned success=false:", response.data.message);
        toast.error(response.data.message || 'Failed to load back subjects');
      }

    } catch(error) {
      console.error('BACK SUBJECTS: Error details:', error);
      console.error('BACK SUBJECTS: Error response:', error.response?.data);
      console.error('BACK SUBJECTS: Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Error loading back subjects';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        console.warn('BACK SUBJECTS: 401 error - authentication issue');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unique courses for filtering
  const uniqueCourses = [...new Set(backSubjects.map(subject => subject._id?.course))].filter(Boolean);

  // Filter and sort subjects
  const filteredAndSortedSubjects = backSubjects
    .filter(subject => {
      const matchesSearch = 
        subject._id?.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject._id?.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject._id?.course?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = !selectedCourse || subject._id?.course === selectedCourse;
      const matchesStatus = !selectedStatus || 
        (selectedStatus === 'cleared' && subject.clearedCount > 0) ||
        (selectedStatus === 'pending' && (subject.totalCount - subject.clearedCount) > 0);

      return matchesSearch && matchesCourse && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'totalCount':
          aValue = a.totalCount;
          bValue = b.totalCount;
          break;
        case 'clearedCount':
          aValue = a.clearedCount;
          bValue = b.clearedCount;
          break;
        case 'pendingCount':
          aValue = a.totalCount - a.clearedCount;
          bValue = b.totalCount - b.clearedCount;
          break;
        default:
          aValue = a.totalCount;
          bValue = b.totalCount;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

  // Calculate summary statistics
  const totalSubjects = backSubjects.length;
  const totalStudents = backSubjects.reduce((sum, subject) => sum + subject.totalCount, 0);
  const totalCleared = backSubjects.reduce((sum, subject) => sum + subject.clearedCount, 0);
  const totalPending = totalStudents - totalCleared;
  const overallProgress = totalStudents > 0 ? Math.round((totalCleared / totalStudents) * 100) : 0;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedStatus('');
    setSortBy('totalCount');
    setSortOrder('desc');
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${onClick ? 'hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {Icon && <Icon className="h-6 w-6 text-white" />}
        </div>
      </div>
    </div>
  );

  const SubjectCard = ({ subject }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 min-h-[400px] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start flex-1 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${subject.clearedCount === subject.totalCount ? 'bg-green-100' : 'bg-orange-100'}`}>
            <BookOpen className={`h-6 w-6 ${subject.clearedCount === subject.totalCount ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">
              {subject._id?.subjectName}
            </h3>
            <p className="text-sm text-gray-600 mt-1 break-words">
              {subject._id?.subjectCode} • {subject._id?.course}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
          subject.clearedCount === subject.totalCount 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {subject.clearedCount === subject.totalCount ? 'All Cleared' : 'In Progress'}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{subject.totalCount}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{subject.clearedCount}</div>
          <div className="text-xs text-gray-600">Cleared</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{subject.totalCount - subject.clearedCount}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">
            {Math.round((subject.clearedCount / subject.totalCount) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              subject.clearedCount === subject.totalCount ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ 
              width: `${(subject.clearedCount / subject.totalCount) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Students Preview */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Recent Students</h4>
          <button 
            onClick={() => navigate(`/results/back-subjects?subject=${subject._id?.subjectCode}`)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {subject.students?.slice(0, 3).map((student, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-700 truncate flex-1 min-w-0">
                {student.studentName}
              </span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                student.isCleared 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {student.isCleared ? '✓' : '⏳'}
              </span>
            </div>
          ))}
          {subject.students?.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-1">
              +{subject.students.length - 3} more
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/results/back-subjects?subject=${subject._id?.subjectCode}`)}
            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1 inline" />
            View Details
          </button>
          <button
            onClick={() => navigate(`/results/back-subjects?subject=${subject._id?.subjectCode}&action=update`)}
            className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1 inline" />
            Update
          </button>
        </div>
      </div>
    </div>
  );

  const SubjectRow = ({ subject }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Subject Info */}
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${subject.clearedCount === subject.totalCount ? 'bg-green-100' : 'bg-orange-100'}`}>
            <BookOpen className={`h-5 w-5 ${subject.clearedCount === subject.totalCount ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 break-words leading-tight">{subject._id?.subjectName}</h3>
            <p className="text-sm text-gray-600 break-words">{subject._id?.subjectCode} • {subject._id?.course}</p>
          </div>
        </div>

        {/* Statistics and Progress Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 flex-shrink-0">
          {/* Statistics */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{subject.totalCount}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{subject.clearedCount}</div>
              <div className="text-xs text-gray-600">Cleared</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{subject.totalCount - subject.clearedCount}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>

          {/* Progress */}
          <div className="w-32 flex-shrink-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round((subject.clearedCount / subject.totalCount) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  subject.clearedCount === subject.totalCount ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ 
                  width: `${(subject.clearedCount / subject.totalCount) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status and Actions Row */}
        <div className="flex items-center justify-between lg:justify-end space-x-3 flex-shrink-0">
          {/* Status */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            subject.clearedCount === subject.totalCount 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {subject.clearedCount === subject.totalCount ? 'All Cleared' : 'In Progress'}
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/results/back-subjects?subject=${subject._id?.subjectCode}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(`/results/back-subjects?subject=${subject._id?.subjectCode}&action=update`)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Update Results"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Back Subjects Management</h1>
              <p className="mt-2 text-lg text-gray-600">Track and manage student back subject progress</p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => navigate('/results/back-subjects')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Update Results
              </button>
              
              <button
                onClick={fetchBackSubjects}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Subjects"
            value={totalSubjects}
            subtitle="With back subjects"
            icon={BookOpen}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Students"
            value={totalStudents}
            subtitle="With back subjects"
            icon={Users}
            color="bg-purple-500"
          />
          <StatCard
            title="Cleared"
            value={totalCleared}
            subtitle="Successfully completed"
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Pending"
            value={totalPending}
            subtitle="Still in progress"
            icon={Clock}
            color="bg-orange-500"
          />
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
            <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects, codes, or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>

              {(selectedCourse || selectedStatus || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Courses</option>
                    {uniqueCourses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="cleared">Has Cleared Students</option>
                    <option value="pending">Has Pending Students</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <div className="flex space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="totalCount">Total Students</option>
                      <option value="clearedCount">Cleared Count</option>
                      <option value="pendingCount">Pending Count</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedSubjects.length} of {backSubjects.length} subjects
          </p>
          {filteredAndSortedSubjects.length > 0 && (
            <p className="text-sm text-gray-600">
              {viewMode === 'grid' ? 'Grid' : 'List'} view
            </p>
          )}
        </div>

        {/* Back Subjects List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Loading back subjects...</p>
          </div>
        ) : filteredAndSortedSubjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredAndSortedSubjects.map((subject, index) => (
                <SubjectCard key={index} subject={subject} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedSubjects.map((subject, index) => (
                <SubjectRow key={index} subject={subject} index={index} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-300" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Back Subjects Found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCourse || selectedStatus 
                  ? 'No subjects match your current filters.' 
                  : 'All students are up to date with their subjects!'
                }
              </p>
              {(searchTerm || selectedCourse || selectedStatus) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackSubjectsPage;