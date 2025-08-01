import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import DraggableRecipient from './DraggableRecipient';

interface Recipient {
  id: string;
  name: string;
  emails: string[];
  role: 'signer' | 'reviewer' | 'cc';
}

interface RecipientListProps {
  recipients: Recipient[];
  onReorderRecipients: (recipients: Recipient[]) => void;
  onRemoveRecipient: (id: string) => void;
  onUpdateRecipient: (id: string, updates: Partial<Recipient>) => void;
  onAddEmailToRecipient: (recipientId: string, email: string) => void;
  onRemoveEmailFromRecipient: (recipientId: string, emailIndex: number) => void;
  onInsertField: (recipientId: string, type: 'signature' | 'initial' | 'date') => void;
  getFieldCount: (recipientId: string, type: 'signature' | 'initial' | 'date') => number;
  signInOrder: boolean;
}

const RecipientList: React.FC<RecipientListProps> = ({
  recipients,
  onReorderRecipients,
  onRemoveRecipient,
  onUpdateRecipient,
  onAddEmailToRecipient,
  onRemoveEmailFromRecipient,
  onInsertField,
  getFieldCount,
  signInOrder
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = recipients.findIndex((recipient) => recipient.id === active.id);
      const newIndex = recipients.findIndex((recipient) => recipient.id === over.id);

      const newRecipients = arrayMove(recipients, oldIndex, newIndex);
      onReorderRecipients(newRecipients);
    }
  };

  // Only show drag mode in step 2 when signing order is enabled
  // In step 1, always show the full edit interface
  const showDragMode = signInOrder && window.location.hash !== '#step1';

  if (showDragMode) {
    // Drag-and-drop mode for signing order
    return (
      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext items={recipients.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <DraggableRecipient
                  key={recipient.id}
                  recipient={recipient}
                  index={index}
                  onRemove={onRemoveRecipient}
                  onUpdateRecipient={onUpdateRecipient}
                  onAddEmail={onAddEmailToRecipient}
                  onRemoveEmail={onRemoveEmailFromRecipient}
                  onInsertField={onInsertField}
                  getFieldCount={getFieldCount}
                  isDragMode={true}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

      </div>
    );
  }

  // Regular edit mode (existing functionality)
  return (
    <div className="space-y-4">
      {recipients.map((recipient, index) => (
        <DraggableRecipient
          key={recipient.id}
          recipient={recipient}
          index={index}
          onRemove={onRemoveRecipient}
          onUpdateRecipient={onUpdateRecipient}
          onAddEmail={onAddEmailToRecipient}
          onRemoveEmail={onRemoveEmailFromRecipient}
          onInsertField={onInsertField}
          getFieldCount={getFieldCount}
          isDragMode={false}
        />
      ))}
    </div>
  );
};

export default RecipientList;