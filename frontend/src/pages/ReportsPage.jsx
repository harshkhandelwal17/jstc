import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  DollarSign,
  Award,
  AlertTriangle,
  FileText,
  Eye,
  X,
  ChevronDown,
  Target,
  Activity,
  BookOpen,
  CreditCard,
  Clock,
  CheckCircle
} from 'lucide-react';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [reportData, setReportData] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jstc.vercel.app/api';
  const courses = ['PGDCA', 'DCA'];

  const reportTypes = [
    { id: 'overview', name: 'Dashboard Overview', icon: BarChart3, color: 'blue' },
    { id: 'fee-collection', name: 'Fee Collection Report', icon: DollarSign, color: 'green' },
    { id: 'student-performance', name: 'Student Performance', icon: Award, color: 'purple' },
    { id: 'back-subjects', name: 'Back Subjects Report', icon: AlertTriangle, color: 'red' },
    { id: 'course-wise', name: 'Course-wise Analysis', icon: BookOpen, color: 'indigo' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange, selectedCourse]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      let endpoint = '';
      let params = new URLSearchParams({
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
        ...(selectedCourse && { course: selectedCourse })
      });

      switch (selectedReport) {
        case 'overview':
          endpoint = '/dashboard/stats';
          break;
        case 'fee-collection':
          endpoint = `/reports/fee-collection?${params}`;
          break;
        case 'student-performance':
          endpoint = `/reports/student-performance?${params}`;
          break;
        case 'back-subjects':
          endpoint = `/reports/back-subjects?${params}`;
          break;
        case 'course-wise':
          endpoint = '/dashboard/stats';
          break;
        default:
          endpoint = '/dashboard/stats';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color, subtitle }) => (
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
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`flex-shrink-0 p-3 rounded-xl ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  const OverviewReport = () => {
    const stats = reportData.stats || {};
    
    return (
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.students?.total || 0}
            change="+12% this month"
            changeType="increase"
            icon={Users}
            color="bg-blue-500"
            subtitle="Active enrollments"
          />
          
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.collection?.total || 0)}
            change="+8% this month"
            changeType="increase"
            icon={DollarSign}
            color="bg-green-500"
            subtitle="Fee collection"
          />
          
          <StatCard
            title="Success Rate"
            value={`${stats.backSubjects?.total > 0 
              ? Math.round(((stats.backSubjects.cleared || 0) / stats.backSubjects.total) * 100)
              : 100}%`}
            change="+5% this month"
            changeType="increase"
            icon={Award}
            color="bg-purple-500"
            subtitle="Student performance"
          />
          
          <StatCard
            title="Back Subjects"
            value={stats.backSubjects?.pending || 0}
            change={stats.backSubjects?.pending > 0 ? "Needs attention" : "All clear!"}
            changeType={stats.backSubjects?.pending > 0 ? "decrease" : "increase"}
            icon={AlertTriangle}
            color={stats.backSubjects?.pending > 0 ? "bg-red-500" : "bg-green-500"}
            subtitle="Pending clearance"
          />
        </div>

        {/* Course Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Course Distribution
            </h3>
            
            <div className="space-y-4">
              {Object.entries(stats.courses || {}).map(([course, data]) => (
                <div key={course} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{course}</h4>
                    <span className="text-sm text-gray-600">{data.studentCount} students</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Collection:</span>
                      <span className="font-medium text-green-600 ml-2">{data.collectionPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-medium text-red-600 ml-2">{formatCurrency(data.totalPending)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(data.collectionPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {reportData.recentPayments?.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{payment.studentName}</p>
                    <p className="text-xs text-gray-500">{payment.feeType} - {formatCurrency(payment.finalAmount)}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>
              ))}
              
              {reportData.recentResults?.slice(0, 3).map((result, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    result.result === 'Pass' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {result.result === 'Pass' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{result.studentName}</p>
                    <p className="text-xs text-gray-500">
                      {result.course} Sem {result.semester} - {result.percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`text-xs font-medium ${
                    result.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.result}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FeeCollectionReport = () => {
    const data = reportData.data || [];
    const summary = reportData.summary || {};
    
    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Collection"
            value={formatCurrency(summary.totalCollection || 0)}
            icon={DollarSign}
            color="bg-green-500"
            subtitle="Current period"
          />
          
          <StatCard
            title="Total Transactions"
            value={summary.totalTransactions || 0}
            icon={CreditCard}
            color="bg-blue-500"
            subtitle="Payment count"
          />
          
          <StatCard
            title="Average Transaction"
            value={formatCurrency(summary.averageTransaction || 0)}
            icon={Target}
            color="bg-purple-500"
            subtitle="Per payment"
          />
          
          <StatCard
            title="Collection Rate"
            value="92%"
            change="+5% from last month"
            changeType="increase"
            icon={TrendingUp}
            color="bg-orange-500"
            subtitle="Fee collection efficiency"
          />
        </div>

        {/* Collection Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Collection Breakdown
            </h3>
          </div>
          
          <div className="p-6">
            {data.length > 0 ? (
              <div className="space-y-4">
                {data.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item._id.course} - {item._id.feeType.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-500">Date: {item._id.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(item.totalAmount)}</p>
                      <p className="text-sm text-gray-500">{item.transactionCount} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No collection data available for selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StudentPerformanceReport = () => {
    const results = reportData.results || [];
    const stats = reportData.stats || {};
    
    return (
      <div className="space-y-8">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Results"
            value={stats.totalResults || 0}
            icon={FileText}
            color="bg-blue-500"
            subtitle="Published results"
          />
          
          <StatCard
            title="Pass Rate"
            value={`${stats.totalResults > 0 ? Math.round((stats.passCount / stats.totalResults) * 100) : 0}%`}
            change="+3% improvement"
            changeType="increase"
            icon={CheckCircle}
            color="bg-green-500"
            subtitle={`${stats.passCount || 0} students passed`}
          />
          
          <StatCard
            title="Average Percentage"
            value={`${stats.averagePercentage?.toFixed(1) || 0}%`}
            icon={Target}
            color="bg-purple-500"
            subtitle="Overall performance"
          />
          
          <StatCard
            title="Back Subjects"
            value={stats.backSubjectsCount || 0}
            icon={AlertTriangle}
            color="bg-red-500"
            subtitle="Subjects to clear"
          />
        </div>

        {/* Results List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Recent Results
            </h3>
          </div>
          
          <div className="p-6">
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.slice(0, 10).map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        result.result === 'Pass' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {result.result === 'Pass' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{result.studentName}</h4>
                        <p className="text-sm text-gray-500">
                          {result.course} - Semester {result.semester}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{result.percentage?.toFixed(1)}%</p>
                      <p className={`text-sm ${
                        result.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No performance data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BackSubjectsReport = () => {
    const data = reportData.data || [];
    
    return (
      <div className="space-y-8">
        {/* Back Subject Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Back Subjects"
            value={data.reduce((sum, item) => sum + item.totalCount, 0)}
            icon={AlertTriangle}
            color="bg-red-500"
            subtitle="Across all courses"
          />
          
          <StatCard
            title="Cleared Subjects"
            value={data.reduce((sum, item) => sum + item.clearedCount, 0)}
            icon={CheckCircle}
            color="bg-green-500"
            subtitle="Successfully cleared"
          />
          
          <StatCard
            title="Outstanding Fees"
            value={formatCurrency(data.reduce((sum, item) => sum + ((item.totalCount - item.clearedCount) * 500), 0))}
            icon={DollarSign}
            color="bg-orange-500"
            subtitle="₹500 per subject"
          />
        </div>

        {/* Subject-wise Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-red-600" />
              Subject-wise Back Report
            </h3>
          </div>
          
          <div className="p-6">
            {data.length > 0 ? (
              <div className="space-y-4">
                {data.map((subject, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {subject._id.subjectName} ({subject._id.subjectCode})
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {subject._id.course}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">{subject.totalCount}</div>
                        <div className="text-xs text-red-700">Total Cases</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{subject.clearedCount}</div>
                        <div className="text-xs text-green-700">Cleared</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency((subject.totalCount - subject.clearedCount) * 500)}
                        </div>
                        <div className="text-xs text-orange-700">Pending Fees</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(subject.clearedCount / subject.totalCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((subject.clearedCount / subject.totalCount) * 100)}% cleared
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <p>Excellent! No back subjects found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }

    switch (selectedReport) {
      case 'overview':
        return <OverviewReport />;
      case 'fee-collection':
        return <FeeCollectionReport />;
      case 'student-performance':
        return <StudentPerformanceReport />;
      case 'back-subjects':
        return <BackSubjectsReport />;
      case 'course-wise':
        return <OverviewReport />;
      default:
        return <OverviewReport />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-lg text-gray-600">
                Comprehensive insights and analytics for your institute
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setRefreshing(true)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button 
                onClick={() => {
                  alert('Export feature coming soon!');
                }}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedReport === report.id
                    ? `border-${report.color}-500 bg-${report.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <report.icon className={`h-6 w-6 mx-auto mb-2 ${
                  selectedReport === report.id ? `text-${report.color}-600` : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium text-center ${
                  selectedReport === report.id ? `text-${report.color}-900` : 'text-gray-700'
                }`}>
                  {report.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDateRange({
                      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                      end: new Date().toISOString().split('T')[0]
                    });
                    setSelectedCourse('');
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        <div>
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;