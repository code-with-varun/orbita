import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  History,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  RefreshCw,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';

export default function SubscriptionManagerView({ currentUser, onShowToast }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cycleFilter, setCycleFilter] = useState('All');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [selectedSubForHistory, setSelectedSubForHistory] = useState(null);
  const [isCycleFormOpen, setIsCycleFormOpen] = useState(false);

  // Form states with INR (₹)
  const [formData, setFormData] = useState({
    site: '',
    app_name: '',
    category: 'SaaS / Tools',
    cost: '',
    currency: 'INR',
    billing_cycle: 'Monthly',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    renewal_date: '',
    auto_renew: true,
    payment_method: 'UPI / Card',
    notes: '',
    log_initial_cycle: true
  });

  // New billing cycle form state
  const [cycleFormData, setCycleFormData] = useState({
    cycle_date: new Date().toISOString().split('T')[0],
    amount_paid: '',
    currency: 'INR',
    invoice_number: '',
    period_start: '',
    period_end: '',
    payment_method: 'UPI / Card',
    status: 'Paid',
    notes: '',
    next_renewal_date: '',
    next_expiry_date: ''
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      let url = '/api/subscriptions?';
      if (currentUser) {
        url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&`;
      }
      if (statusFilter !== 'All') url += `status=${statusFilter}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setSubscriptions(Array.isArray(data) ? data : []);

      if (selectedSubForHistory) {
        const updated = Array.isArray(data) ? data.find((s) => s.id === selectedSubForHistory.id) : null;
        if (updated) setSelectedSubForHistory(updated);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [currentUser, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const handleOpenAdd = () => {
    setEditingSub(null);
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    setFormData({
      site: '',
      app_name: '',
      category: 'SaaS / Tools',
      cost: '',
      currency: 'INR',
      billing_cycle: 'Monthly',
      start_date: today.toISOString().split('T')[0],
      expiry_date: oneMonthLater.toISOString().split('T')[0],
      renewal_date: oneMonthLater.toISOString().split('T')[0],
      auto_renew: true,
      payment_method: 'UPI / Card',
      notes: '',
      log_initial_cycle: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setFormData({
      site: sub.site,
      app_name: sub.app_name,
      category: sub.category || 'SaaS / Tools',
      cost: sub.cost,
      currency: sub.currency || 'INR',
      billing_cycle: sub.billing_cycle || 'Monthly',
      start_date: sub.start_date || '',
      expiry_date: sub.expiry_date || '',
      renewal_date: sub.renewal_date || '',
      auto_renew: sub.auto_renew !== undefined ? sub.auto_renew : true,
      payment_method: sub.payment_method || 'UPI / Card',
      notes: sub.notes || '',
      log_initial_cycle: false
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (subId, appName) => {
    if (!window.confirm(`Are you sure you want to delete the subscription for "${appName}"?`)) return;
    try {
      const res = await fetch(`/api/subscriptions/${subId}`, { method: 'DELETE' });
      if (res.ok) {
        if (onShowToast) onShowToast(`Subscription "${appName}" deleted`, 'info');
        if (selectedSubForHistory?.id === subId) setSelectedSubForHistory(null);
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost: Number(formData.cost || 0),
        currency: 'INR',
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        user_name: currentUser?.name || 'User'
      };

      if (!editingSub && formData.log_initial_cycle) {
        payload.initial_cycle = {
          cycle_date: formData.start_date || new Date().toISOString().split('T')[0],
          amount_paid: Number(formData.cost || 0),
          currency: 'INR',
          period_start: formData.start_date,
          period_end: formData.expiry_date,
          payment_method: formData.payment_method,
          status: 'Paid',
          notes: 'Initial subscription signup'
        };
      }

      const url = editingSub ? `/api/subscriptions/${editingSub.id}` : '/api/subscriptions';
      const method = editingSub ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onShowToast) onShowToast(editingSub ? 'Subscription updated' : 'Subscription added successfully', 'success');
        setIsFormOpen(false);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save subscription');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBillingHistory = (sub) => {
    setSelectedSubForHistory(sub);
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    setCycleFormData({
      cycle_date: today.toISOString().split('T')[0],
      amount_paid: sub.cost || '',
      currency: 'INR',
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      period_start: sub.renewal_date || today.toISOString().split('T')[0],
      period_end: nextMonth.toISOString().split('T')[0],
      payment_method: sub.payment_method || 'UPI / Card',
      status: 'Paid',
      notes: '',
      next_renewal_date: nextMonth.toISOString().split('T')[0],
      next_expiry_date: nextMonth.toISOString().split('T')[0]
    });
    setIsCycleFormOpen(false);
  };

  const handleSaveBillingCycle = async (e) => {
    e.preventDefault();
    if (!selectedSubForHistory) return;

    try {
      const payload = {
        ...cycleFormData,
        amount_paid: Number(cycleFormData.amount_paid || 0),
        currency: 'INR',
        user_name: currentUser?.name || 'User'
      };

      const res = await fetch(`/api/subscriptions/${selectedSubForHistory.id}/billing-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedSubForHistory(updated);
        setIsCycleFormOpen(false);
        if (onShowToast) onShowToast('New billing cycle recorded in ₹', 'success');
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add billing cycle');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCycle = async (cycleId) => {
    if (!window.confirm('Delete this billing cycle record?')) return;
    try {
      const res = await fetch(`/api/subscriptions/${selectedSubForHistory.id}/billing-cycles/${cycleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedSubForHistory(updated);
        if (onShowToast) onShowToast('Billing cycle removed', 'info');
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics in Rupees
  const totalMonthlyBurn = subscriptions.reduce((sum, s) => {
    const cost = Number(s.cost || 0);
    if (s.billing_cycle === 'Annually') return sum + cost / 12;
    if (s.billing_cycle === 'Quarterly') return sum + cost / 3;
    if (s.billing_cycle === 'Weekly') return sum + cost * 4.33;
    return sum + cost;
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const expiringSoonCount = subscriptions.filter((s) => {
    if (!s.expiry_date) return false;
    const diffDays = Math.ceil((new Date(s.expiry_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const filteredSubs = subscriptions.filter((s) => {
    if (cycleFilter !== 'All' && s.billing_cycle !== cycleFilter) return false;
    return true;
  });

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              padding: '8px',
              borderRadius: '10px',
              color: 'var(--accent-blue)',
              display: 'flex'
            }}>
              <CreditCard size={22} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Subscription Manager</h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
            Track SaaS platforms, renewal dates, expiry timelines, and complete billing cycle history in Indian Rupees (₹)
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add Subscription
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Active Subscriptions</span>
            <CreditCard size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-main)' }}>
            {subscriptions.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            All managed platforms & services
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Est. Monthly Burn</span>
            <span style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '1.1rem' }}>₹</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-green)' }}>
            ₹{totalMonthlyBurn.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            ₹{(totalMonthlyBurn * 12).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year normalized
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Expiring Soon (≤ 7 Days)</span>
            <AlertTriangle size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: expiringSoonCount > 0 ? 'var(--accent-amber)' : 'var(--text-main)' }}>
            {expiringSoonCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Requires renewal or review
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Auto-Renew Active</span>
            <RefreshCw size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-purple)' }}>
            {subscriptions.filter((s) => s.auto_renew).length} / {subscriptions.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Continuously renewed
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card" style={{ padding: '0.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search site, application, notes, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Search</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Cycle:</span>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Annually">Annually</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={fetchSubscriptions} title="Refresh data" style={{ padding: '7px 10px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <TableSkeleton rows={5} />
          </div>
        ) : filteredSubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <CreditCard size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No subscriptions found
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              Add your recurring SaaS platforms, streaming subscriptions, and tools to monitor expiry dates and past billing cycles in ₹.
            </p>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add First Subscription
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Site / Platform</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Application</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cost & Cycle</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Expiry Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Renewal Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Past Cycles</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((sub) => {
                  const diffDays = sub.expiry_date
                    ? Math.ceil((new Date(sub.expiry_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpiringSoon = diffDays !== null && diffDays >= 0 && diffDays <= 7;
                  const isExpired = diffDays !== null && diffDays < 0;

                  return (
                    <tr
                      key={sub.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                      className="table-row-hover"
                    >
                      {/* Site */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--accent-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {sub.site.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {sub.site}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {sub.category || 'SaaS'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* App Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--accent-blue)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          onClick={() => handleOpenBillingHistory(sub)}
                          title="Click to view billing history and past subscriptions"
                        >
                          {sub.app_name}
                          <ChevronRight size={14} style={{ opacity: 0.6 }} />
                        </div>
                        {sub.notes && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sub.notes}
                          </div>
                        )}
                      </td>

                      {/* Cost in Rupees (₹) */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          ₹{Number(sub.cost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          / {sub.billing_cycle} {sub.auto_renew && '• Auto'}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {sub.expiry_date}
                        </div>
                        {isExpired ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 600 }}>
                            Expired ({Math.abs(diffDays)}d ago)
                          </span>
                        ) : isExpiringSoon ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                            ⚠️ Expires in {diffDays} {diffDays === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {diffDays !== null ? `${diffDays} days left` : '—'}
                          </span>
                        )}
                      </td>

                      {/* Renewal Date */}
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} style={{ color: 'var(--text-dim)' }} />
                          {sub.renewal_date}
                        </div>
                      </td>

                      {/* Past Cycles Clicker */}
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenBillingHistory(sub)}
                          style={{
                            padding: '4px 9px',
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--accent-purple)'
                          }}
                        >
                          <History size={12} />
                          {sub.past_billing_cycles?.length || 0} Cycles
                        </button>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '20px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background:
                              isExpired || sub.status === 'Expired'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : isExpiringSoon || sub.status === 'Expiring Soon'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                            color:
                              isExpired || sub.status === 'Expired'
                                ? 'var(--accent-red)'
                                : isExpiringSoon || sub.status === 'Expiring Soon'
                                ? 'var(--accent-amber)'
                                : 'var(--accent-green)'
                          }}
                        >
                          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : sub.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleOpenBillingHistory(sub)}
                            title="Billing History & Cycles"
                            style={{ color: 'var(--accent-purple)' }}
                          >
                            <History size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleOpenEdit(sub)}
                            title="Edit Subscription"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleDelete(sub.id, sub.app_name)}
                            title="Delete Subscription"
                            style={{ color: 'var(--accent-red)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PAST BILLING CYCLES & CYCLE DETAIL (Requirement 1)      */}
      {/* ------------------------------------------------------------- */}
      {selectedSubForHistory && (
        <div className="modal-overlay" onClick={() => setSelectedSubForHistory(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={20} color="var(--accent-purple)" />
                  <h2 className="modal-title">Past Subscription & Billing Cycles</h2>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {selectedSubForHistory.app_name} on <strong style={{ color: 'var(--text-main)' }}>{selectedSubForHistory.site}</strong>
                </p>
              </div>
              <button className="close-btn" onClick={() => setSelectedSubForHistory(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Quick summary strip */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '0.9rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.8rem',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Rate</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '0.95rem' }}>
                  ₹{Number(selectedSubForHistory.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / {selectedSubForHistory.billing_cycle}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Current Expiry</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {selectedSubForHistory.expiry_date}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Next Renewal</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {selectedSubForHistory.renewal_date}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total Past Cycles</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-purple)', fontSize: '0.9rem' }}>
                  {selectedSubForHistory.past_billing_cycles?.length || 0} recorded
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Billing Cycle Audit Trail (₹)
              </h3>
              <button
                className="btn btn-secondary"
                onClick={() => setIsCycleFormOpen(!isCycleFormOpen)}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                <Plus size={14} /> {isCycleFormOpen ? 'Close Entry Form' : 'Log New / Past Billing Cycle'}
              </button>
            </div>

            {/* Inline Form to add a past or renewal cycle */}
            {isCycleFormOpen && (
              <form
                onSubmit={handleSaveBillingCycle}
                style={{
                  background: 'rgba(124, 58, 237, 0.05)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  borderRadius: '8px',
                  padding: '1.1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--accent-purple)' }}>
                  Record Payment / Subscription Billing Event (₹)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Cycle Date *</label>
                    <input
                      type="date"
                      required
                      value={cycleFormData.cycle_date}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, cycle_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Amount Paid (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 1499.00"
                      value={cycleFormData.amount_paid}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, amount_paid: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Invoice / Receipt #</label>
                    <input
                      type="text"
                      placeholder="INV-98234"
                      value={cycleFormData.invoice_number}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, invoice_number: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Status</label>
                    <select
                      value={cycleFormData.status}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Cycle Period Start</label>
                    <input
                      type="date"
                      value={cycleFormData.period_start}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, period_start: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Cycle Period End</label>
                    <input
                      type="date"
                      value={cycleFormData.period_end}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, period_end: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Update Next Expiry Date</label>
                    <input
                      type="date"
                      value={cycleFormData.next_expiry_date}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, next_expiry_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Update Next Renewal Date</label>
                    <input
                      type="date"
                      value={cycleFormData.next_renewal_date}
                      onChange={(e) => setCycleFormData({ ...cycleFormData, next_renewal_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Notes / Transaction Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via UPI ending in 4421"
                    value={cycleFormData.notes}
                    onChange={(e) => setCycleFormData({ ...cycleFormData, notes: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCycleFormOpen(false)} style={{ fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                    Save Cycle Record
                  </button>
                </div>
              </form>
            )}

            {/* Cycles List */}
            {(!selectedSubForHistory.past_billing_cycles || selectedSubForHistory.past_billing_cycles.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                <Clock size={32} style={{ opacity: 0.25, margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>No past billing cycles recorded yet</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Click "Log New / Past Billing Cycle" above to track prior payments or renewals.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Billing Date</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Period Covered</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Amount Paid</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Invoice #</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Method</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Status</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSubForHistory.past_billing_cycles.map((cycle) => (
                      <tr key={cycle._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {cycle.cycle_date}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {cycle.period_start || cycle.cycle_date} {cycle.period_end ? `→ ${cycle.period_end}` : ''}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent-green)' }}>
                          ₹{Number(cycle.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>
                          {cycle.invoice_number || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {cycle.payment_method || 'UPI'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: cycle.status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: cycle.status === 'Paid' ? 'var(--accent-green)' : 'var(--accent-red)'
                          }}>
                            {cycle.status || 'Paid'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleDeleteCycle(cycle._id)}
                            title="Delete billing cycle"
                            style={{ color: 'var(--accent-red)', padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT SUBSCRIPTION                                 */}
      {/* ------------------------------------------------------------- */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="var(--accent-blue)" />
                <h2 className="modal-title">
                  {editingSub ? 'Edit Subscription' : 'Add New Subscription'}
                </h2>
              </div>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Site / Provider *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, AWS, Netflix, Figma, GitHub"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Application / Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Workspace, Copilot Pro, EC2"
                    value={formData.app_name}
                    onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="999.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Cycle *</label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="form-select"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annually">Annually</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Developer Tools, Streaming"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Renewal Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.renewal_date}
                    onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI, Net Banking, HDFC Card"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.auto_renew}
                      onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                    />
                    <span>Auto-renew automatically on renewal date</span>
                  </label>
                </div>
              </div>

              {!editingSub && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  marginBottom: '1rem'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.log_initial_cycle}
                      onChange={(e) => setFormData({ ...formData, log_initial_cycle: e.target.checked })}
                    />
                    <span>Log initial subscription as 1st billing cycle in history</span>
                  </label>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notes & Account Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 5 team seats, billed under accounts@orbita.com"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSub ? 'Update Subscription' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
