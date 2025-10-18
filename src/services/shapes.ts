import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  deleteField,
  getDocs,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { firestore } from "./firebase";
import { Shape, CreateShapeData } from "../types/shape";

// No longer using a hardcoded CANVAS_ID - each project has its own shapes collection

// Convert Firestore document to Shape
const firestoreToShape = (docData: DocumentData): Shape => ({
  id: docData.id,
  type: docData.type,
  x: docData.x,
  y: docData.y,
  width: docData.width,
  height: docData.height,
  color: docData.color,
  zIndex: docData.zIndex || 0, // Default to 0 if not set
  createdBy: docData.createdBy,
  createdAt: docData.createdAt?.toMillis?.() || docData.createdAt,
  updatedAt: docData.updatedAt?.toMillis?.() || docData.updatedAt,
  // Text properties
  text: docData.text,
  fontSize: docData.fontSize,
  fontFamily: docData.fontFamily,
  // Drawing properties
  points: docData.points,
  strokeWidth: docData.strokeWidth,
  // Selection fields
  selectedBy: docData.selectedBy,
  selectedByName: docData.selectedByName,
  selectedByColor: docData.selectedByColor,
  selectedAt: docData.selectedAt?.toMillis?.() || docData.selectedAt,
});

// Convert Shape to Firestore document
const shapeToFirestore = (shape: Omit<Shape, "id">): DocumentData => {
  const data: DocumentData = {
    type: shape.type,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    color: shape.color,
    zIndex: shape.zIndex,
    createdBy: shape.createdBy,
    createdAt: Timestamp.fromMillis(shape.createdAt),
    updatedAt: Timestamp.fromMillis(shape.updatedAt),
  };

  // Add text properties if they exist
  if (shape.text !== undefined) data.text = shape.text;
  if (shape.fontSize !== undefined) data.fontSize = shape.fontSize;
  if (shape.fontFamily !== undefined) data.fontFamily = shape.fontFamily;

  // Add drawing properties if they exist
  if (shape.points !== undefined) data.points = shape.points;
  if (shape.strokeWidth !== undefined) data.strokeWidth = shape.strokeWidth;

  return data;
};

// Get shapes collection reference for a specific project
const getShapesCollection = (projectId: string) => {
  return collection(firestore, `projects/${projectId}/shapes`);
};

/**
 * Creates a new shape in Firestore
 * @param shapeData - Shape creation data without timestamps
 * @returns Promise resolving to the new shape's ID
 */
export const createShape = async (
  projectId: string,
  shapeData: CreateShapeData
): Promise<string> => {
  const shapesCollection = getShapesCollection(projectId);
  const now = Date.now();

  const shapeWithTimestamps = {
    ...shapeData,
    zIndex: shapeData.zIndex ?? 0, // Ensure zIndex is always set
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(
      shapesCollection,
      shapeToFirestore(shapeWithTimestamps)
    );
    return docRef.id;
  } catch (error: any) {
    // Silently fail if parent project doesn't exist yet (new unsaved project)
    if (
      error.code === "not-found" ||
      error.message?.includes("No document to update") ||
      error.message?.includes("NOT_FOUND")
    ) {
      // Return a temporary ID - shapes will be synced when project is saved
      return crypto.randomUUID();
    }
    console.error("🔥 SHAPES ERROR - Failed to create shape:", error);
    throw error;
  }
};

// Update an existing shape
export const updateShape = async (
  projectId: string,
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> => {
  try {
    const shapeDoc = doc(firestore, `projects/${projectId}/shapes`, shapeId);

    const firestoreUpdates: Partial<DocumentData> = {};

    // Core properties
    if (updates.x !== undefined) firestoreUpdates.x = updates.x;
    if (updates.y !== undefined) firestoreUpdates.y = updates.y;
    if (updates.width !== undefined) firestoreUpdates.width = updates.width;
    if (updates.height !== undefined) firestoreUpdates.height = updates.height;
    if (updates.color !== undefined) firestoreUpdates.color = updates.color;
    if (updates.zIndex !== undefined) firestoreUpdates.zIndex = updates.zIndex;

    // Text properties
    if (updates.text !== undefined) firestoreUpdates.text = updates.text;
    if (updates.fontSize !== undefined)
      firestoreUpdates.fontSize = updates.fontSize;
    if (updates.fontFamily !== undefined)
      firestoreUpdates.fontFamily = updates.fontFamily;

    // Drawing properties
    if (updates.points !== undefined) firestoreUpdates.points = updates.points;
    if (updates.strokeWidth !== undefined)
      firestoreUpdates.strokeWidth = updates.strokeWidth;

    // Always update timestamp
    firestoreUpdates.updatedAt = Timestamp.now();

    await updateDoc(shapeDoc, firestoreUpdates);
  } catch (error: any) {
    // Silently fail if project/shape doesn't exist yet (new unsaved project)
    if (
      error.code === "not-found" ||
      error.message?.includes("No document to update")
    ) {
      return; // Shape updates handled by local state for unsaved projects
    }
    throw error; // Re-throw other errors
  }
};

// Delete a shape
export const deleteShape = async (
  projectId: string,
  shapeId: string
): Promise<void> => {
  try {
    const shapeDoc = doc(firestore, `projects/${projectId}/shapes`, shapeId);
    await deleteDoc(shapeDoc);
  } catch (error: any) {
    // Silently fail if project/shape doesn't exist yet (new unsaved project)
    if (
      error.code === "not-found" ||
      error.message?.includes("No document to update")
    ) {
      return; // Shape deletion handled by local state for unsaved projects
    }
    throw error; // Re-throw other errors
  }
};

// Select/deselect a shape for collaborative editing
export const selectShape = async (
  projectId: string,
  shapeId: string,
  userId: string,
  userName: string,
  userColor: string
): Promise<void> => {
  try {
    const shapeRef = doc(firestore, `projects/${projectId}/shapes`, shapeId);
    await updateDoc(shapeRef, {
      selectedBy: userId,
      selectedByName: userName,
      selectedByColor: userColor,
      selectedAt: Date.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    // Silently fail if project/shape doesn't exist yet (new unsaved project)
    if (
      error.code === "not-found" ||
      error.message?.includes("No document to update")
    ) {
      return; // Shape selection is optional for unsaved projects
    }
    throw error; // Re-throw other errors
  }
};

// Deselect a shape
export const deselectShape = async (
  projectId: string,
  shapeId: string
): Promise<void> => {
  try {
    const shapeRef = doc(firestore, `projects/${projectId}/shapes`, shapeId);
    await updateDoc(shapeRef, {
      selectedBy: deleteField(),
      selectedByName: deleteField(),
      selectedByColor: deleteField(),
      selectedAt: deleteField(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    // Silently fail if project/shape doesn't exist yet (new unsaved project)
    if (
      error.code === "not-found" ||
      error.message?.includes("No document to update")
    ) {
      return; // Shape deselection is optional for unsaved projects
    }
    throw error; // Re-throw other errors
  }
};

// Clear all selections by a specific user (cleanup when user disconnects)
export const clearUserSelections = async (
  projectId: string,
  userId: string
): Promise<void> => {
  try {
    const shapesRef = collection(firestore, `projects/${projectId}/shapes`);
    const q = query(shapesRef, where("selectedBy", "==", userId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        selectedBy: deleteField(),
        selectedByName: deleteField(),
        selectedByColor: deleteField(),
        selectedAt: deleteField(),
        updatedAt: Timestamp.now(),
      });
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  } catch (error: any) {
    // Silently fail if project doesn't exist yet (new unsaved project)
    if (
      error.code === "not-found" ||
      error.message?.includes("No document") ||
      error.code === "permission-denied"
    ) {
      return; // Selection cleanup not needed for unsaved projects
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Real-time subscription to shape changes
 * @param callback - Function called with updated shapes array
 * @param onError - Optional error handler for connection issues
 * @returns Unsubscribe function to clean up the listener
 */
export const subscribeToShapes = (
  projectId: string,
  callback: (shapes: Shape[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const shapesCollection = getShapesCollection(projectId);
  const q = query(shapesCollection, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const shapes: Shape[] = [];

      snapshot.forEach((doc) => {
        const shape = firestoreToShape({ id: doc.id, ...doc.data() });
        shapes.push(shape);
      });

      callback(shapes);
    },
    (error) => {
      console.error("🔥 SHAPES ERROR - Error listening to shapes:", error);
      console.error("🔥 SHAPES ERROR - Error code:", error.code);
      console.error("🔥 SHAPES ERROR - Error message:", error.message);
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
};

// Batch operations for performance
export const batchUpdateShapes = async (
  projectId: string,
  updates: Array<{ id: string; updates: Partial<Shape> }>
): Promise<void> => {
  const promises = updates.map(({ id, updates }) =>
    updateShape(projectId, id, updates)
  );
  await Promise.all(promises);
};
