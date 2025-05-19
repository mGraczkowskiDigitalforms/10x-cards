import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleComponent } from '@/components/ExampleComponent';

describe('ExampleComponent', () => {
  it('renders with default initial count', () => {
    render(<ExampleComponent />);
    
    const countDisplay = screen.getByTestId('count-display');
    expect(countDisplay).toHaveTextContent('Count: 0');
  });

  it('renders with provided initial count', () => {
    render(<ExampleComponent initialCount={5} />);
    
    const countDisplay = screen.getByTestId('count-display');
    expect(countDisplay).toHaveTextContent('Count: 5');
  });

  it('increments count when increase button is clicked', () => {
    render(<ExampleComponent />);
    
    const incrementButton = screen.getByTestId('increment-button');
    fireEvent.click(incrementButton);
    
    const countDisplay = screen.getByTestId('count-display');
    expect(countDisplay).toHaveTextContent('Count: 1');
  });

  it('decrements count when decrease button is clicked', () => {
    render(<ExampleComponent initialCount={5} />);
    
    const decrementButton = screen.getByTestId('decrement-button');
    fireEvent.click(decrementButton);
    
    const countDisplay = screen.getByTestId('count-display');
    expect(countDisplay).toHaveTextContent('Count: 4');
  });

  it('calls onCountChange callback when count changes', () => {
    const handleCountChange = vi.fn();
    render(<ExampleComponent onCountChange={handleCountChange} />);
    
    const incrementButton = screen.getByTestId('increment-button');
    fireEvent.click(incrementButton);
    
    expect(handleCountChange).toHaveBeenCalledTimes(1);
    expect(handleCountChange).toHaveBeenCalledWith(1);
    
    const decrementButton = screen.getByTestId('decrement-button');
    fireEvent.click(decrementButton);
    
    expect(handleCountChange).toHaveBeenCalledTimes(2);
    expect(handleCountChange).toHaveBeenCalledWith(0);
  });
}); 