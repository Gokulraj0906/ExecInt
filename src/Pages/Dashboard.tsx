// 'use client';

// import React, { useState, useEffect } from 'react';
// import {
//   BarChart3,
//   Bell,
//   Building2,
//   Calendar,
//   Clock,
//   LogOut,
//   Menu,
//   Search,
//   Settings,
//   Shield,
//   User,
//   Users,
//   X,
//   AlertTriangle,
//   CheckCircle2,
//   Loader,
//   RefreshCw,
//   Filter,
//   Download,
//   Eye,
//   MapPin,
//   Package,
//   Wrench,
//   CircuitBoard,
//   Activity,
// } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import { cn } from '@/lib/utils';

// interface UserData {
//   id: string;
//   email: string;
//   name: string;
//   role: string;
//   organizationId: string;
//   organization: {
//     name: string;
//   };
// }

// interface Factory {
//   id: string;
//   name: string;
//   location: string;
//   organizationId: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface Task {
//   id: string;
//   code: string;
//   title: string;
//   status: string;
//   estimatedTimeInMin: number;
// }

// interface WorkOrder {
//   id: string;
//   code: string;
//   priority: 'HIGH' | 'MEDIUM' | 'LOW';
//   dueDate: string;
//   factoryId: string;
//   status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
//   isAtRisk: boolean;
//   riskReason: string | null;
//   riskDetectedAt: string | null;
//   tasks: Task[];
//   assignments: any[];
// }

// interface Assignment {
//   id: string;
//   taskId: string;
//   resourceId: string;
//   workOrderId: string;
//   status: 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';
//   createdAt: string;
//   task: Task;
// }

// interface Resource {
//   id: string;
//   name: string;
//   code: string;
//   type: 'HUMAN' | 'MACHINE';
//   isActive: boolean;
//   factoryId: string;
//   availableFrom: string;
//   availableUntil: string | null;
//   assignments: Assignment[];
// }

// interface DashboardState {
//   user: UserData | null;
//   factories: Factory[];
//   workOrders: WorkOrder[];
//   atRiskOrders: WorkOrder[];
//   resources: Resource[];
//   allAssignments: Assignment[];
//   loading: boolean;
//   error: string | null;
//   activeTab: 'overview' | 'factories' | 'orders' | 'assignments' | 'resources';
// }

// const Dashboard: React.FC = () => {
//   const [state, setState] = useState<DashboardState>({
//     user: null,
//     factories: [],
//     workOrders: [],
//     atRiskOrders: [],
//     resources: [],
//     allAssignments: [],
//     loading: true,
//     error: null,
//     activeTab: 'overview',
//   });

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');

//   const baseUrl = 'https://ai-execution.onrender.com';
//   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));

//       const headers = {
//         'Content-Type': 'application/json',
//         ...(token && { Authorization: `Bearer ${token}` }),
//       };

//       // Fetch data with fallback
//       const fetchWithFallback = async (url: string, fallback: any = null) => {
//         try {
//           const res = await fetch(url, { headers });
//           if (!res.ok) return fallback;
//           const data = await res.json();
//           return data.success ? data.data : fallback;
//         } catch {
//           return fallback;
//         }
//       };

//       const [userData, factoriesData, workOrdersData, resourcesData] = await Promise.all([
//         fetchWithFallback(`${baseUrl}/api/auth/me`, null),
//         fetchWithFallback(`${baseUrl}/api/factories`, []),
//         fetchWithFallback(`${baseUrl}/api/work-orders`, []),
//         fetchWithFallback(`${baseUrl}/api/resources`, []),
//       ]);

//       // Process work orders
//       const atRiskOrders = (workOrdersData || []).filter((order: WorkOrder) => order.isAtRisk === true);

//       // Extract all assignments from resources
//       const allAssignments: Assignment[] = [];
//       (resourcesData || []).forEach((resource: Resource) => {
//         if (resource.assignments && resource.assignments.length > 0) {
//           allAssignments.push(...resource.assignments);
//         }
//       });

//       // Filter pending/approved assignments
//       const pendingAssignments = allAssignments.filter(
//         a => a.status === 'PENDING' || a.status === 'APPROVED'
//       );

//       setState(prev => ({
//         ...prev,
//         user: userData || {
//           id: '',
//           email: localStorage.getItem('userEmail') || '',
//           name: localStorage.getItem('userName') || 'User',
//           role: localStorage.getItem('userRole') || 'MANAGER',
//           organizationId: '',
//           organization: { name: 'Demo Factory Org' },
//         },
//         factories: factoriesData || [],
//         workOrders: workOrdersData || [],
//         atRiskOrders: atRiskOrders,
//         resources: resourcesData || [],
//         allAssignments: pendingAssignments,
//         loading: false,
//       }));
//     } catch (error) {
//       setState(prev => ({
//         ...prev,
//         error: error instanceof Error ? error.message : 'Failed to load dashboard',
//         loading: false,
//       }));
//     }
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await fetchDashboardData();
//     setRefreshing(false);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('userRole');
//     localStorage.removeItem('userEmail');
//     localStorage.removeItem('userName');
//     window.location.href = '/';
//   };

//   const getRoleIcon = (role: string) => {
//     switch (role?.toUpperCase()) {
//       case 'MANAGER':
//         return <Shield className="w-4 h-4" />;
//       case 'SUPERVISOR':
//         return <Users className="w-4 h-4" />;
//       case 'OPERATOR':
//         return <Package className="w-4 h-4" />;
//       default:
//         return <User className="w-4 h-4" />;
//     }
//   };

//   const getResourceIcon = (type: string) => {
//     switch (type?.toUpperCase()) {
//       case 'HUMAN':
//         return <User className="w-6 h-6" />;
//       case 'MACHINE':
//         return <Wrench className="w-6 h-6" />;
//       default:
//         return <CircuitBoard className="w-6 h-6" />;
//     }
//   };

//   const getRiskStatus = (isAtRisk: boolean) => {
//     if (isAtRisk) {
//       return { color: 'text-red-600 bg-red-50', label: 'AT RISK' };
//     }
//     return { color: 'text-green-600 bg-green-50', label: 'SAFE' };
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority?.toUpperCase()) {
//       case 'HIGH':
//         return 'from-red-500 to-pink-500';
//       case 'MEDIUM':
//         return 'from-yellow-500 to-orange-500';
//       case 'LOW':
//         return 'from-green-500 to-emerald-500';
//       default:
//         return 'from-blue-500 to-cyan-500';
//     }
//   };

//   const getResourceTypeColor = (type: string) => {
//     switch (type?.toUpperCase()) {
//       case 'HUMAN':
//         return 'from-blue-500 to-cyan-500';
//       case 'MACHINE':
//         return 'from-orange-500 to-red-500';
//       default:
//         return 'from-gray-500 to-slate-500';
//     }
//   };

//   // Get factory name by ID
//   const getFactoryName = (factoryId: string) => {
//     const factory = state.factories.find(f => f.id === factoryId);
//     return factory?.name || 'Unknown Factory';
//   };

//   // Get work order by ID
//   const getWorkOrder = (workOrderId: string) => {
//     return state.workOrders.find(wo => wo.id === workOrderId);
//   };

//   // Get resource by ID
//   const getResource = (resourceId: string) => {
//     return state.resources.find(r => r.id === resourceId);
//   };

//   const filteredFactories = state.factories.filter(f =>
//     f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     f.location.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredOrders = state.atRiskOrders.filter(o =>
//     o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     getFactoryName(o.factoryId).toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredAssignments = state.allAssignments.filter(a =>
//     a.task.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredResources = state.resources.filter(r =>
//     r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     r.type.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (state.loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block mb-4">
//             <Loader className="w-12 h-12 text-blue-400 animate-spin" />
//           </div>
//           <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h2>
//           <p className="text-slate-400">Please wait while we fetch your data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
//       {/* Animated Background */}
//       <div className="absolute inset-0 pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
//         <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
//       </div>

//       <div className="relative z-10 flex h-screen">
//         {/* Sidebar */}
//         <div
//           className={cn(
//             'fixed lg:static inset-y-0 left-0 w-64 bg-slate-900/95 backdrop-blur border-r border-slate-700/50 transition-all duration-300 z-40',
//             !sidebarOpen && '-translate-x-full lg:translate-x-0'
//           )}
//         >
//           {/* Logo */}
//           <div className="p-6 border-b border-slate-700/50">
//             <div className="flex items-center gap-3 animate-fadeIn">
//               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
//                 <Building2 className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-lg font-bold text-white">ExecINT</h1>
//                 <p className="text-xs text-slate-400">Dashboard</p>
//               </div>
//             </div>
//           </div>

//           {/* Navigation */}
//           <nav className="p-4 space-y-2">
//             {[
//               { id: 'overview', label: 'Overview', icon: BarChart3 },
//               { id: 'factories', label: 'Factories', icon: Building2 },
//               { id: 'orders', label: 'Work Orders', icon: AlertTriangle },
//               { id: 'resources', label: 'Resources', icon: Package },
//               { id: 'assignments', label: 'Assignments', icon: Users },
//             ].map((item, idx) => (
//               <button
//                 key={item.id}
//                 onClick={() => setState(prev => ({ ...prev, activeTab: item.id as any }))}
//                 className={cn(
//                   'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 animate-fadeInLeft',
//                   state.activeTab === item.id
//                     ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
//                     : 'text-slate-300 hover:bg-slate-800/50'
//                 )}
//                 style={{ animationDelay: `${idx * 50}ms` }}
//               >
//                 <item.icon className="w-5 h-5" />
//                 <span className="text-sm font-medium">{item.label}</span>
//               </button>
//             ))}
//           </nav>

//           {/* User Profile */}
//           <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/95 space-y-4">
//             {state.user && (
//               <div className="p-4 rounded-lg bg-slate-800/50 animate-fadeIn">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
//                     {getRoleIcon(state.user.role)}
//                   </div>
//                   <div>
//                     <p className="text-sm font-semibold text-white truncate">{state.user.name}</p>
//                     <p className="text-xs text-slate-400 capitalize">{state.user.role.toLowerCase()}</p>
//                   </div>
//                 </div>
//                 <p className="text-xs text-slate-400 truncate">{state.user.email}</p>
//               </div>
//             )}
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
//             >
//               <LogOut className="w-4 h-4" />
//               <span className="text-sm">Logout</span>
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           {/* Header */}
//           <div className="h-20 bg-slate-900/50 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-6 z-30">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
//               >
//                 {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
//               </button>
//               <div className="relative hidden md:block">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                 <Input
//                   placeholder="Search factories, orders, resources..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 h-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center gap-4">
//               <button
//                 onClick={handleRefresh}
//                 disabled={refreshing}
//                 className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
//               >
//                 <RefreshCw className={cn('w-5 h-5 text-slate-300', refreshing && 'animate-spin')} />
//               </button>
//               <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
//                 <Bell className="w-5 h-5 text-slate-300" />
//                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//               </button>
//               <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
//                 <Settings className="w-5 h-5 text-slate-300" />
//               </button>
//             </div>
//           </div>

//           {/* Content Area */}
//           <div className="flex-1 overflow-auto">
//             <div className="p-6 max-w-7xl mx-auto">
//               {state.error && (
//                 <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-slideDown">
//                   <AlertTriangle className="w-5 h-5 text-red-400" />
//                   <p className="text-red-400 text-sm">{state.error}</p>
//                 </div>
//               )}

//               {/* Overview Tab */}
//               {state.activeTab === 'overview' && (
//                 <div className="space-y-6 animate-fadeIn">
//                   {/* Stats Cards */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                     {[
//                       {
//                         label: 'Total Factories',
//                         value: state.factories.length,
//                         icon: Building2,
//                         color: 'from-blue-500 to-cyan-500',
//                       },
//                       {
//                         label: 'At Risk Orders',
//                         value: state.atRiskOrders.length,
//                         icon: AlertTriangle,
//                         color: 'from-red-500 to-pink-500',
//                       },
//                       {
//                         label: 'Active Assignments',
//                         value: state.allAssignments.length,
//                         icon: Users,
//                         color: 'from-purple-500 to-pink-500',
//                       },
//                       {
//                         label: 'Total Resources',
//                         value: state.resources.filter(r => r.isActive).length,
//                         icon: Package,
//                         color: 'from-green-500 to-emerald-500',
//                       },
//                     ].map((stat, idx) => (
//                       <div
//                         key={idx}
//                         className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 animate-slideUp cursor-pointer group"
//                         style={{ animationDelay: `${idx * 50}ms` }}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div>
//                             <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
//                             <p className="text-3xl font-bold text-white">{stat.value}</p>
//                           </div>
//                           <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white group-hover:shadow-lg transition-shadow`}>
//                             <stat.icon className="w-6 h-6" />
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Charts Section */}
//                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                     {/* Recent At-Risk Orders */}
//                     <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 animate-slideUp">
//                       <div className="flex items-center justify-between mb-4">
//                         <h3 className="font-semibold text-white flex items-center gap-2">
//                           <AlertTriangle className="w-5 h-5 text-red-400" />
//                           At-Risk Orders
//                         </h3>
//                         <button 
//                           onClick={() => setState(prev => ({ ...prev, activeTab: 'orders' }))}
//                           className="text-blue-400 hover:text-blue-300 text-sm"
//                         >
//                           View All
//                         </button>
//                       </div>
//                       <div className="space-y-3">
//                         {state.atRiskOrders.length === 0 ? (
//                           <p className="text-slate-400 text-sm text-center py-4">No at-risk orders</p>
//                         ) : (
//                           state.atRiskOrders.slice(0, 5).map((order, idx) => {
//                             const riskStatus = getRiskStatus(order.isAtRisk);
//                             return (
//                               <div
//                                 key={order.id}
//                                 className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group animate-fadeInUp"
//                                 style={{ animationDelay: `${idx * 50}ms` }}
//                               >
//                                 <div className="flex items-start justify-between">
//                                   <div className="flex-1">
//                                     <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
//                                       {order.code}
//                                     </p>
//                                     <p className="text-xs text-slate-400 mt-1">{getFactoryName(order.factoryId)}</p>
//                                   </div>
//                                   <span className={cn(
//                                     'px-2 py-1 rounded text-xs font-semibold',
//                                     riskStatus.color
//                                   )}>
//                                     {riskStatus.label}
//                                   </span>
//                                 </div>
//                               </div>
//                             );
//                           })
//                         )}
//                       </div>
//                     </div>

//                     {/* Active Assignments */}
//                     <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 animate-slideUp" style={{ animationDelay: '100ms' }}>
//                       <div className="flex items-center justify-between mb-4">
//                         <h3 className="font-semibold text-white flex items-center gap-2">
//                           <Users className="w-5 h-5 text-purple-400" />
//                           Active Assignments
//                         </h3>
//                         <button 
//                           onClick={() => setState(prev => ({ ...prev, activeTab: 'assignments' }))}
//                           className="text-blue-400 hover:text-blue-300 text-sm"
//                         >
//                           View All
//                         </button>
//                       </div>
//                       <div className="space-y-3">
//                         {state.allAssignments.length === 0 ? (
//                           <p className="text-slate-400 text-sm text-center py-4">No active assignments</p>
//                         ) : (
//                           state.allAssignments.slice(0, 5).map((assignment, idx) => {
//                             const resource = getResource(assignment.resourceId);
//                             return (
//                               <div
//                                 key={assignment.id}
//                                 className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group animate-fadeInUp"
//                                 style={{ animationDelay: `${idx * 50}ms` }}
//                               >
//                                 <div className="flex items-start justify-between">
//                                   <div className="flex-1">
//                                     <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
//                                       {assignment.task.title}
//                                     </p>
//                                     <p className="text-xs text-slate-400 mt-1">→ {resource?.name || 'Unknown Resource'}</p>
//                                   </div>
//                                   <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/20 text-purple-400">
//                                     {assignment.status}
//                                   </span>
//                                 </div>
//                               </div>
//                             );
//                           })
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Factories Tab */}
//               {state.activeTab === 'factories' && (
//                 <div className="animate-fadeIn">
//                   <div className="flex items-center justify-between mb-6">
//                     <h2 className="text-2xl font-bold text-white">Factories</h2>
//                     <div className="flex gap-2">
//                       <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
//                         <Filter className="w-4 h-4" />
//                         Filter
//                       </button>
//                       <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
//                         <Download className="w-4 h-4" />
//                         Export
//                       </button>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {filteredFactories.length === 0 ? (
//                       <p className="text-slate-400 text-center py-8 col-span-full">No factories found</p>
//                     ) : (
//                       filteredFactories.map((factory, idx) => {
//                         const workOrderCount = state.workOrders.filter(wo => wo.factoryId === factory.id).length;
//                         return (
//                           <div
//                             key={factory.id}
//                             className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 cursor-pointer group animate-slideUp"
//                             style={{ animationDelay: `${idx * 50}ms` }}
//                           >
//                             <div className="flex items-start justify-between mb-4">
//                               <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white group-hover:shadow-lg transition-shadow">
//                                 <Building2 className="w-6 h-6" />
//                               </div>
//                               <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
//                                 ACTIVE
//                               </span>
//                             </div>
//                             <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
//                               {factory.name}
//                             </h3>
//                             <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
//                               <MapPin className="w-4 h-4" />
//                               {factory.location}
//                             </div>
//                             <div className="pt-4 border-t border-slate-700/50">
//                               <p className="text-slate-400 text-sm">Work Orders</p>
//                               <p className="text-2xl font-bold text-white">{workOrderCount}</p>
//                             </div>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Work Orders Tab */}
//               {state.activeTab === 'orders' && (
//                 <div className="animate-fadeIn">
//                   <h2 className="text-2xl font-bold text-white mb-6">At-Risk Work Orders</h2>
//                   <div className="space-y-4">
//                     {filteredOrders.length === 0 ? (
//                       <p className="text-slate-400 text-center py-8">No at-risk work orders found</p>
//                     ) : (
//                       filteredOrders.map((order, idx) => {
//                         const riskStatus = getRiskStatus(order.isAtRisk);
//                         return (
//                           <div
//                             key={order.id}
//                             className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 group animate-slideUp"
//                             style={{ animationDelay: `${idx * 50}ms` }}
//                           >
//                             <div className="flex items-start justify-between">
//                               <div className="flex-1">
//                                 <div className="flex items-center gap-3 mb-2">
//                                   <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
//                                     {order.code}
//                                   </h3>
//                                   <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${getPriorityColor(order.priority)} text-white`}>
//                                     {order.priority}
//                                   </span>
//                                 </div>
//                                 <p className="text-slate-400 text-sm mb-3">{getFactoryName(order.factoryId)}</p>
//                                 <div className="flex items-center gap-4 text-sm">
//                                   <span className={cn('px-2 py-1 rounded', riskStatus.color)}>
//                                     {riskStatus.label}
//                                   </span>
//                                   <span className="text-slate-400 flex items-center gap-1">
//                                     <Calendar className="w-4 h-4" />
//                                     {new Date(order.dueDate).toLocaleDateString()}
//                                   </span>
//                                   <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
//                                     {order.status}
//                                   </span>
//                                 </div>
//                               </div>
//                               <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
//                                 <Eye className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
//                               </button>
//                             </div>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Resources Tab */}
//               {state.activeTab === 'resources' && (
//                 <div className="animate-fadeIn">
//                   <div className="flex items-center justify-between mb-6">
//                     <h2 className="text-2xl font-bold text-white">Resources</h2>
//                     <div className="flex gap-2">
//                       <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
//                         <Filter className="w-4 h-4" />
//                         Filter
//                       </button>
//                       <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
//                         <Download className="w-4 h-4" />
//                         Export
//                       </button>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {filteredResources.length === 0 ? (
//                       <p className="text-slate-400 text-center py-8 col-span-full">No resources found</p>
//                     ) : (
//                       filteredResources.map((resource, idx) => {
//                         const activeAssignments = resource.assignments.filter(
//                           a => a.status === 'PENDING' || a.status === 'APPROVED'
//                         ).length;
//                         const completedAssignments = resource.assignments.filter(
//                           a => a.status === 'COMPLETED'
//                         ).length;

//                         return (
//                           <div
//                             key={resource.id}
//                             className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 cursor-pointer group animate-slideUp"
//                             style={{ animationDelay: `${idx * 50}ms` }}
//                           >
//                             <div className="flex items-start justify-between mb-4">
//                               <div className={`p-3 rounded-lg bg-gradient-to-br ${getResourceTypeColor(resource.type)} text-white group-hover:shadow-lg transition-shadow`}>
//                                 {getResourceIcon(resource.type)}
//                               </div>
//                               <div className="flex flex-col gap-2 items-end">
//                                 <span className={cn(
//                                   'px-3 py-1 rounded-full text-xs font-semibold',
//                                   resource.isActive
//                                     ? 'bg-green-500/20 text-green-400'
//                                     : 'bg-red-500/20 text-red-400'
//                                 )}>
//                                   {resource.isActive ? 'ACTIVE' : 'INACTIVE'}
//                                 </span>
//                                 <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
//                                   {resource.type}
//                                 </span>
//                               </div>
//                             </div>

//                             <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
//                               {resource.name}
//                             </h3>
//                             <p className="text-slate-400 text-sm mb-4">Code: {resource.code}</p>

//                             <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
//                               <MapPin className="w-4 h-4" />
//                               {getFactoryName(resource.factoryId)}
//                             </div>

//                             <div className="pt-4 border-t border-slate-700/50 space-y-2">
//                               <div className="flex justify-between items-center">
//                                 <p className="text-slate-400 text-sm">Active Tasks</p>
//                                 <p className="text-lg font-bold text-blue-400">{activeAssignments}</p>
//                               </div>
//                               <div className="flex justify-between items-center">
//                                 <p className="text-slate-400 text-sm">Completed</p>
//                                 <p className="text-lg font-bold text-green-400">{completedAssignments}</p>
//                               </div>
//                               <div className="flex justify-between items-center">
//                                 <p className="text-slate-400 text-sm">Total Assignments</p>
//                                 <p className="text-lg font-bold text-white">{resource.assignments.length}</p>
//                               </div>
//                             </div>

//                             {resource.availableFrom && (
//                               <div className="mt-4 pt-4 border-t border-slate-700/50">
//                                 <p className="text-slate-400 text-xs flex items-center gap-1">
//                                   <Activity className="w-3 h-3" />
//                                   Available since: {new Date(resource.availableFrom).toLocaleDateString()}
//                                 </p>
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Assignments Tab */}
//               {state.activeTab === 'assignments' && (
//                 <div className="animate-fadeIn">
//                   <h2 className="text-2xl font-bold text-white mb-6">Active Assignments</h2>
//                   <div className="space-y-4">
//                     {filteredAssignments.length === 0 ? (
//                       <p className="text-slate-400 text-center py-8">No active assignments found</p>
//                     ) : (
//                       filteredAssignments.map((assignment, idx) => {
//                         const resource = getResource(assignment.resourceId);
//                         const workOrder = getWorkOrder(assignment.workOrderId);
//                         return (
//                           <div
//                             key={assignment.id}
//                             className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 group animate-slideUp"
//                             style={{ animationDelay: `${idx * 50}ms` }}
//                           >
//                             <div className="flex items-start justify-between">
//                               <div className="flex-1">
//                                 <div className="mb-2">
//                                   <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
//                                     {assignment.task.title} ({assignment.task.code})
//                                   </h3>
//                                   <p className="text-slate-400 text-sm">Assigned to: {resource?.name || 'Unknown'} ({resource?.type})</p>
//                                   {workOrder && (
//                                     <p className="text-slate-500 text-xs mt-1">Work Order: {workOrder.code}</p>
//                                   )}
//                                 </div>
//                                 <div className="flex items-center gap-4 text-sm mt-3">
//                                   <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">
//                                     {assignment.status}
//                                   </span>
//                                   <span className="text-slate-400 flex items-center gap-1">
//                                     <Clock className="w-4 h-4" />
//                                     {assignment.task.estimatedTimeInMin} min
//                                   </span>
//                                   <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
//                                     {assignment.task.status}
//                                   </span>
//                                 </div>
//                               </div>
//                               <div className="flex gap-2">
//                                 <button className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium">
//                                   <CheckCircle2 className="w-4 h-4" />
//                                 </button>
//                                 <button className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium">
//                                   <X className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* CSS Animations */}
//       <style>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes fadeInLeft {
//           from {
//             opacity: 0;
//             transform: translateX(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateX(0);
//           }
//         }

//         @keyframes slideUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes slideDown {
//           from {
//             opacity: 0;
//             transform: translateY(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes float {
//           0%, 100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(20px);
//           }
//         }

//         .animate-fadeIn {
//           animation: fadeIn 0.5s ease-out forwards;
//           opacity: 0;
//         }

//         .animate-fadeInUp {
//           animation: fadeInUp 0.5s ease-out forwards;
//           opacity: 0;
//         }

//         .animate-fadeInLeft {
//           animation: fadeInLeft 0.5s ease-out forwards;
//           opacity: 0;
//         }

//         .animate-slideUp {
//           animation: slideUp 0.5s ease-out forwards;
//           opacity: 0;
//         }

//         .animate-slideDown {
//           animation: slideDown 0.3s ease-out;
//         }

//         .animate-float {
//           animation: float 6s ease-in-out infinite;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Dashboard;









'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Clock,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  User,
  Users,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader,
  RefreshCw,
  Filter,
  Download,
  Eye,
  MapPin,
  Package,
  Wrench,
  CircuitBoard,
  Activity,
  Lock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
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

// Role-based access configuration
const ROLE_ACCESS = {
  MANAGER: ['overview', 'factories', 'orders', 'resources', 'assignments'],
  SUPERVISOR: ['overview', 'resources', 'assignments'],
  OPERATOR: ['overview', 'assignments'],
};

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

      // Fetch data with fallback
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

      // Process work orders
      const atRiskOrders = (workOrdersData || []).filter((order: WorkOrder) => order.isAtRisk === true);

      // Extract all assignments from resources
      const allAssignments: Assignment[] = [];
      (resourcesData || []).forEach((resource: Resource) => {
        if (resource.assignments && resource.assignments.length > 0) {
          allAssignments.push(...resource.assignments);
        }
      });

      // Filter pending/approved assignments
      const pendingAssignments = allAssignments.filter(
        a => a.status === 'PENDING' || a.status === 'APPROVED'
      );

      setState(prev => ({
        ...prev,
        user: userData || {
          id: '',
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || 'User',
          role: localStorage.getItem('userRole') || 'OPERATOR',
          organizationId: '',
          organization: { name: 'Demo Factory Org' },
        },
        factories: factoriesData || [],
        workOrders: workOrdersData || [],
        atRiskOrders: atRiskOrders,
        resources: resourcesData || [],
        allAssignments: pendingAssignments,
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
    window.location.href = '/auth';
  };

  // Check if user has access to a specific tab
  const hasAccess = (tab: string): boolean => {
    if (!state.user) return false;
    const userRole = state.user.role.toUpperCase() as keyof typeof ROLE_ACCESS;
    return ROLE_ACCESS[userRole]?.includes(tab) || false;
  };

  // Get accessible tabs for current user
  const getAccessibleTabs = () => {
    if (!state.user) return [];
    const userRole = state.user.role.toUpperCase() as keyof typeof ROLE_ACCESS;
    return ROLE_ACCESS[userRole] || [];
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'MANAGER':
        return <Shield className="w-4 h-4" />;
      case 'SUPERVISOR':
        return <Users className="w-4 h-4" />;
      case 'OPERATOR':
        return <Package className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'HUMAN':
        return <User className="w-6 h-6" />;
      case 'MACHINE':
        return <Wrench className="w-6 h-6" />;
      default:
        return <CircuitBoard className="w-6 h-6" />;
    }
  };

  const getRiskStatus = (isAtRisk: boolean) => {
    if (isAtRisk) {
      return { color: 'text-red-600 bg-red-50', label: 'AT RISK' };
    }
    return { color: 'text-green-600 bg-green-50', label: 'SAFE' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'from-red-500 to-pink-500';
      case 'MEDIUM':
        return 'from-yellow-500 to-orange-500';
      case 'LOW':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'HUMAN':
        return 'from-blue-500 to-cyan-500';
      case 'MACHINE':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  // Get factory name by ID
  const getFactoryName = (factoryId: string) => {
    const factory = state.factories.find(f => f.id === factoryId);
    return factory?.name || 'Unknown Factory';
  };

  // Get work order by ID
  const getWorkOrder = (workOrderId: string) => {
    return state.workOrders.find(wo => wo.id === workOrderId);
  };

  // Get resource by ID
  const getResource = (resourceId: string) => {
    return state.resources.find(r => r.id === resourceId);
  };

  const filteredFactories = state.factories.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = state.atRiskOrders.filter(o =>
    o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getFactoryName(o.factoryId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = state.allAssignments.filter(a =>
    a.task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = state.resources.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigation items with role-based visibility
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, roles: ['MANAGER', 'SUPERVISOR', 'OPERATOR'] },
    { id: 'factories', label: 'Factories', icon: Building2, roles: ['MANAGER'] },
    { id: 'orders', label: 'Work Orders', icon: AlertTriangle, roles: ['MANAGER'] },
    { id: 'resources', label: 'Resources', icon: Package, roles: ['MANAGER', 'SUPERVISOR'] },
    { id: 'assignments', label: 'Assignments', icon: Users, roles: ['MANAGER', 'SUPERVISOR', 'OPERATOR'] },
  ];

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <Loader className="w-12 h-12 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h2>
          <p className="text-slate-400">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div
          className={cn(
            'fixed lg:static inset-y-0 left-0 w-64 bg-slate-900/95 backdrop-blur border-r border-slate-700/50 transition-all duration-300 z-40',
            !sidebarOpen && '-translate-x-full lg:translate-x-0'
          )}
        >
          {/* Logo */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AI Execution</h1>
                <p className="text-xs text-slate-400">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navigationItems.map((item, idx) => {
              const isAccessible = hasAccess(item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isAccessible) {
                      setState(prev => ({ ...prev, activeTab: item.id as any }));
                    }
                  }}
                  disabled={!isAccessible}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 animate-fadeInLeft',
                    state.activeTab === item.id && isAccessible
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : isAccessible
                      ? 'text-slate-300 hover:bg-slate-800/50'
                      : 'text-slate-600 cursor-not-allowed opacity-50'
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  title={!isAccessible ? 'Access restricted' : ''}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  {!isAccessible && <Lock className="w-3 h-3" />}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/95 space-y-4">
            {state.user && (
              <div className="p-4 rounded-lg bg-slate-800/50 animate-fadeIn">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    {getRoleIcon(state.user.role)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{state.user.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{state.user.role.toLowerCase()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 truncate">{state.user.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-20 bg-slate-900/50 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search factories, orders, resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-5 h-5 text-slate-300', refreshing && 'animate-spin')} />
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-slate-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 max-w-7xl mx-auto">
              {state.error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-slideDown">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm">{state.error}</p>
                </div>
              )}

              {/* Access Denied Message */}
              {!hasAccess(state.activeTab) && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                  <p className="text-slate-400 text-center max-w-md">
                    You don't have permission to access this section. Your role ({state.user?.role}) only allows access to: {getAccessibleTabs().join(', ')}.
                  </p>
                </div>
              )}

              {/* Overview Tab */}
              {state.activeTab === 'overview' && hasAccess('overview') && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Total Factories',
                        value: state.factories.length,
                        icon: Building2,
                        color: 'from-blue-500 to-cyan-500',
                        show: hasAccess('factories'),
                      },
                      {
                        label: 'At Risk Orders',
                        value: state.atRiskOrders.length,
                        icon: AlertTriangle,
                        color: 'from-red-500 to-pink-500',
                        show: hasAccess('orders'),
                      },
                      {
                        label: 'Active Assignments',
                        value: state.allAssignments.length,
                        icon: Users,
                        color: 'from-purple-500 to-pink-500',
                        show: true,
                      },
                      {
                        label: 'Total Resources',
                        value: state.resources.filter(r => r.isActive).length,
                        icon: Package,
                        color: 'from-green-500 to-emerald-500',
                        show: hasAccess('resources'),
                      },
                    ]
                      .filter(stat => stat.show)
                      .map((stat, idx) => (
                        <div
                          key={idx}
                          className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 animate-slideUp cursor-pointer group"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                              <p className="text-3xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white group-hover:shadow-lg transition-shadow`}>
                              <stat.icon className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent At-Risk Orders - Only for Manager */}
                    {hasAccess('orders') && (
                      <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 animate-slideUp">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            At-Risk Orders
                          </h3>
                          <button 
                            onClick={() => setState(prev => ({ ...prev, activeTab: 'orders' }))}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View All
                          </button>
                        </div>
                        <div className="space-y-3">
                          {state.atRiskOrders.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4">No at-risk orders</p>
                          ) : (
                            state.atRiskOrders.slice(0, 5).map((order, idx) => {
                              const riskStatus = getRiskStatus(order.isAtRisk);
                              return (
                                <div
                                  key={order.id}
                                  className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group animate-fadeInUp"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                        {order.code}
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">{getFactoryName(order.factoryId)}</p>
                                    </div>
                                    <span className={cn(
                                      'px-2 py-1 rounded text-xs font-semibold',
                                      riskStatus.color
                                    )}>
                                      {riskStatus.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Assignments - For all roles */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 animate-slideUp" style={{ animationDelay: '100ms' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-400" />
                          Active Assignments
                        </h3>
                        <button 
                          onClick={() => setState(prev => ({ ...prev, activeTab: 'assignments' }))}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View All
                        </button>
                      </div>
                      <div className="space-y-3">
                        {state.allAssignments.length === 0 ? (
                          <p className="text-slate-400 text-sm text-center py-4">No active assignments</p>
                        ) : (
                          state.allAssignments.slice(0, 5).map((assignment, idx) => {
                            const resource = getResource(assignment.resourceId);
                            return (
                              <div
                                key={assignment.id}
                                className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group animate-fadeInUp"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                      {assignment.task.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">→ {resource?.name || 'Unknown Resource'}</p>
                                  </div>
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/20 text-purple-400">
                                    {assignment.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Factories Tab - Manager Only */}
              {state.activeTab === 'factories' && hasAccess('factories') && (
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Factories</h2>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFactories.length === 0 ? (
                      <p className="text-slate-400 text-center py-8 col-span-full">No factories found</p>
                    ) : (
                      filteredFactories.map((factory, idx) => {
                        const workOrderCount = state.workOrders.filter(wo => wo.factoryId === factory.id).length;
                        return (
                          <div
                            key={factory.id}
                            className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 cursor-pointer group animate-slideUp"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white group-hover:shadow-lg transition-shadow">
                                <Building2 className="w-6 h-6" />
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                                ACTIVE
                              </span>
                            </div>
                            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                              {factory.name}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                              <MapPin className="w-4 h-4" />
                              {factory.location}
                            </div>
                            <div className="pt-4 border-t border-slate-700/50">
                              <p className="text-slate-400 text-sm">Work Orders</p>
                              <p className="text-2xl font-bold text-white">{workOrderCount}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Work Orders Tab - Manager Only */}
              {state.activeTab === 'orders' && hasAccess('orders') && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-white mb-6">At-Risk Work Orders</h2>
                  <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No at-risk work orders found</p>
                    ) : (
                      filteredOrders.map((order, idx) => {
                        const riskStatus = getRiskStatus(order.isAtRisk);
                        return (
                          <div
                            key={order.id}
                            className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 group animate-slideUp"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {order.code}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${getPriorityColor(order.priority)} text-white`}>
                                    {order.priority}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-sm mb-3">{getFactoryName(order.factoryId)}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className={cn('px-2 py-1 rounded', riskStatus.color)}>
                                    {riskStatus.label}
                                  </span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(order.dueDate).toLocaleDateString()}
                                  </span>
                                  <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                                <Eye className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Resources Tab - Manager & Supervisor */}
              {state.activeTab === 'resources' && hasAccess('resources') && (
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Resources</h2>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-slate-800/50 text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.length === 0 ? (
                      <p className="text-slate-400 text-center py-8 col-span-full">No resources found</p>
                    ) : (
                      filteredResources.map((resource, idx) => {
                        const activeAssignments = resource.assignments.filter(
                          a => a.status === 'PENDING' || a.status === 'APPROVED'
                        ).length;
                        const completedAssignments = resource.assignments.filter(
                          a => a.status === 'COMPLETED'
                        ).length;

                        return (
                          <div
                            key={resource.id}
                            className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 cursor-pointer group animate-slideUp"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className={`p-3 rounded-lg bg-gradient-to-br ${getResourceTypeColor(resource.type)} text-white group-hover:shadow-lg transition-shadow`}>
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <span className={cn(
                                  'px-3 py-1 rounded-full text-xs font-semibold',
                                  resource.isActive
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                )}>
                                  {resource.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
                                  {resource.type}
                                </span>
                              </div>
                            </div>

                            <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                              {resource.name}
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">Code: {resource.code}</p>

                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                              <MapPin className="w-4 h-4" />
                              {getFactoryName(resource.factoryId)}
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="text-slate-400 text-sm">Active Tasks</p>
                                <p className="text-lg font-bold text-blue-400">{activeAssignments}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-slate-400 text-sm">Completed</p>
                                <p className="text-lg font-bold text-green-400">{completedAssignments}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-slate-400 text-sm">Total Assignments</p>
                                <p className="text-lg font-bold text-white">{resource.assignments.length}</p>
                              </div>
                            </div>

                            {resource.availableFrom && (
                              <div className="mt-4 pt-4 border-t border-slate-700/50">
                                <p className="text-slate-400 text-xs flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  Available since: {new Date(resource.availableFrom).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Assignments Tab - All Roles */}
              {state.activeTab === 'assignments' && hasAccess('assignments') && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-bold text-white mb-6">Active Assignments</h2>
                  <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No active assignments found</p>
                    ) : (
                      filteredAssignments.map((assignment, idx) => {
                        const resource = getResource(assignment.resourceId);
                        const workOrder = getWorkOrder(assignment.workOrderId);
                        return (
                          <div
                            key={assignment.id}
                            className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 group animate-slideUp"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2">
                                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                                    {assignment.task.title} ({assignment.task.code})
                                  </h3>
                                  <p className="text-slate-400 text-sm">Assigned to: {resource?.name || 'Unknown'} ({resource?.type})</p>
                                  {workOrder && (
                                    <p className="text-slate-500 text-xs mt-1">Work Order: {workOrder.code}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm mt-3">
                                  <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">
                                    {assignment.status}
                                  </span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {assignment.task.estimatedTimeInMin} min
                                  </span>
                                  <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
                                    {assignment.task.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;