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

const CANVAS_ID = "default"; // For MVP, we'll use a single canvas

// Convert Firestore document to Shape
const firestoreToShape = (docData: DocumentData): Shape => ({
  id: docData.id,
  type: docData.type,
  x: docData.x,
  y: docData.y,
  width: docData.width,
  height: docData.height,
  color: docData.color,
  createdBy: docData.createdBy,
  createdAt: docData.createdAt?.toMillis?.() || docData.createdAt,
  updatedAt: docData.updatedAt?.toMillis?.() || docData.updatedAt,
  // Selection fields
  selectedBy: docData.selectedBy,
  selectedByName: docData.selectedByName,
  selectedByColor: docData.selectedByColor,
  selectedAt: docData.selectedAt?.toMillis?.() || docData.selectedAt,
});

// Convert Shape to Firestore document
const shapeToFirestore = (shape: Omit<Shape, "id">): DocumentData => ({
  type: shape.type,
  x: shape.x,
  y: shape.y,
  width: shape.width,
  height: shape.height,
  color: shape.color,
  createdBy: shape.createdBy,
  createdAt: Timestamp.fromMillis(shape.createdAt),
  updatedAt: Timestamp.fromMillis(shape.updatedAt),
});

// Get shapes collection reference
const getShapesCollection = () => {
  return collection(firestore, `canvases/${CANVAS_ID}/shapes`);
};

// Create a new shape
export const createShape = async (
  shapeData: CreateShapeData
): Promise<string> => {
  console.log("🔥 SHAPES - Creating shape with data:", shapeData);
  const shapesCollection = getShapesCollection();
  const now = Date.now();

  const shapeWithTimestamps = {
    ...shapeData,
    createdAt: now,
    updatedAt: now,
  };

  console.log("🔥 SHAPES - Shape with timestamps:", shapeWithTimestamps);
  console.log("🔥 SHAPES - Firestore data:", shapeToFirestore(shapeWithTimestamps));

  try {
    const docRef = await addDoc(
      shapesCollection,
      shapeToFirestore(shapeWithTimestamps)
    );
    console.log("🔥 SHAPES - Shape created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("🔥 SHAPES ERROR - Failed to create shape:", error);
    throw error;
  }
};

// Update an existing shape
export const updateShape = async (
  shapeId: string,
  updates: Partial<Shape>
): Promise<void> => {
  const shapeDoc = doc(firestore, `canvases/${CANVAS_ID}/shapes`, shapeId);

  const firestoreUpdates: Partial<DocumentData> = {};

  if (updates.x !== undefined) firestoreUpdates.x = updates.x;
  if (updates.y !== undefined) firestoreUpdates.y = updates.y;
  if (updates.width !== undefined) firestoreUpdates.width = updates.width;
  if (updates.height !== undefined) firestoreUpdates.height = updates.height;
  if (updates.color !== undefined) firestoreUpdates.color = updates.color;

  firestoreUpdates.updatedAt = Timestamp.now();

  await updateDoc(shapeDoc, firestoreUpdates);
};

// Delete a shape
export const deleteShape = async (shapeId: string): Promise<void> => {
  const shapeDoc = doc(firestore, `canvases/${CANVAS_ID}/shapes`, shapeId);
  await deleteDoc(shapeDoc);
};

// Select/deselect a shape for collaborative editing
export const selectShape = async (
  shapeId: string,
  userId: string,
  userName: string,
  userColor: string
): Promise<void> => {
  const shapeRef = doc(firestore, `canvases/${CANVAS_ID}/shapes`, shapeId);
  await updateDoc(shapeRef, {
    selectedBy: userId,
    selectedByName: userName,
    selectedByColor: userColor,
    selectedAt: Date.now(),
    updatedAt: Timestamp.now(),
  });
};

// Deselect a shape
export const deselectShape = async (shapeId: string): Promise<void> => {
  const shapeRef = doc(firestore, `canvases/${CANVAS_ID}/shapes`, shapeId);
  await updateDoc(shapeRef, {
    selectedBy: deleteField(),
    selectedByName: deleteField(),
    selectedByColor: deleteField(),
    selectedAt: deleteField(),
    updatedAt: Timestamp.now(),
  });
};

// Clear all selections by a specific user (cleanup when user disconnects)
export const clearUserSelections = async (userId: string): Promise<void> => {
  const shapesRef = collection(firestore, `canvases/${CANVAS_ID}/shapes`);
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
};

// Subscribe to shapes changes
export const subscribeToShapes = (
  callback: (shapes: Shape[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  console.log("🔥 SHAPES - Starting subscription to shapes...");
  const shapesCollection = getShapesCollection();
  const q = query(shapesCollection, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("🔥 SHAPES - Received snapshot with", snapshot.docs.length, "documents");
      const shapes: Shape[] = [];

      snapshot.forEach((doc) => {
        const shape = firestoreToShape({ id: doc.id, ...doc.data() });
        console.log("🔥 SHAPES - Parsed shape:", shape);
        shapes.push(shape);
      });

      console.log("🔥 SHAPES - Final shapes array:", shapes);
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
  updates: Array<{ id: string; updates: Partial<Shape> }>
): Promise<void> => {
  const promises = updates.map(({ id, updates }) => updateShape(id, updates));
  await Promise.all(promises);
};
