// Ownership transfer disabled
// Note: Kept file to avoid breaking imports. All functions throw.

// const INVITES = "invitations_transfer";
// const USERS = "users";
// const PROJECTS = "projects";

export async function createTransferInvite(
  _projectId: string,
  _fromUserId: string,
  _toEmail: string,
  _keepOriginalAsCollaborator: boolean
): Promise<string> {
  throw new Error("Ownership transfer is disabled.");
}

export async function listInvitesForUser(_userId: string) {
  // With ownership transfer disabled, there are no invites
  return [] as any[];
}

export async function acceptTransferInvite(
  _inviteId: string,
  _acceptorId: string
) {
  throw new Error("Ownership transfer is disabled.");
}

export async function declineTransferInvite(
  _inviteId: string,
  _userId: string
) {
  throw new Error("Ownership transfer is disabled.");
}

export async function cancelTransferInvite(
  _inviteId: string,
  _ownerId: string
) {
  throw new Error("Ownership transfer is disabled.");
}
