import React, { useState } from "react";
import { Button, Input, Modal } from "../shared";

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (email: string, keepAsCollaborator: boolean) => Promise<void>;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
}) => {
  const [email, setEmail] = useState("");
  const [keep, setKeep] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await onTransfer(email.trim(), keep);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Ownership">
      <div style={{ padding: "var(--space-4)", display: "grid", gap: 12 }}>
        <p>
          Enter the email of the new owner. You can choose to remain as a
          collaborator after the transfer.
        </p>
        <Input
          label="New Owner Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={keep}
            onChange={(e) => setKeep(e.target.checked)}
          />
          Keep me as a collaborator after transfer
        </label>
        {error && <div className="error-message">{error}</div>}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || !email.trim()}
          >
            Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
};


