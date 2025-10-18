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
  onTextChange: (text: string) => void;
  onEditingChange: (editing: boolean) => void;
  onSelect: () => void;
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

  // Handle text editing
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
    textarea.style.lineHeight = "1.2";
    textarea.style.zIndex = "1000";

    // Focus and select all text
    textarea.focus();
    textarea.select();

    // Handle textarea events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEditing();
      } else if (e.key === "Escape") {
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
    };

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("blur", handleBlur);

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("blur", handleBlur);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };
    // Only re-run when isEditing state changes (not when text/styles change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleClick = () => {
    onSelect();
  };

  const handleDoubleClick = () => {
    onEditingChange(true);
  };

  const handleDragEnd = (e: any) => {
    const node = e.target;
    onDragEnd(node.x(), node.y());
  };

  const handleTransform = () => {
    const textNode = textRef.current;
    if (textNode && onResize) {
      const scaleX = textNode.scaleX();
      const scaleY = textNode.scaleY();

      // Calculate new font size based on scale
      const newFontSize = Math.max(8, fontSize * Math.max(scaleX, scaleY));

      // Reset scale and apply new font size
      textNode.scaleX(1);
      textNode.scaleY(1);
      textNode.fontSize(newFontSize);

      onResize(textNode.x(), textNode.y(), textNode.width(), textNode.height());
    }
  };

  return (
    <Group>
      <Text
        ref={textRef}
        x={x}
        y={y}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={fill}
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
          onTransform={handleTransform}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraints
            if (newBox.width < 20 || newBox.height < 10) {
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
