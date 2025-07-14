
import { useState } from 'react';

// Global batch ID that persists across component re-renders during a save operation
let currentBatchId: string | null = null;

export const useBatchOperations = () => {
  const [isInBatch, setIsInBatch] = useState(false);

  const startBatch = () => {
    currentBatchId = crypto.randomUUID();
    setIsInBatch(true);
    console.log('Started batch operation with ID:', currentBatchId);
  };

  const endBatch = () => {
    currentBatchId = null;
    setIsInBatch(false);
    console.log('Ended batch operation');
  };

  const getCurrentBatchId = () => currentBatchId;

  return {
    isInBatch,
    startBatch,
    endBatch,
    getCurrentBatchId
  };
};
