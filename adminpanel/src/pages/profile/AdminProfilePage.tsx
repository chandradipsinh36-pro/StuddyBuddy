import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Shield, Key, Save, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';

import apiClient from '../../api/client';

export const AdminProfilePage: React.FC = () => {
  const { adminUser, updateAdminUser } = useAdminAuth();

  const [name, setName] = useState(adminUser?.name || 'Admin Chief');
  const [email] = useState(adminUser?.email || 'admin@studybuddy.com');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const { data } = await apiClient.patch('/users/me', { name: name.trim() });
      updateAdminUser({ name: data.data.name });
      toast.success('Admin profile details updated.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.patch('/users/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Admin password updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            color: 'var(--color-gray-900)',
            letterSpacing: '-0.02em',
          }}
        >
          Administrator Profile & Security
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
          Manage your console credentials, view authorization role permissions, and update authentication factors.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-5)',
          flexWrap: 'wrap',
        }}
      >
        <img
          src={adminUser?.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminChief'}
          alt={adminUser?.name || 'Admin'}
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            border: '3px solid var(--color-primary-100)',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
              {adminUser?.name}
            </h3>
            <span className="badge badge-admin">SUPER ADMINISTRATOR</span>
            <StatusBadge status="active" label="Active" />
            <StatusBadge status="verified" label="Verified" />
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 4 }}>
            {adminUser?.email} • Account created Jan 2024
          </div>
        </div>
      </div>

      {/* Two-Column Configuration Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Profile Info Form */}
        <div className="admin-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <UserIcon size={18} color="var(--color-primary-500)" />
            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
              Profile Details
            </h4>
          </div>

          <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read Only)</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-gray-400)' }}
                />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  disabled
                  style={{ paddingLeft: 38, backgroundColor: 'var(--color-bg-subtle)' }}
                />
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', marginTop: 2 }}>
                Admin email modification requires root environment variable reconfiguration.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Role</label>
              <input
                type="text"
                className="form-input"
                value="System Administrator (Full Privileges)"
                disabled
                style={{ backgroundColor: 'var(--color-bg-subtle)' }}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
            >
              <Save size={16} />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="admin-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <Key size={18} color="var(--color-primary-500)" />
            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
              Security & Authentication
            </h4>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-gray-400)' }}
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-gray-400)' }}
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-gray-400)' }}
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm matching password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
            >
              <Shield size={16} />
              <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
