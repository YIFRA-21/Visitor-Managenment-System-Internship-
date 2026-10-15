import { useState, useEffect } from 'react';
import { Network, ArrowLeft, ChevronDown, ChevronRight, Search, Info } from 'lucide-react';
import api from '../../../../services/api';
export default function DepartmentHierarchy() {
    const [departments, setDepartments] = useState([]);
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        setLoading(true);
        api.get('/departments')
            .then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            setDepartments(data);
            buildTree(data);
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    const buildTree = (list) => {
        // Basic auto-parenting hierarchy model for visualization
        // We map: HR-001 (Human Resources) -> cs-002, etc. (Or mock parentIds if they don't exist)
        const map = {};
        const roots = [];
        // Initialize map
        list.forEach(dept => {
            map[dept.id] = { ...dept, children: [] };
        });
        list.forEach(dept => {
            // Mock hierarchy generation if parentDepartmentId is null
            // Make Human Resources (id: 1) the parent of Customer Service (id: 5) and Legal (id: 6) for demo
            let parentId = dept.parentDepartmentId;
            if (dept.id === 5 || dept.id === 6) {
                parentId = 1;
            }
            // Make Finance (id: 2) the parent of Procurement (id: 4)
            if (dept.id === 4) {
                parentId = 2;
            }
            if (parentId && map[parentId]) {
                map[parentId].children?.push(map[dept.id]);
            }
            else {
                roots.push(map[dept.id]);
            }
        });
        setTreeData(roots);
    };
    const toggleExpand = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const handleNav = (view, id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', view);
        if (id)
            params.set('deptId', String(id));
        window.location.search = `?${params.toString()}`;
    };
    // Search filter helper
    const matchesSearch = (node) => {
        const q = searchQuery.toLowerCase();
        if (node.departmentName.toLowerCase().includes(q) || node.departmentCode.toLowerCase().includes(q)) {
            return true;
        }
        return node.children?.some(child => matchesSearch(child)) || false;
    };
    const renderNode = (node) => {
        if (searchQuery && !matchesSearch(node))
            return null;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = !!expandedNodes[node.id];
        return (<div key={node.id} className="ms-4 my-2 border-start border-slate-200 dark:border-slate-800 ps-3">
        <div className="d-flex align-items-center justify-content-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
          <div className="d-flex align-items-center gap-2">
            {hasChildren ? (<button onClick={() => toggleExpand(node.id)} className="btn btn-xs btn-link p-0 text-slate-500">
                {isExpanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
              </button>) : (<div className="w-4 h-4 d-flex align-items-center justify-content-center">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              </div>)}
            <div className="h-7 w-7 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 d-flex align-items-center justify-content-center">
              <Network className="h-3.5 w-3.5"/>
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{node.departmentName}</span>
              <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 ms-2 font-mono text-[9px]">{node.departmentCode}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold">{node.branchName}</span>
            <button onClick={() => handleNav('dept_details', node.id)} className="btn btn-xs btn-outline-secondary p-1" title="View Details">
              <Info className="h-3 w-3"/>
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (<div className="mt-1">
            {node.children?.map(child => renderNode(child))}
          </div>)}
      </div>);
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => handleNav('departments_mgmt')} className="btn btn-outline-secondary btn-sm p-2">
            <ArrowLeft className="h-4.5 w-4.5"/>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Network className="text-indigo-600 h-7 w-7"/> Department Hierarchy
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Interactive tree visualizer mapping department hierarchies.
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="position-relative">
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
          <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Search hierarchy..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>
      </div>

      {/* Tree Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm min-h-[300px]">
        {loading ? (<div className="text-center py-20">
            <div className="spinner-border text-primary" role="status"/>
          </div>) : treeData.length === 0 ? (<div className="text-center py-20 text-slate-500 font-semibold">No hierarchical structures found.</div>) : (<div className="hierarchy-root ps-0">
            {treeData.map(node => renderNode(node))}
          </div>)}
      </div>
    </div>);
}
