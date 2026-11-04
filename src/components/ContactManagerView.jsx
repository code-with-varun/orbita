import React, { useState, useEffect } from 'react';
import {
  Contact,
  Plus,
  Search,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  Share2,
  Merge,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Building,
  Briefcase,
  FileText,
  Cloud,
  Download,
  Upload,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';

export default function ContactManagerView({ currentUser, onShowToast }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncFilter, setSyncFilter] = useState('All');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContactDetail, setSelectedContactDetail] = useState(null);

  // Duplication & Merge states (Requirement 6)
  const [mergeConflictModal, setMergeConflictModal] = useState(null);
  const [scanDuplicatesModal, setScanDuplicatesModal] = useState(false);
  const [duplicateClusters, setDuplicateClusters] = useState([]);
  const [scanningDuplicates, setScanningDuplicates] = useState(false);

  // Google Sync Modal
  const [googleSyncModal, setGoogleSyncModal] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    mobile_name: '',
    mobile_number: '',
    secondary_number: '',
    mail_id: '',
    secondary_email: '',
    company: '',
    job_title: '',
    social_ids: {
      linkedin: '',
      twitter: '',
      github: '',
      instagram: '',
      whatsapp: '',
      other: ''
    },
    context_notes: '',
    tags: ''
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let url = '/api/contacts?';
      if (currentUser) {
        url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&`;
      }
      if (syncFilter !== 'All') url += `google_synced=${syncFilter}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentUser, syncFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContacts();
  };

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      mobile_name: '',
      mobile_number: '',
      secondary_number: '',
      mail_id: '',
      secondary_email: '',
      company: '',
      job_title: '',
      social_ids: {
        linkedin: '',
        twitter: '',
        github: '',
        instagram: '',
        whatsapp: '',
        other: ''
      },
      context_notes: '',
      tags: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingContact(c);
    setFormData({
      mobile_name: c.mobile_name,
      mobile_number: c.mobile_number,
      secondary_number: c.secondary_number || '',
      mail_id: c.mail_id || '',
      secondary_email: c.secondary_email || '',
      company: c.company || '',
      job_title: c.job_title || '',
      social_ids: {
        linkedin: c.social_ids?.linkedin || '',
        twitter: c.social_ids?.twitter || '',
        github: c.social_ids?.github || '',
        instagram: c.social_ids?.instagram || '',
        whatsapp: c.social_ids?.whatsapp || '',
        other: c.social_ids?.other || ''
      },
      context_notes: c.context_notes || '',
      tags: Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || '')
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete contact "${name}"?`)) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onShowToast) onShowToast(`Contact "${name}" deleted`, 'info');
        if (selectedContactDetail?.id === id) setSelectedContactDetail(null);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveContact = async (e, bypassForce = false) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        ...formData,
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        user_name: currentUser?.name || 'User',
        force: bypassForce
      };

      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 409) {
        const data = await res.json();
        setMergeConflictModal({
          existing: data.duplicates[0],
          incoming: payload,
          allDuplicates: data.duplicates
        });
        return;
      }

      if (res.ok) {
        if (onShowToast) onShowToast(editingContact ? 'Contact updated' : 'Contact added successfully', 'success');
        setIsFormOpen(false);
        setMergeConflictModal(null);
        fetchContacts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save contact');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteMerge = async (primaryContact, incomingData, sourceContactIds = []) => {
    try {
      const idsToMerge = sourceContactIds.length > 0 ? sourceContactIds : (incomingData.id ? [incomingData.id] : []);

      let mergedContext = primaryContact.context_notes || '';
      if (incomingData.context_notes && !mergedContext.includes(incomingData.context_notes.trim())) {
        mergedContext += `\n[Merged Context (${new Date().toLocaleDateString()})]: ${incomingData.context_notes.trim()}`;
      }

      const mergedSocial = {
        linkedin: incomingData.social_ids?.linkedin || primaryContact.social_ids?.linkedin || '',
        twitter: incomingData.social_ids?.twitter || primaryContact.social_ids?.twitter || '',
        github: incomingData.social_ids?.github || primaryContact.social_ids?.github || '',
        instagram: incomingData.social_ids?.instagram || primaryContact.social_ids?.instagram || '',
        whatsapp: incomingData.social_ids?.whatsapp || primaryContact.social_ids?.whatsapp || '',
        other: incomingData.social_ids?.other || primaryContact.social_ids?.other || ''
      };

      const payload = {
        primaryContactId: primaryContact.id || primaryContact._id,
        duplicateContactIds: idsToMerge,
        mergedData: {
          mobile_name: primaryContact.mobile_name || incomingData.mobile_name,
          mobile_number: primaryContact.mobile_number,
          secondary_number: incomingData.mobile_number !== primaryContact.mobile_number
            ? incomingData.mobile_number
            : (primaryContact.secondary_number || incomingData.secondary_number || ''),
          mail_id: primaryContact.mail_id || incomingData.mail_id || '',
          secondary_email: incomingData.mail_id && incomingData.mail_id !== primaryContact.mail_id
            ? incomingData.mail_id
            : (primaryContact.secondary_email || incomingData.secondary_email || ''),
          company: primaryContact.company || incomingData.company || '',
          job_title: primaryContact.job_title || incomingData.job_title || '',
          social_ids: mergedSocial,
          context_notes: mergedContext
        },
        user_name: currentUser?.name || 'User'
      };

      const res = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onShowToast) onShowToast(`Merged contacts & context into ${primaryContact.mobile_name}`, 'success');
        setMergeConflictModal(null);
        setIsFormOpen(false);
        fetchContacts();
        if (scanDuplicatesModal) {
          handleScanDuplicates();
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to merge contacts');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanDuplicates = async () => {
    try {
      setScanningDuplicates(true);
      setScanDuplicatesModal(true);
      const res = await fetch('/api/contacts-scan/duplicates');
      const data = await res.json();
      setDuplicateClusters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setScanningDuplicates(false);
    }
  };

  const handleTriggerGoogleSync = async () => {
    try {
      setSyncingGoogle(true);
      const res = await fetch('/api/contacts/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_all: true,
          user_name: currentUser?.name || 'User'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (onShowToast) onShowToast(data.message || 'Contacts synced with Google cloud', 'success');
        fetchContacts();
      } else {
        const data = await res.json();
        alert(data.error || 'Google sync failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleExportGoogleCsv = () => {
    const headers = [
      'Name',
      'Given Name',
      'Family Name',
      'E-mail 1 - Type',
      'E-mail 1 - Value',
      'E-mail 2 - Type',
      'E-mail 2 - Value',
      'Phone 1 - Type',
      'Phone 1 - Value',
      'Phone 2 - Type',
      'Phone 2 - Value',
      'Organization 1 - Name',
      'Organization 1 - Title',
      'Notes'
    ];

    const rows = contacts.map((c) => {
      const nameParts = (c.mobile_name || '').split(' ');
      const givenName = nameParts[0] || '';
      const familyName = nameParts.slice(1).join(' ') || '';
      const notes = [
        c.context_notes || '',
        c.social_ids?.linkedin ? `LinkedIn: ${c.social_ids.linkedin}` : '',
        c.social_ids?.twitter ? `Twitter: ${c.social_ids.twitter}` : '',
        c.social_ids?.github ? `GitHub: ${c.social_ids.github}` : ''
      ].filter(Boolean).join(' | ');

      return [
        `"${(c.mobile_name || '').replace(/"/g, '""')}"`,
        `"${givenName.replace(/"/g, '""')}"`,
        `"${familyName.replace(/"/g, '""')}"`,
        `"Work"`,
        `"${(c.mail_id || '').replace(/"/g, '""')}"`,
        `"Personal"`,
        `"${(c.secondary_email || '').replace(/"/g, '""')}"`,
        `"Mobile"`,
        `"${(c.mobile_number || '').replace(/"/g, '""')}"`,
        `"Other"`,
        `"${(c.secondary_number || '').replace(/"/g, '""')}"`,
        `"${(c.company || '').replace(/"/g, '""')}"`,
        `"${(c.job_title || '').replace(/"/g, '""')}"`,
        `"${notes.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbita_google_contacts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Google Contacts CSV generated and downloaded', 'success');
  };

  const handleImportGoogleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) {
          alert('CSV file does not contain valid contacts data');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.replace(/["\r]/g, '').trim().toLowerCase());
        const importedList = [];

        for (let i = 1; i < lines.length; i++) {
          const rowVals = lines[i].split(',').map((v) => v.replace(/^"|"$/g, '').trim());
          if (rowVals.length === 0) continue;

          let name = '';
          let phone = '';
          let email = '';
          let company = '';
          let notes = '';

          headers.forEach((h, idx) => {
            const val = rowVals[idx] || '';
            if (h.includes('name') && !h.includes('given') && !h.includes('family') && !h.includes('org')) name = val;
            if ((h.includes('phone') || h.includes('mobile')) && !phone) phone = val;
            if ((h.includes('mail') || h.includes('email')) && !email) email = val;
            if (h.includes('org') || h.includes('company')) company = val;
            if (h.includes('note')) notes = val;
          });

          if (name || phone || email) {
            importedList.push({ mobile_name: name || 'Google Contact', mobile_number: phone || 'N/A', mail_id: email, company, notes });
          }
        }

        if (importedList.length === 0) {
          alert('No recognizable contacts found in CSV');
          return;
        }

        const res = await fetch('/api/contacts/google-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contacts: importedList,
            user_name: currentUser?.name || 'User'
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (onShowToast) onShowToast(data.message, 'success');
          setGoogleSyncModal(false);
          fetchContacts();
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse Google Contacts CSV');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'rgba(236, 72, 153, 0.15)',
              padding: '8px',
              borderRadius: '10px',
              color: 'var(--accent-pink)',
              display: 'flex'
            }}>
              <Contact size={22} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Contact Manager</h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
            Manage contacts, mobile numbers, mail IDs, social handles, automated duplication detection & context merging, with Google Contacts sync
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleScanDuplicates}
            style={{ color: 'var(--accent-amber)' }}
          >
            <Merge size={15} /> Scan Duplicates
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setGoogleSyncModal(true)}
            style={{ color: 'var(--accent-blue)' }}
          >
            <Cloud size={15} /> Google Sync
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Total Contacts</span>
            <Contact size={18} color="var(--accent-pink)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-main)' }}>
            {contacts.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Active verified contact records
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Google Synced</span>
            <Cloud size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-blue)' }}>
            {contacts.filter((c) => c.google_synced).length} / {contacts.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Synced with Google Cloud Context
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>With Social Profiles</span>
            <Share2 size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-purple)' }}>
            {contacts.filter((c) => c.social_ids && Object.values(c.social_ids).some(Boolean)).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            LinkedIn, Twitter, GitHub, etc.
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Deduplication & Merge</span>
            <Merge size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-green)' }}>
            Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Context-preserving duplicate scanner
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
              placeholder="Search by mobile name, phone number, email, company, notes..."
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Google Sync:</span>
            <select
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All Contacts</option>
              <option value="true">Google Synced</option>
              <option value="false">Local Only</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={fetchContacts} title="Refresh" style={{ padding: '7px 10px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <TableSkeleton rows={5} />
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Contact size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No contacts found
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              Add mobile names, phone numbers, email addresses, and social IDs with automatic duplication merging and Google sync.
            </p>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add First Contact
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mobile Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mobile Number</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mail ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Social IDs</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Company & Role</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Context Notes</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Google Sync</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                    className="table-row-hover"
                  >
                    {/* Mobile Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'rgba(236, 72, 153, 0.12)',
                          color: 'var(--accent-pink)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {c.mobile_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}
                            onClick={() => setSelectedContactDetail(c)}
                          >
                            {c.mobile_name}
                          </div>
                          {c.tags && c.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '2px' }}>
                              {c.tags.slice(0, 2).map((t, idx) => (
                                <span key={idx} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px', color: 'var(--text-dim)' }}>
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        <Phone size={13} style={{ color: 'var(--accent-green)' }} />
                        {c.mobile_number}
                      </div>
                      {c.secondary_number && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginLeft: '1.15rem' }}>
                          Alt: {c.secondary_number}
                        </div>
                      )}
                    </td>

                    {/* Mail ID */}
                    <td style={{ padding: '12px 16px' }}>
                      {c.mail_id ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            <Mail size={13} style={{ color: 'var(--accent-blue)' }} />
                            {c.mail_id}
                          </div>
                          {c.secondary_email && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '1.15rem' }}>
                              Alt: {c.secondary_email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>

                    {/* Social IDs */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {c.social_ids?.linkedin && (
                          <a
                            href={c.social_ids.linkedin.startsWith('http') ? c.social_ids.linkedin : `https://linkedin.com/in/${c.social_ids.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0a66c2', padding: '3px' }}
                            title={`LinkedIn: ${c.social_ids.linkedin}`}
                          >
                            <Linkedin size={15} />
                          </a>
                        )}
                        {c.social_ids?.twitter && (
                          <a
                            href={c.social_ids.twitter.startsWith('http') ? c.social_ids.twitter : `https://x.com/${c.social_ids.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1da1f2', padding: '3px' }}
                            title={`Twitter / X: ${c.social_ids.twitter}`}
                          >
                            <Twitter size={15} />
                          </a>
                        )}
                        {c.social_ids?.github && (
                          <a
                            href={c.social_ids.github.startsWith('http') ? c.social_ids.github : `https://github.com/${c.social_ids.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-main)', padding: '3px' }}
                            title={`GitHub: ${c.social_ids.github}`}
                          >
                            <Github size={15} />
                          </a>
                        )}
                        {c.social_ids?.instagram && (
                          <a
                            href={c.social_ids.instagram.startsWith('http') ? c.social_ids.instagram : `https://instagram.com/${c.social_ids.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#e1306c', padding: '3px' }}
                            title={`Instagram: ${c.social_ids.instagram}`}
                          >
                            <Instagram size={15} />
                          </a>
                        )}
                        {c.social_ids?.whatsapp && (
                          <span style={{ color: '#25d366', fontSize: '0.72rem', fontWeight: 600 }} title={`WhatsApp: ${c.social_ids.whatsapp}`}>
                            WA
                          </span>
                        )}
                        {(!c.social_ids || !Object.values(c.social_ids).some(Boolean)) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>None</span>
                        )}
                      </div>
                    </td>

                    {/* Company & Role */}
                    <td style={{ padding: '12px 16px' }}>
                      {c.company || c.job_title ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                            {c.company || '—'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {c.job_title || ''}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>

                    {/* Context Notes */}
                    <td style={{ padding: '12px 16px' }}>
                      {c.context_notes ? (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            maxWidth: '180px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedContactDetail(c)}
                          title="Click to view full merged context"
                        >
                          {c.context_notes}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>No context</span>
                      )}
                    </td>

                    {/* Google Sync Status */}
                    <td style={{ padding: '12px 16px' }}>
                      {c.google_synced ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-blue)',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          <CheckCircle2 size={12} /> Google Synced
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          color: 'var(--text-dim)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-color)'
                        }}>
                          Local Only
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          className="action-icon-btn"
                          onClick={() => setSelectedContactDetail(c)}
                          title="View Contact & Context"
                          style={{ color: 'var(--accent-blue)' }}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="action-icon-btn"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Contact"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="action-icon-btn"
                          onClick={() => handleDelete(c.id, c.mobile_name)}
                          title="Delete Contact"
                          style={{ color: 'var(--accent-red)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DUPLICATE CONFLICT / MERGE ASKER (Requirement 6)        */}
      {/* ------------------------------------------------------------- */}
      {mergeConflictModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{ maxWidth: '640px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--accent-amber)' }}>
              <AlertTriangle size={24} />
              <div>
                <h3 className="modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                  Duplicate Contact Detected!
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                  A contact with matching mobile number or email already exists.
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              padding: '0.9rem',
              marginBottom: '1.25rem',
              fontSize: '0.83rem',
              color: 'var(--text-main)'
            }}>
              Would you like to <strong>merge this context</strong> into the existing record?
              Orbita will preserve both phone numbers, combine social accounts, and merge historical notes without data loss.
            </div>

            {/* Side-by-side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>Existing Contact</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{mergeConflictModal.existing.mobile_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent-green)', fontFamily: 'monospace', marginTop: '2px' }}>
                  {mergeConflictModal.existing.mobile_number}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {mergeConflictModal.existing.mail_id || 'No email'}
                </div>
                {mergeConflictModal.existing.context_notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', fontStyle: 'italic' }}>
                    "{mergeConflictModal.existing.context_notes}"
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>Incoming New / Edited Contact</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{mergeConflictModal.incoming.mobile_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent-green)', fontFamily: 'monospace', marginTop: '2px' }}>
                  {mergeConflictModal.incoming.mobile_number}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {mergeConflictModal.incoming.mail_id || 'No email'}
                </div>
                {mergeConflictModal.incoming.context_notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', fontStyle: 'italic' }}>
                    "{mergeConflictModal.incoming.context_notes}"
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMergeConflictModal(null)}
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSaveContact(null, true)}
                  style={{ fontSize: '0.82rem' }}
                  title="Save as a separate duplicate contact anyway"
                >
                  Save as Separate
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleExecuteMerge(mergeConflictModal.existing, mergeConflictModal.incoming)}
                  style={{ fontSize: '0.82rem', background: 'var(--accent-green)' }}
                >
                  <Merge size={14} /> Merge Context & Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SCAN & MERGE ALL DUPLICATES                             */}
      {/* ------------------------------------------------------------- */}
      {scanDuplicatesModal && (
        <div className="modal-overlay" onClick={() => setScanDuplicatesModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '720px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Merge size={20} color="var(--accent-amber)" />
                <h2 className="modal-title">
                  Duplicate Contact Scanner & Merger
                </h2>
              </div>
              <button className="close-btn" onClick={() => setScanDuplicatesModal(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Scans your entire contact book for matching phone numbers or emails and provides one-click context merging.
            </p>

            {scanningDuplicates ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
                <div>Scanning contact book for duplicate clusters...</div>
              </div>
            ) : duplicateClusters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <CheckCircle2 size={36} color="var(--accent-green)" style={{ margin: '0 auto 0.6rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Zero Duplicates Found!
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Your contact list is completely clean and deduplicated.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {duplicateClusters.map((cluster, idx) => {
                  const primary = cluster.contacts[0];
                  const duplicateIds = cluster.contacts.slice(1).map((c) => c.id);

                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                          ⚠️ {cluster.reason}
                        </span>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'var(--accent-green)' }}
                          onClick={() => handleExecuteMerge(primary, {}, duplicateIds)}
                        >
                          <Merge size={12} /> Merge This Cluster ({cluster.contacts.length} contacts)
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cluster.contacts.length}, 1fr)`, gap: '0.75rem' }}>
                        {cluster.contacts.map((item, cIdx) => (
                          <div
                            key={item.id}
                            style={{
                              background: cIdx === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                              border: cIdx === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                              padding: '0.75rem',
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{ fontSize: '0.68rem', color: cIdx === 0 ? 'var(--accent-green)' : 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                              {cIdx === 0 ? 'Primary Master' : `Duplicate #${cIdx}`}
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem', marginTop: '2px' }}>
                              {item.mobile_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {item.mobile_number}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {item.mail_id || 'No mail'}
                            </div>
                            {item.context_notes && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', fontStyle: 'italic' }}>
                                Context: {item.context_notes.slice(0, 40)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: GOOGLE SYNC & IMPORT/EXPORT (Requirement 6)             */}
      {/* ------------------------------------------------------------- */}
      {googleSyncModal && (
        <div className="modal-overlay" onClick={() => setGoogleSyncModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={20} color="var(--accent-blue)" />
                <h2 className="modal-title">
                  Google Contacts Sync & Cloud Context
                </h2>
              </div>
              <button className="close-btn" onClick={() => setGoogleSyncModal(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Synchronize your Orbita contacts with your Google Account cloud context, import from Google Contacts, or export ready-to-use Google CSV files.
            </p>

            {/* Sync Now Action */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              padding: '1.1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  Two-Way Google Sync
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Syncs all {contacts.length} contacts with your Google Cloud Context
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleTriggerGoogleSync}
                disabled={syncingGoogle}
                style={{ fontSize: '0.82rem' }}
              >
                <RefreshCw size={14} className={syncingGoogle ? 'spin-icon' : ''} />
                {syncingGoogle ? 'Syncing...' : 'Sync with Google Now'}
              </button>
            </div>

            {/* Export and Import Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.9rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--accent-green)' }}>
                  <Download size={16} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Export to Google</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                  Download CSV formatted for direct import at contacts.google.com
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportGoogleCsv}
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  Download Google CSV
                </button>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.9rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--accent-purple)' }}>
                  <Upload size={16} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Import from Google</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                  Upload contacts exported from Google. Duplicates auto-merge!
                </p>
                <label className="btn btn-secondary" style={{ width: '100%', fontSize: '0.78rem', display: 'block', textAlign: 'center', cursor: 'pointer' }}>
                  Upload CSV File
                  <input
                    type="file"
                    accept=".csv,.vcf"
                    onChange={handleImportGoogleFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setGoogleSyncModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CONTACT & CONTEXT DETAIL                                */}
      {/* ------------------------------------------------------------- */}
      {selectedContactDetail && (
        <div className="modal-overlay" onClick={() => setSelectedContactDetail(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: 'var(--accent-pink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {selectedContactDetail.mobile_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>
                    {selectedContactDetail.mobile_name}
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {selectedContactDetail.company} {selectedContactDetail.job_title ? `• ${selectedContactDetail.job_title}` : ''}
                  </div>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedContactDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Primary Mobile</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                  {selectedContactDetail.mobile_number}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Secondary Mobile</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {selectedContactDetail.secondary_number || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Primary Mail ID</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {selectedContactDetail.mail_id || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Secondary Mail ID</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {selectedContactDetail.secondary_email || 'N/A'}
                </div>
              </div>
            </div>

            {/* Social handles list */}
            {selectedContactDetail.social_ids && Object.values(selectedContactDetail.social_ids).some(Boolean) && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Social Profiles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {selectedContactDetail.social_ids.linkedin && (
                    <span style={{ fontSize: '0.78rem', color: '#0a66c2' }}>
                      LinkedIn: {selectedContactDetail.social_ids.linkedin}
                    </span>
                  )}
                  {selectedContactDetail.social_ids.twitter && (
                    <span style={{ fontSize: '0.78rem', color: '#1da1f2' }}>
                      Twitter: {selectedContactDetail.social_ids.twitter}
                    </span>
                  )}
                  {selectedContactDetail.social_ids.github && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                      GitHub: {selectedContactDetail.social_ids.github}
                    </span>
                  )}
                  {selectedContactDetail.social_ids.instagram && (
                    <span style={{ fontSize: '0.78rem', color: '#e1306c' }}>
                      IG: {selectedContactDetail.social_ids.instagram}
                    </span>
                  )}
                  {selectedContactDetail.social_ids.whatsapp && (
                    <span style={{ fontSize: '0.78rem', color: '#25d366' }}>
                      WhatsApp: {selectedContactDetail.social_ids.whatsapp}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Context Notes */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              padding: '0.85rem',
              borderRadius: '8px',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Merged Context & Relationship Notes
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {selectedContactDetail.context_notes || 'No context logged yet.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedContactDetail(null);
                  handleOpenEdit(selectedContactDetail);
                }}
              >
                Edit Contact
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedContactDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CONTACT                                      */}
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
                <Contact size={20} color="var(--accent-pink)" />
                <h2 className="modal-title">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h2>
              </div>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveContact}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Name (Contact Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe / Sarah Parker"
                    value={formData.mobile_name}
                    onChange={(e) => setFormData({ ...formData, mobile_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Secondary Mobile Number</label>
                  <input
                    type="text"
                    placeholder="Optional backup phone"
                    value={formData.secondary_number}
                    onChange={(e) => setFormData({ ...formData, secondary_number: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Mail ID</label>
                  <input
                    type="email"
                    placeholder="john@company.com"
                    value={formData.mail_id}
                    onChange={(e) => setFormData({ ...formData, mail_id: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Secondary Mail ID</label>
                  <input
                    type="email"
                    placeholder="john.personal@gmail.com"
                    value={formData.secondary_email}
                    onChange={(e) => setFormData({ ...formData, secondary_email: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Social IDs */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Social Profiles & IDs</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <input
                      type="text"
                      placeholder="LinkedIn handle / url"
                      value={formData.social_ids.linkedin}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_ids: { ...formData.social_ids, linkedin: e.target.value }
                      })}
                      className="form-input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Twitter / X handle"
                      value={formData.social_ids.twitter}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_ids: { ...formData.social_ids, twitter: e.target.value }
                      })}
                      className="form-input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="GitHub username"
                      value={formData.social_ids.github}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_ids: { ...formData.social_ids, github: e.target.value }
                      })}
                      className="form-input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Instagram username"
                      value={formData.social_ids.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_ids: { ...formData.social_ids, instagram: e.target.value }
                      })}
                      className="form-input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp / Infosys"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Tech Lead"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    placeholder="Client, VIP, Investor"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Context Notes (Preserved & Merged on Duplication)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Met at Cloud Summit 2026. Interested in Orbita enterprise subscription."
                  value={formData.context_notes}
                  onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContact ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
