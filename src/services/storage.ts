import { ref, deleteObject } from "firebase/storage";
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
 * For now, we'll use base64 data URLs to avoid Firebase Storage configuration issues
 * @param file - The image file to upload
 * @returns Promise<string> - The data URL of the processed image
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
    console.log("Starting photo upload process...");
    
    // Compress the image first
    const compressedFile = await compressImage(file, 200, 0.7);
    console.log("Image compressed successfully");
    
    // Convert to base64 data URL
    const dataURL = await fileToDataURL(compressedFile);
    console.log("Image converted to data URL");
    
    // Update the user's profile with the data URL
    await updateProfile(user, {
      photoURL: dataURL
    });
    
    console.log("Profile updated successfully");
    return dataURL;
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert a file to a data URL
 * @param file - The file to convert
 * @returns Promise<string> - The data URL
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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
