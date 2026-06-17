import AdminNavbar from './AdminNavbar';
import {
  Edit2, Trash2, Ban, CheckCircle, XCircle, Clock, Mail,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { toast } from 'sonner';
import { getAuthItem } from '../utils/authStorage';

interface User {
  name: string;
  email: string;
  joinDate: string;
  reportsCount: number;
  status: 'active' | 'suspended' | 'pending';
  lastActive: string;
}

interface ManageUsersProps {
  onLogout: () => void;
}

export default function ManageUsers({ onLogout }: ManageUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // -------------------------------
  // Load users from backend
  // -------------------------------
  const loadUsers = async () => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // -------------------------------
  // EDIT USER
  // -------------------------------
  const handleEdit = async (email: string) => {
    const newName = prompt("Enter new name:");
    if (!newName) return;

    const newStatus = prompt("Enter status (active, suspended, pending):");
    if (!newStatus) return;

    try {
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/users/${email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, status: newStatus })
      });

      if (res.ok) {
        toast.success("User updated successfully!");
      } else {
        toast.error("Failed to update user");
      }
      loadUsers();
    } catch (err) {
      toast.error("Error updating user");
    }
  };

  // -------------------------------
  // SUSPEND USER
  // -------------------------------
  const handleSuspend = async (email: string, currentStatus: string) => {
  // Toggle: if suspended → active. If active → suspended
  const newStatus = currentStatus === "suspended" ? "active" : "suspended";

  try {
    const token = getAuthItem("authToken");
    const res = await fetch(`${API_BASE}/admin/users/${email}/status`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      toast.success(newStatus === "suspended" ? "User suspended" : "User activated");
    } else {
      toast.error("Failed to update user status");
    }
    loadUsers();
  } catch (err) {
    toast.error("Error updating user status");
  }
};


  // -------------------------------
  // DELETE USER
  // -------------------------------
  const handleDelete = async (email: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const encodedEmail = encodeURIComponent(email);
      const token = getAuthItem("authToken");

      const res = await fetch(`${API_BASE}/admin/users/${encodedEmail}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }

      toast.success("User deleted successfully!");
      loadUsers(); // reload after delete
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting user");
    }
  };


  // -------------------------------
  // Filters
  // -------------------------------
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    pending: users.filter((u) => u.status === "pending").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'suspended': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-gray-900 mb-4">Manage Users</h1>
        <p className="text-lg text-gray-600 mb-10">View and manage all registered users</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <div className="bg-white shadow p-6 rounded-xl">Total: {stats.total}</div>
          <div className="bg-green-50 shadow p-6 rounded-xl">Active: {stats.active}</div>
          <div className="bg-red-50 shadow p-6 rounded-xl">Suspended: {stats.suspended}</div>
          <div className="bg-yellow-50 shadow p-6 rounded-xl">Pending: {stats.pending}</div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-6 bg-white p-6 rounded-xl shadow mb-12">
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border p-3 rounded-lg"
          />

          <select
            className="border p-3 rounded-lg"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <table className="w-full bg-white shadow rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Join Date</th>
              <th className="p-4 text-left">Reports</th>
              <th className="p-4 text-left">Last Active</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.email} className="border-t">
                <td className="p-4">
                  <b>{u.name}</b>
                  <div className="text-gray-600 text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {u.email}
                  </div>
                </td>

                <td className="p-4">{u.joinDate}</td>

                <td className="p-4">{u.reportsCount}</td>

                <td className="p-4">{u.lastActive}</td>

                <td className="p-4">
                  <span className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${getStatusColor(u.status)}`}>
                    {getStatusIcon(u.status)} {u.status}
                  </span>
                </td>

                <td className="p-4 flex gap-3">
                  <button onClick={() => handleEdit(u.email)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg">
                    <Edit2 />
                  </button>
                 <button
  onClick={() => handleSuspend(u.email, u.status)}
  className={`p-2 rounded-lg transition ${
    u.status === "suspended"
      ? "text-green-600 hover:bg-green-50"   // UNSUSPEND STYLE
      : "text-yellow-600 hover:bg-yellow-50" // SUSPEND STYLE
  }`}
>
  {u.status === "suspended" ? <CheckCircle /> : <Ban />} 
</button>


                  <button onClick={() => handleDelete(u.email)} className="text-red-600 p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
