import React, { useState } from "react";
import { useAuth } from "../Auth/AuthProvider";
import { useTheme } from "../../hooks/useTheme";
import { Button, Input, Avatar, Modal } from "../shared";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../../services/firebase";

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
    email: user?.email || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage] = useState(""); // Removed setter - profile upload disabled

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

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
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your projects."
      )
    ) {
      // TODO: Implement account deletion
      console.log("Delete account requested");
    }
  };

  // Profile picture upload DISABLED - Storage not configured
  // Users will use default avatar based on their initials

  const handlePasswordChange = async () => {
    if (!user?.email) {
      setPasswordError("User email not found");
      return;
    }

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.newPassword);

      // Reset form and close
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error("Error changing password:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("New password is too weak");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError("Please sign out and sign back in, then try again");
      } else {
        setPasswordError("Failed to update password. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError(""); // Clear error when user types
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: "☀" },
    { value: "dark", label: "Dark", icon: "☾" },
    { value: "auto", label: "System", icon: "⚙" },
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
              {/* Profile picture upload disabled - Storage not configured */}
            </div>

            <div className="profile-form">
              {isEditing ? (
                <>
                  <Input
                    label="Display Name"
                    value={profileData.displayName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Enter your display name"
                    fullWidth
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
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
            <p>Customize how HØRIZON looks</p>
          </div>

          <div className="appearance-card">
            <div className="theme-selector">
              <label>Theme</label>
              <div className="theme-options">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`theme-option ${
                      theme === option.value ? "active" : ""
                    }`}
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
                  <h3>Change Password</h3>
                  <p>Update your account password</p>
                </div>
                {!showPasswordForm ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordError("");
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {showPasswordForm && (
                <div className="password-form-section">
                  <div className="password-form">
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordInputChange(
                          "currentPassword",
                          e.target.value
                        )
                      }
                      placeholder="Enter your current password"
                      fullWidth
                      error={
                        passwordError &&
                        passwordError.includes("Current password")
                          ? passwordError
                          : undefined
                      }
                    />

                    <Input
                      label="New Password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordInputChange("newPassword", e.target.value)
                      }
                      placeholder="Enter your new password (min 6 characters)"
                      fullWidth
                      error={
                        passwordError && passwordError.includes("New password")
                          ? passwordError
                          : undefined
                      }
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordInputChange(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                      placeholder="Confirm your new password"
                      fullWidth
                      error={
                        passwordError && passwordError.includes("do not match")
                          ? passwordError
                          : undefined
                      }
                    />

                    {passwordError &&
                      !passwordError.includes("Current password") &&
                      !passwordError.includes("New password") &&
                      !passwordError.includes("do not match") && (
                        <div className="password-error">{passwordError}</div>
                      )}

                    <div className="password-form-actions">
                      <Button
                        variant="primary"
                        onClick={handlePasswordChange}
                        loading={isChangingPassword}
                        disabled={
                          isChangingPassword ||
                          !passwordData.currentPassword ||
                          !passwordData.newPassword ||
                          !passwordData.confirmPassword
                        }
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="account-action">
                <div className="action-info">
                  <h3>Sign Out</h3>
                  <p>Sign out of your HØRIZON account</p>
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

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Upload Error"
      >
        <div style={{ padding: "var(--space-4)" }}>
          <p>{errorMessage}</p>
          <div style={{ marginTop: "var(--space-4)", textAlign: "right" }}>
            <Button onClick={() => setShowErrorModal(false)}>OK</Button>
          </div>
        </div>
      </Modal>
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

  .password-form-section {
    width: 100%;
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-primary);
  }

  .password-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 400px;
  }

  .password-form .form-group {
    gap: var(--space-1);
  }

  .password-form-actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }

  .password-error {
    color: var(--status-error);
    font-size: var(--text-sm);
    padding: var(--space-2);
    background-color: var(--status-error-bg);
    border: 1px solid var(--status-error);
    border-radius: var(--radius-sm);
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
