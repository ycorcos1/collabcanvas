import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { storage, auth } from "./firebase";

/**
 * Storage service for handling file uploads
 * 
 * Features:
 * - Profile photo upload and management
 * - Image compression and validation
 * - Firebase Storage integration
 * - User profile updates
 */

/**
 * Upload a profile photo for the current user
 * @param file - The image file to upload
 * @returns Promise<string> - The download URL of the uploaded image
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to upload photos");
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error("File must be an image");
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image size must be less than 5MB");
  }

  try {
    // Create a reference to the user's profile photo
    const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}-${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(photoRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update the user's profile with the new photo URL
    await updateProfile(user, {
      photoURL: downloadURL
    });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    throw new Error("Failed to upload photo. Please try again.");
  }
}

/**
 * Delete a profile photo from storage
 * @param photoURL - The URL of the photo to delete
 */
export async function deleteProfilePhoto(photoURL: string): Promise<void> {
  try {
    const photoRef = ref(storage, photoURL);
    await deleteObject(photoRef);
  } catch (error) {
    console.error("Error deleting profile photo:", error);
    // Don't throw error for deletion failures as the main goal is to update the profile
  }
}

/**
 * Compress an image file before upload
 * @param file - The original image file
 * @param maxWidth - Maximum width for the compressed image
 * @param quality - Compression quality (0-1)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File, 
  maxWidth: number = 400, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
