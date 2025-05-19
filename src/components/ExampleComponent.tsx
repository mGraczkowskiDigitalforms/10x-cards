import React, { useState } from 'react';

interface ExampleComponentProps {
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  initialCount = 0,
  onCountChange,
}) => {
  const [count, setCount] = useState(initialCount);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  const handleDecrement = () => {
    const newCount = count - 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Counter Example</h2>
      <p className="text-lg" data-testid="count-display">
        Count: {count}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDecrement}
          className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
          data-testid="decrement-button"
        >
          Decrease
        </button>
        <button
          onClick={handleIncrement}
          className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
          data-testid="increment-button"
        >
          Increase
        </button>
      </div>
    </div>
  );
}; 