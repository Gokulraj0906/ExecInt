import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
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
  CheckCircle2,
  Zap,
  Info,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Plus,
  X,
  AlertCircle,
  Lightbulb,
  RotateCw,
  Edit,
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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  estimatedTimeInMin: number;
  workOrderId?: string;
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
  assignments: Assignment[];
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
  suggestedAssignments: Assignment[];
  loading: boolean;
  error: string | null;
  activeTab: 'overview' | 'factories' | 'orders' | 'assignments' | 'resources' | 'tasks';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'alert' | 'success';
}

interface CreateWorkOrderForm {
  code: string;
  factoryId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
}

interface CreateTaskForm {
  code: string;
  title: string;
  estimatedTimeInMin: number;
  workOrderId: string;
}

interface CreateResourceForm {
  name: string;
  code: string;
  type: 'HUMAN' | 'MACHINE';
  factoryId: string;
}

// --- RBAC Configuration ---

const RBAC_CONFIG = {
  MANAGER: {
    allowedTabs: ['overview', 'factories', 'orders', 'assignments', 'resources', 'tasks'],
    canViewFactories: true,
    canViewOrders: true,
    canViewAssignments: true,
    canViewResources: true,
    canViewTasks: true,
    canCreateOrder: true,
    canCreateTask: true,
    canCreateResource: true,
    canApproveAssignment: true,
    canStartOrder: true,
    canCompleteOrder: true,
    canExport: true,
    canFilter: true,
    canSuggestAssignments: true,
    canReoptimize: true,
    description: 'Full system access',
  },
  SUPERVISOR: {
    allowedTabs: ['overview', 'assignments', 'resources', 'tasks'],
    canViewFactories: false,
    canViewOrders: false,
    canViewAssignments: true,
    canViewResources: true,
    canViewTasks: true,
    canCreateOrder: false,
    canCreateTask: true,
    canCreateResource: true,
    canApproveAssignment: true,
    canStartOrder: false,
    canCompleteOrder: false,
    canExport: true,
    canFilter: false,
    canSuggestAssignments: true,
    canReoptimize: true,
    description: 'Assignments and resource oversight',
  },
  OPERATOR: {
    allowedTabs: ['overview', 'assignments', 'tasks'],
    canViewFactories: false,
    canViewOrders: false,
    canViewAssignments: true,
    canViewResources: false,
    canViewTasks: true,
    canCreateOrder: false,
    canCreateTask: false,
    canCreateResource: false,
    canApproveAssignment: false,
    canStartOrder: false,
    canCompleteOrder: false,
    canExport: false,
    canFilter: false,
    canSuggestAssignments: false,
    canReoptimize: false,
    description: 'Task assignment view only',
  },
};

// --- Modal Component ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">{children}</div>
        {actions && <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">{actions}</div>}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    user: null,
    factories: [],
    workOrders: [],
    atRiskOrders: [],
    resources: [],
    allAssignments: [],
    suggestedAssignments: [],
    loading: true,
    error: null,
    activeTab: 'overview',
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Work Order Modal State
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [createOrderForm, setCreateOrderForm] = useState<CreateWorkOrderForm>({
    code: '',
    factoryId: '',
    priority: 'MEDIUM',
    dueDate: '',
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Task Modal State
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskForm>({
    code: '',
    title: '',
    estimatedTimeInMin: 60,
    workOrderId: '',
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState(false);

  // Resource Modal State
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [createResourceForm, setCreateResourceForm] = useState<CreateResourceForm>({
    name: '',
    code: '',
    type: 'HUMAN',
    factoryId: '',
  });
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [resourceSuccess, setResourceSuccess] = useState(false);

  // Action State
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Suggestion State
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [selectedWorkOrderForSuggestion, setSelectedWorkOrderForSuggestion] = useState<string | null>(null);

  // Mock Notifications
  const notifications: Notification[] = [
    { id: '1', title: 'System Update', message: 'Platform optimization complete.', time: '2m ago', type: 'success' },
    { id: '2', title: 'New Alert', message: 'High risk detected in Factory Alpha.', time: '15m ago', type: 'alert' },
    { id: '3', title: 'Shift Change', message: 'Morning shift ending soon.', time: '1h ago', type: 'info' },
  ];

  const notificationRef = useRef<HTMLDivElement>(null);

  const baseUrl = 'https://ai-execution.onrender.com';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // --- RBAC Logic ---
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'factories', label: 'Factories', icon: Building2 },
    { id: 'orders', label: 'Work Orders', icon: AlertTriangle },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'resources', label: 'Resources', icon: Package },
    { id: 'assignments', label: 'Assignments', icon: Users },
  ];

  const authorizedTabs = useMemo(() => {
    if (!state.user) return [];
    return RBAC_CONFIG[state.user.role].allowedTabs;
  }, [state.user?.role]);

  const visibleNavItems = navItems.filter(item => authorizedTabs.includes(item.id));

  useEffect(() => {
    if (!state.loading && state.user && !authorizedTabs.includes(state.activeTab)) {
      setState(prev => ({ ...prev, activeTab: 'overview' }));
    }
  }, [state.user, state.activeTab, authorizedTabs, state.loading]);

  useEffect(() => {
    fetchDashboardData();

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

      const [userData, factoriesData, workOrdersData, resourcesData, suggestedAssignmentsData] = await Promise.all([
        fetchWithFallback(`${baseUrl}/api/auth/me`, null),
        fetchWithFallback(`${baseUrl}/api/factories`, []),
        fetchWithFallback(`${baseUrl}/api/work-orders`, []),
        fetchWithFallback(`${baseUrl}/api/resources`, []),
        fetchWithFallback(`${baseUrl}/api/assignments/suggested`, []),
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
      const rbacConfig = RBAC_CONFIG[userRole as keyof typeof RBAC_CONFIG];
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
        suggestedAssignments: suggestedAssignmentsData || [],
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
    if (authorizedTabs.includes(tabId)) {
      setState(prev => ({ ...prev, activeTab: tabId as any }));
    }
  };

  // --- Work Order Endpoints ---

  const handleCreateWorkOrder = async () => {
    if (!createOrderForm.code.trim()) {
      setOrderError('Work Order Code is required');
      return;
    }
    if (!createOrderForm.factoryId) {
      setOrderError('Factory is required');
      return;
    }
    if (!createOrderForm.dueDate) {
      setOrderError('Due Date is required');
      return;
    }

    setOrderLoading(true);
    setOrderError(null);
    setOrderSuccess(false);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const dueDateObj = new Date(createOrderForm.dueDate);
      dueDateObj.setHours(18, 30, 0, 0);
      const isoDate = dueDateObj.toISOString();

      const response = await fetch(`${baseUrl}/api/work-orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: createOrderForm.code.trim(),
          factoryId: createOrderForm.factoryId,
          priority: createOrderForm.priority,
          dueDate: isoDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to create work order (${response.status})`);
      }

      if (result.success || response.status === 201) {
        setOrderSuccess(true);
        setCreateOrderForm({
          code: '',
          factoryId: '',
          priority: 'MEDIUM',
          dueDate: '',
        });

        setTimeout(() => {
          setShowCreateOrderModal(false);
          fetchDashboardData();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setOrderError(errorMsg);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleStartWorkOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/work-orders/${orderId}/start`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to start work order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteWorkOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/work-orders/${orderId}/complete`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to complete work order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckRisk = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/work-orders/${orderId}/check-risk`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Risk check result:', data);
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to check risk:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // --- Task Endpoints ---

  const handleCreateTask = async () => {
    if (!createTaskForm.code.trim()) {
      setTaskError('Task Code is required');
      return;
    }
    if (!createTaskForm.title.trim()) {
      setTaskError('Task Title is required');
      return;
    }
    if (!createTaskForm.workOrderId) {
      setTaskError('Work Order is required');
      return;
    }

    setTaskLoading(true);
    setTaskError(null);
    setTaskSuccess(false);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/tasks/workorder/${createTaskForm.workOrderId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: createTaskForm.code.trim(),
          title: createTaskForm.title.trim(),
          estimatedTimeInMin: createTaskForm.estimatedTimeInMin,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to create task (${response.status})`);
      }

      if (result.success || response.status === 201) {
        setTaskSuccess(true);
        setCreateTaskForm({
          code: '',
          title: '',
          estimatedTimeInMin: 60,
          workOrderId: '',
        });

        setTimeout(() => {
          setShowCreateTaskModal(false);
          fetchDashboardData();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setTaskError(errorMsg);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: 'start' | 'complete') => {
    setActionLoading(taskId);
    try {
      const endpoint = action === 'start' ? 'start' : 'complete';
      const response = await fetch(`${baseUrl}/api/tasks/${taskId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error(`Failed to ${action} task:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  // --- Resource Endpoints ---

  const handleCreateResource = async () => {
    if (!createResourceForm.name.trim()) {
      setResourceError('Resource Name is required');
      return;
    }
    if (!createResourceForm.code.trim()) {
      setResourceError('Resource Code is required');
      return;
    }
    if (!createResourceForm.factoryId) {
      setResourceError('Factory is required');
      return;
    }

    setResourceLoading(true);
    setResourceError(null);
    setResourceSuccess(false);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/resources/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: createResourceForm.name.trim(),
          code: createResourceForm.code.trim(),
          type: createResourceForm.type,
          factoryId: createResourceForm.factoryId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to create resource (${response.status})`);
      }

      if (result.success || response.status === 201) {
        setResourceSuccess(true);
        setCreateResourceForm({
          name: '',
          code: '',
          type: 'HUMAN',
          factoryId: '',
        });

        setTimeout(() => {
          setShowCreateResourceModal(false);
          fetchDashboardData();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setResourceError(errorMsg);
    } finally {
      setResourceLoading(false);
    }
  };

  // --- Assignment Endpoints ---

  const handleGetSuggestedAssignments = async () => {
    setActionLoading('suggestions');
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/assignments/suggested`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({
          ...prev,
          suggestedAssignments: result.success ? result.data : [],
        }));
        setShowSuggestionsModal(true);
      }
    } catch (error) {
      console.error('Failed to get suggested assignments:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuggestForWorkOrder = async (workOrderId: string) => {
    setActionLoading(workOrderId);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/assignments/${workOrderId}/suggest`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({
          ...prev,
          suggestedAssignments: result.success ? result.data : [],
        }));
        setSelectedWorkOrderForSuggestion(workOrderId);
        setShowSuggestionsModal(true);
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to suggest assignments for work order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReoptimize = async (workOrderId: string) => {
    setActionLoading(workOrderId);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${baseUrl}/api/assignments/${workOrderId}/reoptimize`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({
          ...prev,
          suggestedAssignments: result.success ? result.data : [],
        }));
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to reoptimize assignments:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignmentAction = async (assignmentId: string, action: 'approve' | 'reject' | 'complete' | 'start') => {
    setActionLoading(assignmentId);
    try {
      const response = await fetch(`${baseUrl}/api/assignments/${assignmentId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error(`Failed to ${action} assignment:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportReport = () => {
    const wb = XLSX.utils.book_new();

    const overviewData = [
      { Metric: 'Total Factories', Value: state.factories.length },
      { Metric: 'At Risk Orders', Value: state.atRiskOrders.length },
      { Metric: 'Active Assignments', Value: state.allAssignments.length },
      { Metric: 'Total Resources', Value: state.resources.length },
      { Metric: 'Active Resources', Value: state.resources.filter(r => r.isActive).length },
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    if (state.factories.length > 0 && authorizedTabs.includes('factories')) {
      const wsFactories = XLSX.utils.json_to_sheet(
        state.factories.map(f => ({
          ID: f.id,
          Name: f.name,
          Location: f.location,
          Created: new Date(f.createdAt).toLocaleDateString(),
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsFactories, 'Factories');
    }

    if (state.workOrders.length > 0 && authorizedTabs.includes('orders')) {
      const wsOrders = XLSX.utils.json_to_sheet(
        state.workOrders.map(o => ({
          Code: o.code,
          Status: o.status,
          Priority: o.priority,
          DueDate: new Date(o.dueDate).toLocaleDateString(),
          FactoryID: o.factoryId,
          IsAtRisk: o.isAtRisk ? 'Yes' : 'No',
          RiskReason: o.riskReason || '-',
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Work Orders');
    }

    if (state.resources.length > 0 && authorizedTabs.includes('resources')) {
      const wsResources = XLSX.utils.json_to_sheet(
        state.resources.map(r => ({
          Name: r.name,
          Code: r.code,
          Type: r.type,
          Status: r.isActive ? 'Active' : 'Inactive',
          FactoryID: r.factoryId,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsResources, 'Resources');
    }

    XLSX.writeFile(wb, `ExecInt_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Helpers ---

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'MANAGER':
        return <Shield className="w-4 h-4" />;
      case 'SUPERVISOR':
        return <Users className="w-4 h-4" />;
      case 'OPERATOR':
        return <Zap className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'HUMAN':
        return <User className="w-5 h-5" />;
      case 'MACHINE':
        return <Wrench className="w-5 h-5" />;
      default:
        return <CircuitBoard className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Pause className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFactoryName = (factoryId: string) =>
    state.factories.find(f => f.id === factoryId)?.name || 'Unknown Factory';
  const getResource = (resourceId: string) => state.resources.find(r => r.id === resourceId);

  // --- Filtering ---

  const filteredFactories = state.factories.filter(
    f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = state.workOrders.filter(
    o =>
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFactoryName(o.factoryId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = state.resources.filter(
    r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = state.allAssignments.filter(a =>
    a.task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allTasks = state.workOrders.flatMap(wo => wo.tasks || []);
  const filteredTasks = allTasks.filter(
    t =>
      t.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div
          className="absolute top-0 right-[-10%] w-[800px] h-[800px] bg-purple-300/40 rounded-full blur-[80px] animate-pulse"
          style={{ animationDuration: '6s' }}
        ></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-300/40 rounded-full blur-[80px] animate-pulse"
          style={{ animationDuration: '8s', animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-[40%] left-[30%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[60px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        ></div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white/70 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out flex flex-col',
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
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                state.activeTab === item.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  state.activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'
                )}
              />
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-purple-100/50">
          {state.user && sidebarOpen && (
            <div className="mb-4 p-3 rounded-2xl bg-white/50 border border-purple-100 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                {getRoleIcon(state.user.role)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{state.user.name}</p>
                <p className="text-[10px] text-purple-600 font-semibold truncate capitalize">
                  {state.user.role.toLowerCase()}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors group',
              !sidebarOpen && 'justify-center'
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
        <header className="h-20 bg-white/40 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm border-b border-white/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-purple-50 rounded-xl text-gray-500 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="text"
                placeholder="Search intelligence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/60 border border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-500/10 rounded-2xl text-sm w-72 transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative" ref={notificationRef}>
            <button
              onClick={handleRefresh}
              className={cn(
                'p-2.5 rounded-xl hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors',
                refreshing && 'animate-spin text-purple-600'
              )}
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={cn(
                'p-2.5 rounded-xl transition-all relative',
                notificationsOpen ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-gray-500 hover:text-purple-600'
              )}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white animate-pulse"></span>
            </button>

            {/* Notification Popover */}
            {notificationsOpen && (
              <div className="absolute top-16 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="flex gap-3 items-start p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          notif.type === 'alert'
                            ? 'bg-red-50 text-red-600'
                            : notif.type === 'success'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-blue-50 text-blue-600'
                        )}
                      >
                        {notif.type === 'alert' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : notif.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  {state.activeTab === 'tasks' && 'Task Management'}
                </h1>
                <p className="text-gray-500 mt-1 font-medium">
                  {state.activeTab === 'overview' && 'Real-time operational intelligence.'}
                  {state.activeTab === 'factories' && 'Manage your production facilities.'}
                  {state.activeTab === 'orders' && 'Track production progress and risks.'}
                  {state.activeTab === 'resources' && 'Monitor humans and machines.'}
                  {state.activeTab === 'assignments' && 'View active task distributions.'}
                  {state.activeTab === 'tasks' && 'Create, manage, and monitor tasks.'}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {state.activeTab !== 'overview' && (
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span>Filter</span>
                  </button>
                )}
                {state.user && RBAC_CONFIG[state.user.role].canSuggestAssignments && state.activeTab === 'assignments' && (
                  <button
                    onClick={handleGetSuggestedAssignments}
                    disabled={actionLoading === 'suggestions'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>{actionLoading === 'suggestions' ? 'Loading...' : 'Get Suggestions'}</span>
                  </button>
                )}
                {state.user && RBAC_CONFIG[state.user.role].canExport && (
                  <button
                    onClick={handleExportReport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#AD03DE] text-white shadow-lg shadow-purple-500/30 rounded-xl text-sm font-bold hover:bg-[#8f02b8] transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </button>
                )}
                {state.user && RBAC_CONFIG[state.user.role].canCreateTask && state.activeTab === 'tasks' && (
                  <button
                    onClick={() => {
                      setShowCreateTaskModal(true);
                      setTaskError(null);
                      setTaskSuccess(false);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white shadow-lg shadow-blue-500/30 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Task</span>
                  </button>
                )}
                {state.user && RBAC_CONFIG[state.user.role].canCreateOrder && state.activeTab === 'orders' && (
                  <button
                    onClick={() => {
                      setShowCreateOrderModal(true);
                      setOrderError(null);
                      setOrderSuccess(false);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white shadow-lg shadow-green-500/30 rounded-xl text-sm font-bold hover:bg-green-700 transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Order</span>
                  </button>
                )}
                {state.user && RBAC_CONFIG[state.user.role].canCreateResource && state.activeTab === 'resources' && (
                  <button
                    onClick={() => {
                      setShowCreateResourceModal(true);
                      setResourceError(null);
                      setResourceSuccess(false);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Resource</span>
                  </button>
                )}
              </div>
            </div>

            {/* === OVERVIEW TAB === */}
            {state.activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Total Factories',
                      value: state.factories.length,
                      icon: Building2,
                      color: 'text-purple-600',
                      bg: 'bg-purple-100',
                      trend: '+12%',
                      trendUp: true,
                    },
                    {
                      title: 'At Risk Orders',
                      value: state.atRiskOrders.length,
                      icon: AlertTriangle,
                      color: 'text-orange-600',
                      bg: 'bg-orange-100',
                      trend: state.atRiskOrders.length > 0 ? '+2' : '0',
                      trendUp: false,
                    },
                    {
                      title: 'Active Assignments',
                      value: state.allAssignments.length,
                      icon: Activity,
                      color: 'text-blue-600',
                      bg: 'bg-blue-100',
                      trend: '+8%',
                      trendUp: true,
                    },
                    {
                      title: 'Total Resources',
                      value: state.resources.filter(r => r.isActive).length,
                      icon: CircuitBoard,
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-100',
                      trend: 'Stable',
                      trendUp: true,
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn('p-3.5 rounded-2xl', stat.bg)}>
                          <stat.icon className={cn('w-6 h-6', stat.color)} />
                        </div>
                        <span
                          className={cn(
                            'text-[10px] uppercase font-bold px-2 py-1 rounded-full',
                            stat.trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          )}
                        >
                          {stat.trend}
                        </span>
                      </div>
                      <h3 className="text-gray-500 text-sm font-bold">{stat.title}</h3>
                      <p className="text-4xl font-extrabold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* At Risk Orders Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-transparent to-orange-50/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100/50 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Critical Attention Needed</h3>
                      </div>
                      {authorizedTabs.includes('orders') && (
                        <button
                          onClick={() => handleTabChange('orders')}
                          className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline"
                        >
                          View All
                        </button>
                      )}
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
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-1.5 h-10 bg-orange-500 rounded-full shadow-sm" />
                                <div>
                                  <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    {order.code}
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-white text-orange-700 border border-orange-200 uppercase">
                                      Risk
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {getFactoryName(order.factoryId)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border', getPriorityColor(order.priority))}>
                                  {order.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Assignments Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-transparent to-blue-50/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100/50 rounded-xl">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Live Assignments</h3>
                      </div>
                      {authorizedTabs.includes('assignments') && (
                        <button
                          onClick={() => handleTabChange('assignments')}
                          className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline"
                        >
                          View All
                        </button>
                      )}
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
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold text-sm ring-2 ring-white shadow-sm">
                                  {assignment.task.title.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm truncate max-w-[150px]">
                                    {assignment.task.title}
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">
                                    {getResource(assignment.resourceId)?.name || 'Unassigned'}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg',
                                  assignment.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                )}
                              >
                                {assignment.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* === WORK ORDERS TAB === */}
            {state.activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredOrders.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No work orders found</h3>
                    <p className="text-gray-500">Everything looks clear.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={cn(
                            'w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg',
                            order.isAtRisk ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                          )}
                        >
                          {order.isAtRisk ? <AlertTriangle className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                            {order.code}
                            <span className={cn('px-2.5 py-0.5 rounded-lg text-xs border uppercase tracking-wider', getPriorityColor(order.priority))}>
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
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
                          <p className="text-sm font-bold text-gray-900">{order.status}</p>
                        </div>
                        {state.user && order.status === 'PLANNED' && RBAC_CONFIG[state.user.role].canStartOrder && (
                          <button
                            onClick={() => handleStartWorkOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order.id ? '...' : 'Start'}
                          </button>
                        )}
                        {state.user && order.status === 'IN_PROGRESS' && RBAC_CONFIG[state.user.role].canCompleteOrder && (
                          <button
                            onClick={() => handleCompleteWorkOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order.id ? '...' : 'Complete'}
                          </button>
                        )}
                        {state.user && RBAC_CONFIG[state.user.role].canStartOrder && (
                          <button
                            onClick={() => handleCheckRisk(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order.id ? '...' : 'Check Risk'}
                          </button>
                        )}
                        {state.user && RBAC_CONFIG[state.user.role].canSuggestAssignments && (
                          <button
                            onClick={() => handleSuggestForWorkOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3" />
                            {actionLoading === order.id ? '...' : 'Suggest'}
                          </button>
                        )}
                        {state.user && RBAC_CONFIG[state.user.role].canReoptimize && order.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleReoptimize(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            {actionLoading === order.id ? '...' : 'Reoptimize'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* === TASKS TAB === */}
            {state.activeTab === 'tasks' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredTasks.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No tasks found</h3>
                    <p className="text-gray-500">Create a new task to get started.</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                          {getStatusIcon(task.status)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{task.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {task.estimatedTimeInMin} minutes estimated
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-bold uppercase',
                            task.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          {task.status}
                        </span>
                        {state.user && RBAC_CONFIG[state.user.role].canViewTasks && (
                          <>
                            {task.status === 'PENDING' && (
                              <button
                                onClick={() => handleTaskAction(task.id, 'start')}
                                disabled={actionLoading === task.id}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === task.id ? '...' : 'Start'}
                              </button>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleTaskAction(task.id, 'complete')}
                                disabled={actionLoading === task.id}
                                className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === task.id ? '...' : 'Complete'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* === RESOURCES TAB === */}
            {state.activeTab === 'resources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredResources.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <CircuitBoard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No resources found</h3>
                  </div>
                ) : (
                  filteredResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1"
                    >
                      <div className="relative mb-4">
                        <div
                          className={cn(
                            'w-20 h-20 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110',
                            resource.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {getResourceIcon(resource.type)}
                        </div>
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white',
                            resource.isActive ? 'bg-green-500' : 'bg-gray-400'
                          )}
                        />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{resource.name}</h3>
                      <p className="text-xs text-purple-500 font-semibold bg-purple-50 px-2 py-1 rounded-md mb-4">
                        {resource.code}
                      </p>

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
            )}

            {/* === ASSIGNMENTS TAB === */}
            {state.activeTab === 'assignments' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Task Info
                          </th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Assigned Resource
                          </th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
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
                                <span
                                  className={cn(
                                    'px-3 py-1 rounded-full text-xs font-bold uppercase',
                                    assignment.status === 'APPROVED'
                                      ? 'bg-green-100 text-green-700'
                                      : assignment.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : assignment.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-600'
                                  )}
                                >
                                  {assignment.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                {state.user && RBAC_CONFIG[state.user.role].canApproveAssignment && assignment.status === 'PENDING' && (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleAssignmentAction(assignment.id, 'approve')}
                                      disabled={actionLoading === assignment.id}
                                      className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === assignment.id ? '...' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleAssignmentAction(assignment.id, 'reject')}
                                      disabled={actionLoading === assignment.id}
                                      className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === assignment.id ? '...' : 'Reject'}
                                    </button>
                                  </div>
                                )}
                                {assignment.status === 'APPROVED' && (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleAssignmentAction(assignment.id, 'start')}
                                      disabled={actionLoading === assignment.id}
                                      className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === assignment.id ? '...' : 'Start'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* === FACTORIES TAB === */}
            {state.activeTab === 'factories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredFactories.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No factories found</h3>
                  </div>
                ) : (
                  filteredFactories.map((factory) => (
                    <div
                      key={factory.id}
                      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-[#AD03DE] group-hover:text-white transition-colors">
                          <Building2 className="w-8 h-8" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase">
                          Active
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{factory.name}</h3>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        {factory.location}
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase">Created</p>
                          <p className="text-sm font-bold text-gray-700">
                            {new Date(factory.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        title="Create New Work Order"
        actions={
          <>
            <button
              onClick={() => setShowCreateOrderModal(false)}
              disabled={orderLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWorkOrder}
              disabled={orderLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {orderLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {orderSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-sm text-green-700">Work order created successfully. Refreshing data...</p>
              </div>
            </div>
          )}

          {orderError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{orderError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Order Code *</label>
            <input
              type="text"
              placeholder="WO-1003"
              value={createOrderForm.code}
              onChange={(e) => setCreateOrderForm({ ...createOrderForm, code: e.target.value })}
              disabled={orderLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Factory *</label>
            <select
              value={createOrderForm.factoryId}
              onChange={(e) => setCreateOrderForm({ ...createOrderForm, factoryId: e.target.value })}
              disabled={orderLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            >
              <option value="">Select a factory</option>
              {state.factories.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
            <select
              value={createOrderForm.priority}
              onChange={(e) => setCreateOrderForm({ ...createOrderForm, priority: e.target.value as any })}
              disabled={orderLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
            <input
              type="date"
              value={createOrderForm.dueDate}
              onChange={(e) => setCreateOrderForm({ ...createOrderForm, dueDate: e.target.value })}
              disabled={orderLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>
        </div>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        title="Create New Task"
        actions={
          <>
            <button
              onClick={() => setShowCreateTaskModal(false)}
              disabled={taskLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={taskLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {taskLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {taskSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-sm text-green-700">Task created successfully. Refreshing data...</p>
              </div>
            </div>
          )}

          {taskError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{taskError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Order *</label>
            <select
              value={createTaskForm.workOrderId}
              onChange={(e) => setCreateTaskForm({ ...createTaskForm, workOrderId: e.target.value })}
              disabled={taskLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            >
              <option value="">Select a work order</option>
              {state.workOrders.map(wo => (
                <option key={wo.id} value={wo.id}>{wo.code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Code *</label>
            <input
              type="text"
              placeholder="TASK-001"
              value={createTaskForm.code}
              onChange={(e) => setCreateTaskForm({ ...createTaskForm, code: e.target.value })}
              disabled={taskLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
            <input
              type="text"
              placeholder="Assembly"
              value={createTaskForm.title}
              onChange={(e) => setCreateTaskForm({ ...createTaskForm, title: e.target.value })}
              disabled={taskLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Time (minutes)</label>
            <input
              type="number"
              value={createTaskForm.estimatedTimeInMin}
              onChange={(e) => setCreateTaskForm({ ...createTaskForm, estimatedTimeInMin: parseInt(e.target.value) })}
              disabled={taskLoading}
              min="1"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>
        </div>
      </Modal>

      {/* Create Resource Modal */}
      <Modal
        isOpen={showCreateResourceModal}
        onClose={() => setShowCreateResourceModal(false)}
        title="Add New Resource"
        actions={
          <>
            <button
              onClick={() => setShowCreateResourceModal(false)}
              disabled={resourceLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateResource}
              disabled={resourceLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resourceLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {resourceSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-sm text-green-700">Resource created successfully. Refreshing data...</p>
              </div>
            </div>
          )}

          {resourceError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{resourceError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Name *</label>
            <input
              type="text"
              placeholder="Operator A"
              value={createResourceForm.name}
              onChange={(e) => setCreateResourceForm({ ...createResourceForm, name: e.target.value })}
              disabled={resourceLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Code *</label>
            <input
              type="text"
              placeholder="opA123"
              value={createResourceForm.code}
              onChange={(e) => setCreateResourceForm({ ...createResourceForm, code: e.target.value })}
              disabled={resourceLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              value={createResourceForm.type}
              onChange={(e) => setCreateResourceForm({ ...createResourceForm, type: e.target.value as any })}
              disabled={resourceLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            >
              <option value="HUMAN">HUMAN</option>
              <option value="MACHINE">MACHINE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Factory *</label>
            <select
              value={createResourceForm.factoryId}
              onChange={(e) => setCreateResourceForm({ ...createResourceForm, factoryId: e.target.value })}
              disabled={resourceLoading}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition disabled:opacity-50"
            >
              <option value="">Select a factory</option>
              {state.factories.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Assignment Suggestions Modal */}
      <Modal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        title="Assignment Suggestions"
      >
        <div className="space-y-4">
          {state.suggestedAssignments.length === 0 ? (
            <div className="py-12 text-center">
              <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No suggestions available</p>
              <p className="text-sm text-gray-400 mt-1">Try creating some tasks first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.suggestedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 text-sm">{assignment.task.title}</p>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">
                      Suggested
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{getResource(assignment.resourceId)?.name || 'Unknown Resource'}</span>
                  </div>
                  {state.user && RBAC_CONFIG[state.user.role].canApproveAssignment && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          handleAssignmentAction(assignment.id, 'approve');
                          setShowSuggestionsModal(false);
                        }}
                        disabled={actionLoading === assignment.id}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === assignment.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => {
                          handleAssignmentAction(assignment.id, 'reject');
                          setShowSuggestionsModal(false);
                        }}
                        disabled={actionLoading === assignment.id}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === assignment.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;