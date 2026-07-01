import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, ChefHat, Truck, Eye } from 'lucide-react';

interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'chef' | 'driver' | 'viewer';
  status: 'active' | 'invited' | 'inactive';
  lastActive: string;
}

const MOCK_USERS: StoreUser[] = [
  { id: '1', name: 'You (Owner)',    email: 'sathya@sathyaspizza.com', role: 'manager', status: 'active',  lastActive: 'Now'         },
  { id: '2', name: 'Marco Rossi',   email: 'marco@sathyaspizza.com',  role: 'chef',    status: 'active',  lastActive: '2 hours ago'  },
  { id: '3', name: 'Priya Patel',   email: 'priya@example.com',       role: 'driver',  status: 'active',  lastActive: '1 day ago'    },
  { id: '4', name: 'Jake Wilson',   email: 'jake@example.com',        role: 'viewer',  status: 'invited', lastActive: 'Pending invite'},
];

const ROLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  manager: { icon: Shield,  color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25', label: 'Manager'   },
  chef:    { icon: ChefHat, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25', label: 'Chef'      },
  driver:  { icon: Truck,   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25',     label: 'Driver'    },
  viewer:  { icon: Eye,     color: 'text-stone-400',  bg: 'bg-white/5 border-white/10',            label: 'View Only' },
};

const STATUS_COLOR: Record<string, string> = {
  active:   'text-green-400',
  invited:  'text-yellow-400',
  inactive: 'text-stone-600',
};

export function UsersTab() {
  const [users, setUsers] = useState<StoreUser[]>(MOCK_USERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StoreUser['role']>('chef');
  const [inviteName, setInviteName] = useState('');

  const sendInvite = () => {
    if (!inviteEmail || !inviteName) return;
    setUsers(u => [...u, {
      id: Date.now().toString(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      lastActive: 'Pending invite',
    }]);
    setInviteEmail('');
    setInviteName('');
    setShowInvite(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Users & Staff</h2>
        <button onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors">
          <UserPlus className="w-3.5 h-3.5" /> Invite User
        </button>
      </div>

      {/* Role explanations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={role} className={`border ${cfg.bg} rounded-xl p-3 text-center`}>
              <Icon className={`w-5 h-5 ${cfg.color} mx-auto mb-1`} />
              <p className={`text-xs font-black ${cfg.color}`}>{cfg.label}</p>
              <p className="text-[9px] text-stone-600 mt-0.5">
                {role === 'manager' ? 'Full access' : role === 'chef' ? 'Menu & orders' : role === 'driver' ? 'Delivery only' : 'Read only'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400">Invite a team member</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Full name"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-red-500"
            />
            <input
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-red-500"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as StoreUser['role'])}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="manager">Manager</option>
              <option value="chef">Chef</option>
              <option value="driver">Driver</option>
              <option value="viewer">View Only</option>
            </select>
            <button onClick={sendInvite}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl transition-colors">
              Send Invite
            </button>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_80px_32px] text-[9px] font-black uppercase tracking-widest text-stone-600 px-5 py-3 border-b border-white/8">
          <span>User</span><span className="text-center">Role</span><span className="text-center">Status</span><span />
        </div>
        <div className="divide-y divide-white/5">
          {users.map(u => {
            const cfg = ROLE_CONFIG[u.role];
            const Icon = cfg.icon;
            return (
              <div key={u.id} className="grid grid-cols-[1fr_100px_80px_32px] items-center px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{u.name}</p>
                    <p className="text-[9px] text-stone-600 truncate">{u.lastActive}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                <p className={`text-[10px] font-bold text-center ${STATUS_COLOR[u.status]}`}>
                  {u.status}
                </p>
                {u.id !== '1' ? (
                  <button onClick={() => setUsers(us => us.filter(x => x.id !== u.id))}
                    className="text-stone-700 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : <div />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
