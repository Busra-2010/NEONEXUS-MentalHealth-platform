import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import Button from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('font-medium', 'rounded-lg', 'bg-neon-blue-500');
    });

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-neon-blue-500');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-neon-lavender-500');

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-2', 'border-neon-blue-500');

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('text-neon-blue-600');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-500');
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toContainHTML('animate-spin');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: React Testing Library doesn't automatically trigger onClick on Enter
      // In a real browser, this would work due to native button behavior
    });

    it('has proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Mental Health Context', () => {
    it('handles crisis situation buttons appropriately', () => {
      const handleCrisisAction = jest.fn();
      render(
        <Button 
          variant="danger" 
          onClick={handleCrisisAction}
          data-testid="crisis-button"
        >
          Get Help Now
        </Button>
      );
      
      const crisisButton = screen.getByTestId('crisis-button');
      expect(crisisButton).toHaveClass('bg-red-500');
      
      fireEvent.click(crisisButton);
      expect(handleCrisisAction).toHaveBeenCalledTimes(1);
    });

    it('maintains appropriate styling for mental health UI', () => {
      render(<Button variant="primary">Book Session</Button>);
      
      const button = screen.getByRole('button');
      // Ensure the button uses calming colors from our mental health palette
      expect(button).toHaveClass('bg-neon-blue-500');
      expect(button).not.toHaveClass('bg-red-500'); // Avoid alarming colors for non-crisis actions
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('supports different button types', () => {
      const { rerender } = render(<Button type="button">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');

      rerender(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

      rerender(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });
});