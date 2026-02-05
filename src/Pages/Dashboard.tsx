import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  LogOut,
  Menu,
  Search,
  Shield,
  User,
  Users,
  AlertTriangle,
  Loader,
  RefreshCw,
  Filter,
  Download,
  MapPin,
  Package,
  Wrench,
  CircuitBoard,
  Activity,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Zap,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces ---

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'SUPERVISOR' | 'OPERATOR';
  organizationId: string;
  organization: {
    name: string;
  };
}

interface Factory {
  id: string;
  name: string;
  location: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  code: string;
  title: string;
  status: string;
  estimatedTimeInMin: number;
}

interface WorkOrder {
  id: string;
  code: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  factoryId: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  isAtRisk: boolean;
  riskReason: string | null;
  riskDetectedAt: string | null;
  tasks: Task[];
  assignments: any[];
}

interface Assignment {
  id: string;
  taskId: string;
  resourceId: string;
  workOrderId: string;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  task: Task;
}

interface Resource {
  id: string;
  name: string;
  code: string;
  type: 'HUMAN' | 'MACHINE';
  isActive: boolean;
  factoryId: string;
  availableFrom: string;
  availableUntil: string | null;
  assignments: Assignment[];
}

interface DashboardState {
  user: UserData | null;
  factories: Factory[];
  workOrders: WorkOrder[];
  atRiskOrders: WorkOrder[];
  resources: Resource[];
  allAssignments: Assignment[];
  loading: boolean;
  error: string | null;
  activeTab: 'overview' | 'factories' | 'orders' | 'assignments' | 'resources';
}

// --- RBAC Configuration ---

const RBAC_CONFIG = {
  MANAGER: {
    allowedTabs: ['overview', 'factories', 'orders', 'assignments', 'resources'],
    canViewFactories: true,
    canViewOrders: true,
    canViewAssignments: true,
    canViewResources: true,
    canExport: true,
    canFilter: true,
    description: 'Full system access',
  },
  SUPERVISOR: {
    allowedTabs: ['overview', 'assignments', 'resources'],
    canViewFactories: false,
    canViewOrders: false,
    canViewAssignments: true,
    canViewResources: true,
    canExport: true,
    canFilter: false,
    description: 'Assignments and resource oversight',
  },
  OPERATOR: {
    allowedTabs: ['overview', 'assignments'],
    canViewFactories: false,
    canViewOrders: false,
    canViewAssignments: true,
    canViewResources: false,
    canExport: false,
    canFilter: false,
    description: 'Task assignment view only',
  },
};

// --- Components ---

interface RestrictedTabProps {
  role: string;
  requiredPermission: keyof typeof RBAC_CONFIG['MANAGER'];
}

const RestrictedTab: React.FC<RestrictedTabProps> = ({ role, requiredPermission }) => {
  const config = RBAC_CONFIG[role as keyof typeof RBAC_CONFIG] || RBAC_CONFIG.OPERATOR;
  const isAllowed = config[requiredPermission];

  if (!isAllowed) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-500 mb-4">
            Your role ({role}) doesn't have permission to access this section.
          </p>
          <p className="text-sm text-gray-400">Available: {config.description}</p>
        </div>
      </div>
    );
  }

  return null;
};

// --- Main Component ---

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    user: null,
    factories: [],
    workOrders: [],
    atRiskOrders: [],
    resources: [],
    allAssignments: [],
    loading: true,
    error: null,
    activeTab: 'overview',
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const baseUrl = 'https://ai-execution.onrender.com';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const fetchWithFallback = async (url: string, fallback: any = null) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return fallback;
          const data = await res.json();
          return data.success ? data.data : fallback;
        } catch {
          return fallback;
        }
      };

      const [userData, factoriesData, workOrdersData, resourcesData] = await Promise.all([
        fetchWithFallback(`${baseUrl}/api/auth/me`, null),
        fetchWithFallback(`${baseUrl}/api/factories`, []),
        fetchWithFallback(`${baseUrl}/api/work-orders`, []),
        fetchWithFallback(`${baseUrl}/api/resources`, []),
      ]);

      const atRiskOrders = (workOrdersData || []).filter((order: WorkOrder) => order.isAtRisk === true);

      const allAssignments: Assignment[] = [];
      (resourcesData || []).forEach((resource: Resource) => {
        if (resource.assignments && resource.assignments.length > 0) {
          allAssignments.push(...resource.assignments);
        }
      });

      const pendingAssignments = allAssignments.filter(
        a => a.status === 'PENDING' || a.status === 'APPROVED'
      );

      const userRole = userData?.role || localStorage.getItem('userRole') || 'OPERATOR';
      const rbacConfig = RBAC_CONFIG[userRole as keyof typeof RBAC_CONFIG] || RBAC_CONFIG.OPERATOR;
      const defaultTab = rbacConfig.allowedTabs[0] as any;

      setState(prev => ({
        ...prev,
        user: userData || {
          id: '',
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || 'User',
          role: userRole as any,
          organizationId: '',
          organization: { name: 'Demo Factory Org' },
        },
        factories: factoriesData || [],
        workOrders: workOrdersData || [],
        atRiskOrders: atRiskOrders,
        resources: resourcesData || [],
        allAssignments: pendingAssignments,
        activeTab: defaultTab,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
        loading: false,
      }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  const handleTabChange = (tabId: string) => {
    if (!state.user) return;
    const rbacConfig = RBAC_CONFIG[state.user.role];
    if (rbacConfig.allowedTabs.includes(tabId)) {
      setState(prev => ({ ...prev, activeTab: tabId as any }));
    }
  };

  // --- Helpers ---

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'MANAGER': return <Shield className="w-4 h-4" />;
      case 'SUPERVISOR': return <Users className="w-4 h-4" />;
      case 'OPERATOR': return <Zap className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'HUMAN': return <User className="w-5 h-5" />;
      case 'MACHINE': return <Wrench className="w-5 h-5" />;
      default: return <CircuitBoard className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getFactoryName = (factoryId: string) => state.factories.find(f => f.id === factoryId)?.name || 'Unknown Factory';
  const getResource = (resourceId: string) => state.resources.find(r => r.id === resourceId);

  const getAvailableTabs = () => {
    if (!state.user) return [];
    return RBAC_CONFIG[state.user.role].allowedTabs;
  };

  const isTabAllowed = (tabId: string) => {
    if (!state.user) return false;
    return RBAC_CONFIG[state.user.role].allowedTabs.includes(tabId);
  };

  // --- Filtering ---

  const filteredFactories = state.factories.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = state.activeTab === 'orders'
    ? state.workOrders.filter(o =>
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFactoryName(o.factoryId).toLowerCase().includes(searchQuery.toLowerCase())
    )
    : state.atRiskOrders.filter(o =>
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFactoryName(o.factoryId).toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredResources = state.resources.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = state.allAssignments.filter(a =>
    a.task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (state.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Loading Intelligence...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-[-10%] w-[800px] h-[800px] bg-purple-200/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-200/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out flex flex-col',
          !sidebarOpen && '-translate-x-full lg:translate-x-0 lg:w-24'
        )}
      >
        <div className="h-24 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 w-full">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#AD03DE] to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="font-bold text-gray-900 text-lg tracking-tight">EXECINT</h1>
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Enterprise OS</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: BarChart3 },
            { id: 'factories', label: 'Factories', icon: Building2 },
            { id: 'orders', label: 'Work Orders', icon: AlertTriangle },
            { id: 'resources', label: 'Resources', icon: Package },
            { id: 'assignments', label: 'Assignments', icon: Users },
          ].map((item) => {
            const isAllowed = isTabAllowed(item.id);
            return (
              <button
                key={item.id}
                onClick={() => isAllowed && handleTabChange(item.id)}
                disabled={!isAllowed}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                  !isAllowed && 'opacity-40 cursor-not-allowed',
                  state.activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
                )}
                title={!isAllowed ? `Not available for ${state.user?.role}` : ''}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", state.activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-purple-600")} />
                {sidebarOpen && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                    {!isAllowed && <Lock className="w-3 h-3 text-gray-400 ml-auto" />}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-purple-100/50">
          {state.user && sidebarOpen && (
            <div className="mb-4 p-3 rounded-2xl bg-white/50 border border-purple-100 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                {getRoleIcon(state.user.role)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{state.user.name}</p>
                <p className="text-[10px] text-purple-600 font-semibold truncate capitalize">{state.user.role.toLowerCase()}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors group",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/40 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-purple-50 rounded-xl text-gray-500 lg:hidden transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="text"
                placeholder="Search intelligence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/50 border border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-500/10 rounded-2xl text-sm w-72 transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className={cn("p-2.5 rounded-xl hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors", refreshing && "animate-spin text-purple-600")}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">

            {/* Header Text */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {state.activeTab === 'overview' && 'Overview'}
                  {state.activeTab === 'factories' && 'Smart Factories'}
                  {state.activeTab === 'orders' && 'Work Orders'}
                  {state.activeTab === 'resources' && 'Connected Resources'}
                  {state.activeTab === 'assignments' && 'Task Assignments'}
                </h1>
                <p className="text-gray-500 mt-1 font-medium">
                  {state.activeTab === 'overview' && 'Real-time operational intelligence.'}
                  {state.activeTab === 'factories' && 'Manage your production facilities.'}
                  {state.activeTab === 'orders' && 'Track production progress and risks.'}
                  {state.activeTab === 'resources' && 'Monitor humans and machines.'}
                  {state.activeTab === 'assignments' && 'View active task distributions.'}
                </p>
              </div>
              <div className="flex gap-3">
                {state.activeTab !== 'overview' && state.user && RBAC_CONFIG[state.user.role].canFilter && (
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span>Filter</span>
                  </button>
                )}
                {state.user && RBAC_CONFIG[state.user.role].canExport && (
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#AD03DE] text-white shadow-lg shadow-purple-500/30 rounded-xl text-sm font-bold hover:bg-[#8f02b8] transition-all hover:-translate-y-0.5">
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* === OVERVIEW TAB === */}
            {state.activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Total Factories', value: state.factories.length, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+12%', trendUp: true, rbacKey: 'canViewFactories' },
                    { title: 'At Risk Orders', value: state.atRiskOrders.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', trend: state.atRiskOrders.length > 0 ? '+2' : '0', trendUp: false, rbacKey: 'canViewOrders' },
                    { title: 'Active Assignments', value: state.allAssignments.length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+8%', trendUp: true, rbacKey: 'canViewAssignments' },
                    { title: 'Total Resources', value: state.resources.filter(r => r.isActive).length, icon: CircuitBoard, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: 'Stable', trendUp: true, rbacKey: 'canViewResources' }
                  ].map((stat, idx) => {
                    const isVisible = state.user ? RBAC_CONFIG[state.user.role][stat.rbacKey as keyof typeof RBAC_CONFIG['MANAGER']] : false;
                    
                    if (!isVisible) return null;

                    return (
                      <div
                        key={idx}
                        className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-3.5 rounded-2xl", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                          </div>
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                            stat.trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>
                            {stat.trend}
                          </span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-bold">{stat.title}</h3>
                        <p className="text-4xl font-extrabold text-gray-900 mt-2">{stat.value}</p>

                        <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl", stat.bg.replace('bg-', 'bg-'))} />
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* At Risk Orders Card */}
                  {state.user && RBAC_CONFIG[state.user.role].canViewOrders && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-transparent to-orange-50/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100/50 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          </div>
                          <h3 className="font-bold text-gray-900">Critical Attention Needed</h3>
                        </div>
                        <button onClick={() => handleTabChange('orders')} className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline">View All</button>
                      </div>
                      <div className="p-4 flex-1">
                        {state.atRiskOrders.length === 0 ? (
                          <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <CheckCircle2 className="w-10 h-10 mb-3 text-green-500" />
                            <p className="font-medium">All operations normal</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {state.atRiskOrders.slice(0, 5).map(order => (
                              <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 transition-all group cursor-pointer">
                                <div className="flex items-center gap-4">
                                  <div className="w-1.5 h-10 bg-orange-500 rounded-full shadow-sm" />
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                      {order.code}
                                      <span className="px-2 py-0.5 rounded text-[10px] bg-white text-orange-700 border border-orange-200 uppercase">Risk</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {getFactoryName(order.factoryId)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", getPriorityColor(order.priority))}>
                                    {order.priority}
                                  </span>
                                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Assignments Card */}
                  {state.user && RBAC_CONFIG[state.user.role].canViewAssignments && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-transparent to-blue-50/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100/50 rounded-xl">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-gray-900">Live Assignments</h3>
                        </div>
                        <button onClick={() => handleTabChange('assignments')} className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline">View All</button>
                      </div>
                      <div className="p-4 flex-1">
                        {state.allAssignments.length === 0 ? (
                          <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <Activity className="w-10 h-10 mb-3" />
                            <p className="font-medium">No active assignments</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {state.allAssignments.slice(0, 5).map(assignment => (
                              <div key={assignment.id} className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold text-sm ring-2 ring-white shadow-sm">
                                    {assignment.task.title.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{assignment.task.title}</p>
                                    <p className="text-xs text-gray-500 font-medium">
                                      {getResource(assignment.resourceId)?.name || 'Unassigned'}
                                    </p>
                                  </div>
                                </div>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg",
                                  assignment.status === 'APPROVED' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                  {assignment.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === FACTORIES TAB === */}
            {state.activeTab === 'factories' && (
              state.user && RBAC_CONFIG[state.user.role].canViewFactories ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {filteredFactories.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">No factories found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria.</p>
                    </div>
                  ) : (
                    filteredFactories.map((factory) => (
                      <div key={factory.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all group cursor-pointer hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-[#AD03DE] group-hover:text-white transition-colors">
                            <Building2 className="w-8 h-8" />
                          </div>
                          <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider">Active</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{factory.name}</h3>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          {factory.location}
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">Created</p>
                            <p className="text-sm font-bold text-gray-700">{new Date(factory.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-[#AD03DE] transition-colors">
                            <ArrowUpRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <RestrictedTab role={state.user?.role || 'OPERATOR'} requiredPermission="canViewFactories" />
              )
            )}

            {/* === WORK ORDERS TAB === */}
            {state.activeTab === 'orders' && (
              state.user && RBAC_CONFIG[state.user.role].canViewOrders ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">No work orders found</h3>
                      <p className="text-gray-500">Everything looks clear.</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg",
                            order.isAtRisk ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {order.isAtRisk ? <AlertTriangle className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                              {order.code}
                              <span className={cn("px-2.5 py-0.5 rounded-lg text-xs border uppercase tracking-wider", getPriorityColor(order.priority))}>
                                {order.priority}
                              </span>
                            </h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                {getFactoryName(order.factoryId)}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Due: {new Date(order.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
                            <p className="text-sm font-bold text-gray-900">{order.status}</p>
                          </div>
                          <div className="h-10 w-px bg-gray-100 hidden md:block" />
                          <button className="px-4 py-2 rounded-xl bg-purple-50 text-[#AD03DE] font-bold text-sm hover:bg-[#AD03DE] hover:text-white transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <RestrictedTab role={state.user?.role || 'OPERATOR'} requiredPermission="canViewOrders" />
              )
            )}

            {/* === RESOURCES TAB === */}
            {state.activeTab === 'resources' && (
              state.user && RBAC_CONFIG[state.user.role].canViewResources ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {filteredResources.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                      <CircuitBoard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">No resources found</h3>
                    </div>
                  ) : (
                    filteredResources.map((resource) => (
                      <div key={resource.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center group">
                        <div className="relative mb-4">
                          <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                            resource.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                          )}>
                            {getResourceIcon(resource.type)}
                          </div>
                          <span className={cn(
                            "absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white",
                            resource.isActive ? "bg-green-500" : "bg-gray-400"
                          )} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{resource.name}</h3>
                        <p className="text-xs text-purple-500 font-semibold bg-purple-50 px-2 py-1 rounded-md mb-4">{resource.code}</p>

                        <div className="w-full grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-xs text-gray-400">Assignments</p>
                            <p className="text-lg font-bold text-gray-900">{resource.assignments.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Type</p>
                            <p className="text-sm font-bold text-gray-900 capitalize">{resource.type.toLowerCase()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <RestrictedTab role={state.user?.role || 'OPERATOR'} requiredPermission="canViewResources" />
              )
            )}

            {/* === ASSIGNMENTS TAB === */}
            {state.activeTab === 'assignments' && (
              state.user && RBAC_CONFIG[state.user.role].canViewAssignments ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Task Info</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Resource</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAssignments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center text-gray-500">
                              No assignments found
                            </td>
                          </tr>
                        ) : (
                          filteredAssignments.map((assignment) => (
                            <tr key={assignment.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                    {assignment.task.title.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm">{assignment.task.title}</p>
                                    <p className="text-xs text-gray-400">ID: {assignment.taskId.substring(0, 8)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {getResource(assignment.resourceId)?.name || 'Unknown'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                  assignment.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                    assignment.status === 'PENDING' ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                                )}>
                                  {assignment.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button className="text-gray-400 hover:text-purple-600 transition-colors">
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <RestrictedTab role={state.user?.role || 'OPERATOR'} requiredPermission="canViewAssignments" />
              )
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;