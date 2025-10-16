import { useAuth } from '../components/Auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  arrayUnion 
} from 'firebase/firestore';
import { firestore as db } from '../services/firebase';

/**
 * Hook for managing collaboration request actions
 */
export const useCollaborationRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const acceptRequest = async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get the collaboration request
      const requestsRef = collection(db, 'collaborationRequests');
      const requestQuery = query(requestsRef, where('__name__', '==', requestId));
      const requestSnapshot = await getDocs(requestQuery);
      
      if (requestSnapshot.empty) {
        throw new Error('Collaboration request not found');
      }

      const requestDoc = requestSnapshot.docs[0];
      const requestData = requestDoc.data();

      // Update request status to 'accepted'
      await updateDoc(doc(db, 'collaborationRequests', requestId), {
        status: 'accepted',
        acceptedAt: Timestamp.now()
      });

      // Add user as collaborator to the project
      const projectRef = doc(db, 'projects', requestData.projectId);
      await updateDoc(projectRef, {
        collaborators: arrayUnion(user.id),
        updatedAt: Timestamp.now()
      });

      // Navigate to the project canvas
      navigate(`/canvas/${requestData.projectSlug || requestData.projectId}`);
      
    } catch (error) {
      console.error('Error accepting collaboration request:', error);
      throw error;
    }
  };

  const denyRequest = async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update request status to 'denied'
      await updateDoc(doc(db, 'collaborationRequests', requestId), {
        status: 'denied',
        deniedAt: Timestamp.now()
      });
      
    } catch (error) {
      console.error('Error denying collaboration request:', error);
      throw error;
    }
  };

  const sendCollaborationRequest = async (
    projectId: string,
    projectName: string,
    recipientEmail: string,
    message?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if recipient exists (in a real app, you'd have a users collection)
      // For now, we'll assume the email is valid and create the request
      
      // Check if request already exists
      const requestsRef = collection(db, 'collaborationRequests');
      const existingRequestQuery = query(
        requestsRef,
        where('projectId', '==', projectId),
        where('fromUserId', '==', user.id),
        where('toUserEmail', '==', recipientEmail),
        where('status', 'in', ['pending', 'accepted'])
      );
      
      const existingSnapshot = await getDocs(existingRequestQuery);
      if (!existingSnapshot.empty) {
        const existingRequest = existingSnapshot.docs[0].data();
        if (existingRequest.status === 'accepted') {
          throw new Error('This user is already a collaborator on this project');
        } else {
          throw new Error('A collaboration request has already been sent to this user');
        }
      }

      // Create new collaboration request
      await addDoc(requestsRef, {
        projectId,
        projectName,
        fromUserId: user.id,
        fromUserName: user.displayName || user.email || 'Unknown User',
        fromUserEmail: user.email,
        toUserEmail: recipientEmail,
        toUserId: null, // Will be populated when we have user lookup
        message: message || '',
        status: 'pending',
        createdAt: Timestamp.now()
      });

      // In a real app, you would also:
      // 1. Create a notification for the recipient
      // 2. Send an email notification
      // 3. Update any real-time listeners
      
      return { success: true, message: 'Collaboration request sent!' };
      
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      throw error;
    }
  };

  return {
    acceptRequest,
    denyRequest,
    sendCollaborationRequest,
  };
};
