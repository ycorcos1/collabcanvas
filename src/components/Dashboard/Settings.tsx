import React, { useState } from "react";
import { useAuth } from "../Auth/AuthProvider";
import { useTheme } from "../../hooks/useTheme";
import { Button, Input, Avatar } from "../shared";

/**
 * Settings Page - User preferences and account management
 * 
 * Features:
 * - Profile management (name, email, avatar)
 * - Theme selection (light/dark/system)
 * - Account actions (sign out, delete account)
 * - Export data (future)
 * - Notification preferences (future)
 */
export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement profile update
      console.log("Saving profile:", profileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileData({
      displayName: user?.displayName || "",
      email: user?.email || ""
    });
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your projects.")) {
      // TODO: Implement account deletion
      console.log("Delete account requested");
    }
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "auto", label: "System", icon: "💻" }
  ] as const;

  return (
    <div className="settings">
      {/* Header */}
      <div className="settings-header">
        <div className="header-content">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-content">
        {/* Profile Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Profile</h2>
            <p>Update your personal information</p>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              <Avatar
                src={user?.photoURL}
                name={user?.displayName || user?.email || "User"}
                size="lg"
              />
              <Button variant="ghost" size="sm">
                Change Photo
              </Button>
            </div>

            <div className="profile-form">
              {isEditing ? (
                <>
                  <Input
                    label="Display Name"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter your display name"
                    fullWidth
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    fullWidth
                    disabled // Email changes require re-authentication
                  />

                  <div className="profile-actions">
                    <Button
                      variant="primary"
                      onClick={handleProfileSave}
                      loading={isSaving}
                      disabled={isSaving}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleProfileCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-field">
                    <label>Display Name</label>
                    <span>{user?.displayName || "Not set"}</span>
                  </div>
                  
                  <div className="profile-field">
                    <label>Email</label>
                    <span>{user?.email}</span>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Appearance</h2>
            <p>Customize how CollabCanvas looks</p>
          </div>

          <div className="appearance-card">
            <div className="theme-selector">
              <label>Theme</label>
              <div className="theme-options">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`theme-option ${theme === option.value ? "active" : ""}`}
                    onClick={() => setTheme(option.value)}
                  >
                    <span className="theme-icon">{option.icon}</span>
                    <span className="theme-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data & Privacy Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Data & Privacy</h2>
            <p>Manage your data and privacy settings</p>
          </div>

          <div className="data-card">
            <div className="data-actions">
              <div className="data-action">
                <div className="action-info">
                  <h3>Export Data</h3>
                  <p>Download a copy of all your projects and data</p>
                </div>
                <Button variant="secondary" disabled>
                  Export (Coming Soon)
                </Button>
              </div>

              <div className="data-action">
                <div className="action-info">
                  <h3>Data Usage</h3>
                  <p>See how much storage you're using</p>
                </div>
                <Button variant="secondary" disabled>
                  View Usage (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Account</h2>
            <p>Account management and security</p>
          </div>

          <div className="account-card">
            <div className="account-actions">
              <div className="account-action">
                <div className="action-info">
                  <h3>Sign Out</h3>
                  <p>Sign out of your CollabCanvas account</p>
                </div>
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>

              <div className="account-action danger">
                <div className="action-info">
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all data</p>
                </div>
                <Button variant="danger" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add settings styles
const style = document.createElement("style");
style.textContent = `
  .settings {
    min-height: 100vh;
    background-color: var(--bg-primary);
  }

  .settings-header {
    padding: var(--space-8) var(--space-6) var(--space-6);
    border-bottom: 1px solid var(--border-primary);
  }

  .header-content h1 {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .header-content p {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    margin: 0;
  }

  .settings-content {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-8) var(--space-6);
  }

  .settings-section {
    margin-bottom: var(--space-12);
  }

  .section-header {
    margin-bottom: var(--space-6);
  }

  .section-header h2 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .section-header p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0;
  }

  .profile-card,
  .appearance-card,
  .data-card,
  .account-card {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .profile-card {
    display: flex;
    gap: var(--space-6);
  }

  .profile-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .profile-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .profile-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .profile-field label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .profile-field span {
    font-size: var(--text-base);
    color: var(--text-primary);
  }

  .profile-actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  .theme-selector {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .theme-selector label {
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .theme-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-3);
  }

  .theme-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .theme-option:hover {
    border-color: var(--border-secondary);
    background: var(--interactive-secondary);
  }

  .theme-option.active {
    border-color: var(--interactive-primary);
    background: var(--interactive-primary-bg);
  }

  .theme-icon {
    font-size: var(--text-2xl);
  }

  .theme-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .data-actions,
  .account-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .data-action,
  .account-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
  }

  .account-action.danger {
    border-color: var(--status-error-border);
    background-color: var(--status-error-bg);
  }

  .action-info {
    flex: 1;
  }

  .action-info h3 {
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin: 0 0 var(--space-1) 0;
  }

  .account-action.danger .action-info h3 {
    color: var(--status-error);
  }

  .action-info p {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .settings-header {
      padding: var(--space-6) var(--space-4);
    }

    .header-content h1 {
      font-size: var(--text-2xl);
    }

    .header-content p {
      font-size: var(--text-base);
    }

    .settings-content {
      padding: var(--space-6) var(--space-4);
    }

    .profile-card {
      flex-direction: column;
      text-align: center;
    }

    .profile-actions {
      flex-direction: column;
    }

    .theme-options {
      grid-template-columns: 1fr;
    }

    .data-action,
    .account-action {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .data-action .btn,
    .account-action .btn {
      width: 100%;
    }
  }
`;

if (!document.head.querySelector("style[data-settings-styles]")) {
  style.setAttribute("data-settings-styles", "true");
  document.head.appendChild(style);
}
