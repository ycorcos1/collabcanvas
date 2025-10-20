import React, { useRef, useEffect } from "react";
import { Text, Transformer, Group } from "react-konva";
import Konva from "konva";

interface TextBoxProps {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  isSelected: boolean;
  isEditing: boolean;
  visible?: boolean; // Add visibility support
  width: number;
  height: number;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  onTextChange: (text: string) => void;
  onEditingChange: (editing: boolean) => void;
  onSelect: (event?: any) => void;
  onDragEnd: (x: number, y: number) => void;
  onResize?: (x: number, y: number, width: number, height: number) => void;
}

export const TextBox: React.FC<TextBoxProps> = ({
  x,
  y,
  text,
  fontSize,
  fontFamily,
  fill,
  isSelected,
  isEditing,
  visible = true,
  width,
  height,
  align = "left",
  lineHeight = 1.2,
  onTextChange,
  onEditingChange,
  onSelect,
  onDragEnd,
  onResize,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && !isEditing) {
      const transformer = transformerRef.current;
      const textNode = textRef.current;

      if (transformer && textNode) {
        transformer.nodes([textNode]);
        transformer.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, isEditing]);

  // Handle text editing (textarea overlay)
  useEffect(() => {
    if (!isEditing) return;

    const textNode = textRef.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    if (!stage) return;

    // Create textarea for editing
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    // Position textarea over the text
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    // Style textarea to match text
    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width = Math.max(textNode.width(), 100) + "px";
    textarea.style.height = Math.max(textNode.height(), 50) + "px";
    textarea.style.fontSize = fontSize + "px";
    textarea.style.fontFamily = fontFamily;
    textarea.style.color = fill;
    textarea.style.background = "transparent";
    textarea.style.border = "2px solid #4A90E2";
    textarea.style.borderRadius = "4px";
    textarea.style.padding = "4px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.resize = "none";
    textarea.style.outline = "none";
    textarea.style.lineHeight = String(lineHeight);
    textarea.style.zIndex = "1000";

    // Focus and select all text
    textarea.focus();
    textarea.select();

    // Handle textarea events
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter inserts newline; finish with Cmd/Ctrl+Enter or Escape
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdKey = isMac ? (e as any).metaKey : (e as any).ctrlKey;
      if ((cmdKey && e.key === "Enter") || e.key === "Escape") {
        e.preventDefault();
        finishEditing();
      }
    };

    const handleBlur = () => {
      finishEditing();
    };

    const finishEditing = () => {
      onTextChange(textarea.value);
      onEditingChange(false);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
      // After text updates, compute height from content and persist
      requestAnimationFrame(() => {
        const node = textRef.current;
        if (!node || !onResize) return;
        const newWidth = Math.max(50, node.width());
        node.getLayer()?.batchDraw();
        const newHeight = Math.max(24, node.height());
        onResize(node.x(), node.y(), newWidth, newHeight);
      });
    };

    // Keep overlay positioned on scroll/resize
    const reposition = () => {
      const pos = textNode.absolutePosition();
      const box = stage.container().getBoundingClientRect();
      textarea.style.top = box.top + pos.y + "px";
      textarea.style.left = box.left + pos.x + "px";
      textarea.style.width = Math.max(textNode.width(), 100) + "px";
      textarea.style.height = Math.max(textNode.height(), 50) + "px";
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("blur", handleBlur);

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("blur", handleBlur);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // Only re-run when isEditing state changes (not when text/styles change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleClick = (e: any) => {
    onSelect(e);
  };

  const handleDoubleClick = () => {
    onEditingChange(true);
  };

  const handleDragEnd = (e: any) => {
    const node = e.target;
    // Text uses corner-based positioning, so just report x, y directly
    onDragEnd(node.x(), node.y());
  };

  // Width-only resize: adjust width and recompute height; avoid font scaling
  const handleTransformEnd = () => {
    const textNode = textRef.current;
    if (!textNode || !onResize) return;
    const scaleX = textNode.scaleX();
    // lock vertical scale
    textNode.scaleY(1);
    const newWidth = Math.max(50, textNode.width() * scaleX);
    textNode.scaleX(1);
    textNode.width(newWidth);
    textNode.getLayer()?.batchDraw();
    const newHeight = Math.max(24, textNode.height());
    onResize(textNode.x(), textNode.y(), newWidth, newHeight);
  };

  return (
    <Group visible={visible}>
      <Text
        ref={textRef}
        x={x}
        y={y}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={fill}
        width={width}
        height={height}
        wrap="word"
        align={align}
        lineHeight={lineHeight}
        draggable={!isEditing}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragEnd={handleDragEnd}
        visible={!isEditing}
        stroke={isSelected ? "#4A90E2" : undefined}
        strokeWidth={isSelected ? 1 : 0}
      />

      {/* Transformer for resize handles when selected and not editing */}
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          onTransformEnd={handleTransformEnd}
          enabledAnchors={["middle-left", "middle-right"]}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraints
            if (newBox.width < 50 || newBox.height < 24) {
              return oldBox;
            }
            return newBox;
          }}
          anchorStroke="#4A90E2"
          anchorFill="white"
          anchorSize={8}
          borderStroke="#4A90E2"
          borderDash={[3, 3]}
        />
      )}
    </Group>
  );
};
