import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Tag,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Package
} from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';

const CONDITIONS = [
  'Active condition',
  'Refurbished condition',
  'Bad condition',
  'Beyond repair condition'
];

export default function WarrantyManagerView({ currentUser, onShowToast }) {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState(null);
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Electronics',
    cost_paid: '',
    number_of_warranties: 1,
    condition: 'Active condition',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    warranty_provider: '',
    serial_number: '',
    invoice_number: '',
    status: 'Under Warranty',
    notes: ''
  });

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      let url = '/api/warranties?';
      if (currentUser) {
        url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&`;
      }
      if (conditionFilter !== 'All') url += `condition=${encodeURIComponent(conditionFilter)}&`;
      if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setWarranties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching warranties:', err);
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, [currentUser, conditionFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWarranties();
  };

  const handleOpenAdd = () => {
    setEditingWarranty(null);
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    setFormData({
      product_name: '',
      category: 'Electronics',
      cost_paid: '',
      number_of_warranties: 1,
      condition: 'Active condition',
      purchase_date: today.toISOString().split('T')[0],
      expiry_date: oneYearLater.toISOString().split('T')[0],
      warranty_provider: '',
      serial_number: '',
      invoice_number: '',
      status: 'Under Warranty',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWarranty(w);
    setFormData({
      product_name: w.product_name,
      category: w.category || 'Electronics',
      cost_paid: w.cost_paid,
      number_of_warranties: w.number_of_warranties || 1,
      condition: w.condition || 'Active condition',
      purchase_date: w.purchase_date || '',
      expiry_date: w.expiry_date || '',
      warranty_provider: w.warranty_provider || '',
      serial_number: w.serial_number || '',
      invoice_number: w.invoice_number || '',
      status: w.status || 'Under Warranty',
      notes: w.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete warranty for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/warranties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onShowToast) onShowToast(`Warranty for "${name}" deleted`, 'info');
        if (selectedWarranty?.id === id) setSelectedWarranty(null);
        fetchWarranties();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWarranty = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost_paid: Number(formData.cost_paid || 0),
        number_of_warranties: Number(formData.number_of_warranties || 1),
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        user_name: currentUser?.name || 'User'
      };

      const url = editingWarranty ? `/api/warranties/${editingWarranty.id}` : '/api/warranties';
      const method = editingWarranty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onShowToast) onShowToast(editingWarranty ? 'Warranty updated' : 'Warranty added successfully', 'success');
        setIsFormOpen(false);
        fetchWarranties();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save warranty');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderConditionBadge = (condition) => {
    switch (condition) {
      case 'Active condition':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-green)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            Active condition
          </span>
        );
      case 'Refurbished condition':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
            Refurbished condition
          </span>
        );
      case 'Bad condition':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
            Bad condition
          </span>
        );
      case 'Beyond repair condition':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--accent-red)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-red)' }} />
            Beyond repair condition
          </span>
        );
      default:
        return <span>{condition}</span>;
    }
  };

  // Metrics in Rupees (₹)
  const totalCostPaid = warranties.reduce((sum, w) => sum + Number(w.cost_paid || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const activeWarrantiesCount = warranties.filter((w) => {
    return w.expiry_date && w.expiry_date >= todayStr;
  }).length;
  const badOrBrokenCount = warranties.filter(
    (w) => w.condition === 'Bad condition' || w.condition === 'Beyond repair condition'
  ).length;

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '8px',
              borderRadius: '10px',
              color: 'var(--accent-green)',
              display: 'flex'
            }}>
              <ShieldCheck size={22} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Warranty Manager</h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
            Keep track of product warranties, cost paid (₹), number of warranties, expiry dates, and hardware conditions
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add Warranty
        </button>
      </div>

      {/* KPI Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Total Warranties</span>
            <Package size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-main)' }}>
            {warranties.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {activeWarrantiesCount} currently active & covered
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Total Warranty Paid</span>
            <span style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '1.1rem' }}>₹</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-blue)' }}>
            ₹{totalCostPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Across all hardware & product assets
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Refurbished Items</span>
            <Tag size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-purple)' }}>
            {warranties.filter((w) => w.condition === 'Refurbished condition').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Certified refurbished hardware
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Critical Conditions</span>
            <AlertTriangle size={18} color="var(--accent-red)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: badOrBrokenCount > 0 ? 'var(--accent-red)' : 'var(--text-main)' }}>
            {badOrBrokenCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Bad or beyond repair condition
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
              placeholder="Search product name, serial #, category, provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Search</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Condition Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Condition:</span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All Conditions</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All Statuses</option>
              <option value="Under Warranty">Under Warranty</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Claimed">Claimed</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={fetchWarranties} title="Refresh" style={{ padding: '7px 10px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <TableSkeleton rows={5} />
          </div>
        ) : warranties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <ShieldCheck size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No warranties found
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              Add your appliances, electronic gadgets, vehicles, and tools to track warranty policies and hardware condition in ₹.
            </p>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add First Warranty
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Product / Item</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Item Condition</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cost Paid (₹)</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>No. of Warranties</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Expiry Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Serial # / Provider</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => {
                  const diffDays = w.expiry_date
                    ? Math.ceil((new Date(w.expiry_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpired = diffDays !== null && diffDays < 0;
                  const isExpiringSoon = diffDays !== null && diffDays >= 0 && diffDays <= 30;

                  return (
                    <tr
                      key={w.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                      className="table-row-hover"
                    >
                      {/* Product Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-green)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                          }}>
                            <Package size={17} />
                          </div>
                          <div>
                            <div
                              style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}
                              onClick={() => setSelectedWarranty(w)}
                            >
                              {w.product_name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {w.category || 'Product'} {w.purchase_date ? `• Bought ${w.purchase_date}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Condition (Requirement 2) */}
                      <td style={{ padding: '12px 16px' }}>
                        {renderConditionBadge(w.condition)}
                      </td>

                      {/* Cost Paid in Rupees (₹) */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          ₹{Number(w.cost_paid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          warranty fee
                        </div>
                      </td>

                      {/* Number of warranties */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          {w.number_of_warranties || 1} {w.number_of_warranties > 1 ? 'policies' : 'policy'}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {w.expiry_date}
                        </div>
                        {isExpired ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 600 }}>
                            Expired ({Math.abs(diffDays)}d ago)
                          </span>
                        ) : isExpiringSoon ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                            ⚠️ {diffDays} days remaining
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {diffDays !== null ? `${diffDays} days left` : '—'}
                          </span>
                        )}
                      </td>

                      {/* Serial # & Provider */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          {w.warranty_provider || 'Direct OEM'}
                        </div>
                        {w.serial_number && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            SN: {w.serial_number}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background:
                            isExpired || w.status === 'Expired'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isExpiringSoon || w.status === 'Expiring Soon'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            isExpired || w.status === 'Expired'
                              ? 'var(--accent-red)'
                              : isExpiringSoon || w.status === 'Expiring Soon'
                              ? 'var(--accent-amber)'
                              : 'var(--accent-green)'
                        }}>
                          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : w.status || 'Under Warranty'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            className="action-icon-btn"
                            onClick={() => setSelectedWarranty(w)}
                            title="View Details"
                            style={{ color: 'var(--accent-blue)' }}
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleOpenEdit(w)}
                            title="Edit Warranty"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleDelete(w.id, w.product_name)}
                            title="Delete Warranty"
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
      {/* MODAL: WARRANTY DETAIL VIEW                                    */}
      {/* ------------------------------------------------------------- */}
      {selectedWarranty && (
        <div className="modal-overlay" onClick={() => setSelectedWarranty(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-green)" />
                <h2 className="modal-title">Warranty Specification</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedWarranty(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Product Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{selectedWarranty.product_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Condition Status</div>
                <div style={{ marginTop: '3px' }}>{renderConditionBadge(selectedWarranty.condition)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Warranty Cost Paid</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  ₹{Number(selectedWarranty.cost_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Number of Warranties</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedWarranty.number_of_warranties || 1}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Purchase / Start Date</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {selectedWarranty.purchase_date || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Expiry Date</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                  {selectedWarranty.expiry_date}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Provider / OEM</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {selectedWarranty.warranty_provider || 'Direct'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Serial Number</div>
                <div style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                  {selectedWarranty.serial_number || 'N/A'}
                </div>
              </div>
            </div>

            {selectedWarranty.notes && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                padding: '0.85rem',
                borderRadius: '8px',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Notes & Instructions</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {selectedWarranty.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedWarranty(null);
                  handleOpenEdit(selectedWarranty);
                }}
              >
                Edit Warranty
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedWarranty(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT WARRANTY                                     */}
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
                <ShieldCheck size={20} color="var(--accent-green)" />
                <h2 className="modal-title">
                  {editingWarranty ? 'Edit Warranty' : 'Add New Warranty'}
                </h2>
              </div>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWarranty}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name / Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro M3, Samsung OLED TV, Dyson Vacuum"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Laptops & Computing">Laptops & Computing</option>
                    <option value="Mobile & Tablets">Mobile & Tablets</option>
                    <option value="Home Appliances">Home Appliances</option>
                    <option value="Audio & Video">Audio & Video</option>
                    <option value="Vehicles & Auto">Vehicles & Auto</option>
                    <option value="Tools & Machinery">Tools & Machinery</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Condition Selection */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Item Condition * (Requirement)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  {CONDITIONS.map((c) => (
                    <label
                      key={c}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: formData.condition === c ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        background: formData.condition === c ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        fontSize: '0.78rem'
                      }}
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={c}
                        checked={formData.condition === c}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cost of Warranty Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.cost_paid}
                    onChange={(e) => setFormData({ ...formData, cost_paid: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Warranties *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={formData.number_of_warranties}
                    onChange={(e) => setFormData({ ...formData, number_of_warranties: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Under Warranty">Under Warranty</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Claimed">Claimed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
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
                  <label className="form-label">Warranty Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. AppleCare+, Croma, OneAssist"
                    value={formData.warranty_provider}
                    onChange={(e) => setFormData({ ...formData, warranty_provider: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. C02G4589MD6R"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="form-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice / Receipt Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-981"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Coverage Notes & Claim Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes accidental damage and screen protection"
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
                  {editingWarranty ? 'Update Warranty' : 'Register Warranty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
