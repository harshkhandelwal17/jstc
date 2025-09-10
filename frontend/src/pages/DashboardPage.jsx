import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Calendar,
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Wallet,
  UserCheck,
  UserX,
  GraduationCap,
  ClipboardList,
  FileText,
  Award,
  TrendingDown,
  BarChart3,
  PieChart,
  ChevronRight,
  UserPlus,
  Receipt,
  BookOpenCheck,
  CalendarDays
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard stats with period
      const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats?period=${selectedPeriod}`, { headers });
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const statsData = await statsResponse.json();

      // Fetch courses data
      try {
        const coursesResponse = await fetch(`${API_BASE_URL}/courses`, { headers });
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.courses || []);
        } else {
          console.warn('Failed to fetch courses data');
          setCourses([]);
        }
      } catch (courseError) {
        console.warn('Error fetching courses:', courseError);
        setCourses([]);
      }

      setStats(statsData.stats || {});
      setRecentPayments(statsData.recentPayments || []);
      setRecentResults(statsData.recentResults || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

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

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'Today';
      case 'current_month': return 'This Month';
      case 'last_month': return 'Last Month';
      default: return 'This Month';
    }
  };

  // Simple Stat Card Component
  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
    <div 
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-6 
        hover:shadow-md hover:border-gray-300 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-96"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Simple Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600"> overview  of your computer centre</p>
            </div>
            
            {/* Period Selector */}
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="current_month">This Month</option>
                <option value="last_month">Last Month</option>
              </select>
              
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats?.students?.total || 0}
            subtitle={`${getPeriodLabel(selectedPeriod)}`}
            icon={Users}
            color="bg-blue-500"
            onClick={() => navigate('/students')}
          />
          
          <StatCard
            title="Total Collection"
            value={formatCurrency(stats?.collection?.total || 0)}
            subtitle={`${getPeriodLabel(selectedPeriod)}`}
            icon={DollarSign}
            color="bg-green-500"
            onClick={() => navigate('/fees')}
          />
          
          <StatCard
            title="Pending Back Subjects"
            value={stats?.backSubjects?.pending || 0}
            subtitle={stats?.backSubjects?.pending > 0 ? "Needs attention" : "All clear!"}
            icon={AlertTriangle}
            color={stats?.backSubjects?.pending > 0 ? "bg-red-500" : "bg-green-500"}
            onClick={() => navigate('/back-subjects')}
          />
          
          <StatCard
            title="Active Students"
            value={stats?.students?.byStatus?.Active || 0}
            subtitle="Currently enrolled"
            icon={UserCheck}
            color="bg-purple-500"
            onClick={() => navigate('/students')}
          />
        </div>

        {/* Course-wise Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Course Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
                <p className="text-sm text-gray-600">Student distribution by course</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {stats?.courses ? (
                Object.entries(stats.courses).map(([course, data]) => (
                  <div key={course} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${course === 'PGDCA' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        <span className="font-medium text-gray-900">{course}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{data.studentCount}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Collection Rate:</span>
                        <span className="ml-2 font-medium text-green-600">{data.collectionPercentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pending:</span>
                        <span className="ml-2 font-medium text-red-600">{formatCurrency(data.totalPending)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.min(data.collectionPercentage, 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            course === 'PGDCA' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(data.collectionPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No course data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Back Subjects Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-orange-500 rounded-lg mr-3">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Back Subjects</h3>
                <p className="text-sm text-gray-600">Examination status overview</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600 mb-1">{stats?.backSubjects?.pending || 0}</div>
                <div className="text-sm text-red-700 font-medium">Pending</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">{stats?.backSubjects?.cleared || 0}</div>
                <div className="text-sm text-green-700 font-medium">Cleared</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">{stats?.backSubjects?.total || 0}</div>
                <div className="text-sm text-blue-700 font-medium">Total</div>
              </div>
            </div>
            
            {stats?.backSubjects?.pending > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-1">Action Required</p>
                    <p className="text-sm text-yellow-700 mb-2">
                      {stats.backSubjects.pending} students have pending back subjects
                    </p>
                    <p className="text-sm font-medium text-yellow-800">
                      💰 Potential Revenue: {formatCurrency(stats.backSubjects.pending * 500)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">Excellent! 🎉</p>
                    <p className="text-sm text-green-700">All students are up to date</p>
                  </div>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => navigate('/back-subjects')}
              className="w-full mt-4 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Manage Back Subjects
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Recent Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-lg mr-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                  <p className="text-sm text-gray-600">Latest fee collections</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/fees')}
                className="text-sm text-green-600 hover:text-green-700 flex items-center"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentPayments && recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payment.studentName}</p>
                        <p className="text-sm text-gray-600">{payment.feeType} • {formatDate(payment.paymentDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(payment.finalAmount)}</p>
                      <p className="text-xs text-gray-500">#{payment.receiptNo}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No recent payments</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500 rounded-lg mr-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Results</h3>
                  <p className="text-sm text-gray-600">Latest exam outcomes</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/results')}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentResults && recentResults.length > 0 ? (
                recentResults.map((result) => (
                  <div key={result._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{result.studentName}</p>
                        <p className="text-sm text-gray-600">{result.course} • Sem {result.semester}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        result.result === 'Pass' ? 'text-green-600' : 
                        result.result === 'Fail' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {result.percentage?.toFixed(1)}%
                      </p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        result.result === 'Pass' ? 'bg-green-100 text-green-700' : 
                        result.result === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {result.result}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No recent results</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Most used features</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/students/add')}
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left border border-blue-200"
            >
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Student</p>
                <p className="text-sm text-gray-600">Enroll new student</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/fees/add-payment')}
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left border border-green-200"
            >
              <div className="p-2 bg-green-500 rounded-lg mr-3">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Collect Fee</p>
                <p className="text-sm text-gray-600">Record payment</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/results/add')}
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left border border-purple-200"
            >
              <div className="p-2 bg-purple-500 rounded-lg mr-3">
                <BookOpenCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Result</p>
                <p className="text-sm text-gray-600">Publish exam result</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left border border-orange-200"
            >
              <div className="p-2 bg-orange-500 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Reports</p>
                <p className="text-sm text-gray-600">Analytics & insights</p>
              </div>
            </button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg mr-3">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
              <p className="text-sm text-gray-600">{getPeriodLabel(selectedPeriod)} overview</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Total Collection</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-700">
                {formatCurrency(stats?.collection?.total || 0)}
              </span>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Today's Collection</span>
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {formatCurrency(stats?.collection?.todaysCollection || 0)}
              </span>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Back Subject Revenue</span>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-orange-700">
                {formatCurrency((stats?.backSubjects?.total || 0) * 500)}
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Fee Structure</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.length > 0 ? (
                courses.map((course, index) => {
                  const colorClasses = [
                    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', subtext: 'text-blue-500' },
                    { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', subtext: 'text-green-500' },
                    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', subtext: 'text-purple-500' },
                    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', subtext: 'text-orange-500' },
                    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', subtext: 'text-indigo-500' }
                  ];
                  const colors = colorClasses[index % colorClasses.length];
                  
                  const totalFee = course.semesters && course.semesters.length > 0 
                    ? course.semesters.reduce((sum, sem) => sum + (sem.semesterFee || 0), 0)
                    : course.fee || 0;

                  return (
                    <div key={course._id} className={`${colors.bg} rounded-lg p-4 border ${colors.border} text-center`}>
                      <div className={`font-bold ${colors.text} text-lg`}>{course.name}</div>
                      <div className={`text-sm ${colors.subtext} font-medium`}>
                        {formatCurrency(totalFee)}
                      </div>
                      <div className={`text-xs ${colors.text} mt-1 opacity-70`}>per student</div>
                      {course.duration && (
                        <div className={`text-xs ${colors.text} mt-1 opacity-60`}>({course.duration})</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No courses configured yet</p>
                </div>
              )}
              
              {/* Back Subject Fee - Always show if any course exists */}
              {courses.length > 0 && courses.some(c => c.backSubjectFee > 0) && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                  <div className="font-bold text-red-600 text-lg">Back Subject</div>
                  <div className="text-sm text-red-500 font-medium">
                    {formatCurrency(courses.find(c => c.backSubjectFee)?.backSubjectFee || 500)}
                  </div>
                  <div className="text-xs text-red-600 mt-1 opacity-70">per subject</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;