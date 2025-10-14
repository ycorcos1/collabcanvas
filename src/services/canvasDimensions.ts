import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { firestore } from "./firebase";

export interface CanvasDimensions {
  width: number;
  height: number;
  updatedAt: number;
  updatedBy: string;
}

export const DEFAULT_CANVAS_DIMENSIONS = {
  width: 10000,
  height: 8000,
};

const CANVAS_DIMENSIONS_DOC_ID = "global-canvas-dimensions";

export const subscribeToCanvasDimensions = (
  callback: (dimensions: CanvasDimensions) => void,
  errorCallback?: (error: any) => void
) => {
  const docRef = doc(firestore, "canvasDimensions", CANVAS_DIMENSIONS_DOC_ID);

  return onSnapshot(
    docRef, 
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as CanvasDimensions;
        callback(data);
      } else {
        // If document doesn't exist, create it with default dimensions
        const defaultDimensions: CanvasDimensions = {
          ...DEFAULT_CANVAS_DIMENSIONS,
          updatedAt: Date.now(),
          updatedBy: "system",
        };
        setDoc(docRef, defaultDimensions).catch((error) => {
          console.error("Failed to create default canvas dimensions:", error);
          // Still call callback with default dimensions even if save fails
          callback(defaultDimensions);
        });
        callback(defaultDimensions);
      }
    },
    (error) => {
      console.error("Canvas dimensions subscription error:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
};

export const updateCanvasDimensions = async (
  width: number,
  height: number,
  userId: string
): Promise<void> => {
  const docRef = doc(firestore, "canvasDimensions", CANVAS_DIMENSIONS_DOC_ID);

  const newDimensions: CanvasDimensions = {
    width,
    height,
    updatedAt: Date.now(),
    updatedBy: userId,
  };

  await setDoc(docRef, newDimensions);
};

export const resetCanvasDimensions = async (userId: string): Promise<void> => {
  return updateCanvasDimensions(
    DEFAULT_CANVAS_DIMENSIONS.width,
    DEFAULT_CANVAS_DIMENSIONS.height,
    userId
  );
};

export const getCanvasDimensions = async (): Promise<CanvasDimensions> => {
  const docRef = doc(firestore, "canvasDimensions", CANVAS_DIMENSIONS_DOC_ID);
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    return docSnapshot.data() as CanvasDimensions;
  } else {
    // Return default dimensions if document doesn't exist
    return {
      ...DEFAULT_CANVAS_DIMENSIONS,
      updatedAt: Date.now(),
      updatedBy: "system",
    };
  }
};
