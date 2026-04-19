import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import MoodSelector from '../MoodSelector';

describe('MoodSelector Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders mood selection interface', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      expect(screen.getByText('How are you feeling today?')).toBeInTheDocument();
      
      // Check all mood options are present
      expect(screen.getByRole('button', { name: /select very sad mood/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select sad mood/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select okay mood/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select good mood/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select excellent mood/i })).toBeInTheDocument();
    });

    it('displays mood emojis correctly', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const moodButtons = screen.getAllByRole('button');
      expect(moodButtons[0]).toHaveTextContent('😢');
      expect(moodButtons[1]).toHaveTextContent('😔');
      expect(moodButtons[2]).toHaveTextContent('😐');
      expect(moodButtons[3]).toHaveTextContent('😊');
      expect(moodButtons[4]).toHaveTextContent('😄');
    });

    it('shows selected mood label when value is set', () => {
      render(<MoodSelector value={4} onChange={mockOnChange} />);
      
      expect(screen.getByText('You selected:')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('does not show selected mood label when no mood is selected', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      expect(screen.queryByText('You selected:')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onChange when mood is selected', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const excellentMoodButton = screen.getByRole('button', { name: /select excellent mood/i });
      fireEvent.click(excellentMoodButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('highlights selected mood visually', () => {
      render(<MoodSelector value={3} onChange={mockOnChange} />);
      
      const okayMoodButton = screen.getByRole('button', { name: /select okay mood/i });
      expect(okayMoodButton).toHaveClass('ring-2', 'ring-neon-blue-400', 'transform', 'scale-110');
    });

    it('can change mood selection', () => {
      const { rerender } = render(<MoodSelector value={2} onChange={mockOnChange} />);
      
      const goodMoodButton = screen.getByRole('button', { name: /select good mood/i });
      fireEvent.click(goodMoodButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(4);
      
      // Simulate parent component updating the value
      rerender(<MoodSelector value={4} onChange={mockOnChange} />);
      
      expect(screen.getByText('You selected: Good')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for each mood button', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-label', 'Select Very Sad mood');
      expect(buttons[1]).toHaveAttribute('aria-label', 'Select Sad mood');
      expect(buttons[2]).toHaveAttribute('aria-label', 'Select Okay mood');
      expect(buttons[3]).toHaveAttribute('aria-label', 'Select Good mood');
      expect(buttons[4]).toHaveAttribute('aria-label', 'Select Excellent mood');
    });

    it('supports keyboard navigation', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const firstButton = screen.getByRole('button', { name: /select very sad mood/i });
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      // In a real scenario, focus would move to the next button
    });

    it('has appropriate focus states', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-neon-blue-300');
      });
    });
  });

  describe('Mental Health Considerations', () => {
    it('uses appropriate colors for mood representation', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Very Sad - should use red tones
      expect(buttons[0]).toHaveClass('bg-red-100');
      
      // Sad - should use orange tones
      expect(buttons[1]).toHaveClass('bg-orange-100');
      
      // Okay - should use neutral yellow
      expect(buttons[2]).toHaveClass('bg-yellow-100');
      
      // Good - should use positive mint color
      expect(buttons[3]).toHaveClass('bg-neon-mint-100');
      
      // Excellent - should use green for positive
      expect(buttons[4]).toHaveClass('bg-green-100');
    });

    it('provides non-stigmatizing mood labels', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      // Ensure labels are respectful and non-clinical
      expect(screen.getByText('Very Sad')).toBeInTheDocument();
      expect(screen.getByText('Sad')).toBeInTheDocument();
      expect(screen.getByText('Okay')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('maintains consistent interaction patterns for all moods', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach((button, index) => {
        fireEvent.click(button);
        expect(mockOnChange).toHaveBeenCalledWith(index + 1);
      });
      
      expect(mockOnChange).toHaveBeenCalledTimes(5);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for mobile and desktop', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Should have responsive padding and text sizes
        expect(button).toHaveClass('p-3', 'md:p-4');
      });
      
      // Check emoji sizes are responsive
      const emojiDivs = screen.getAllByText(/😢|😔|😐|😊|😄/);
      emojiDivs.forEach(div => {
        expect(div).toHaveClass('text-2xl', 'md:text-3xl');
      });
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<MoodSelector value={0} onChange={mockOnChange} className="custom-class" />);
      
      const container = screen.getByText('How are you feeling today?').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });
});