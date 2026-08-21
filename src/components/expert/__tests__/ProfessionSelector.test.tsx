import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfessionSelector } from '../ProfessionSelector';

describe('ProfessionSelector Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with required placeholder "Search your profession..."', () => {
    render(<ProfessionSelector value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search your profession...')).toBeInTheDocument();
  });

  it('filters professions case-insensitively when typing "soft"', async () => {
    const user = userEvent.setup();
    render(<ProfessionSelector value="" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search your profession...');
    await user.type(input, 'soft');

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Civil Engineer')).not.toBeInTheDocument();
  });

  it('selects a predefined profession and invokes onChange with isCustom = false', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ProfessionSelector value="" onChange={handleChange} />);

    const profButton = screen.getByText('Software Engineer');
    await user.click(profButton);

    expect(handleChange).toHaveBeenCalledWith('Software Engineer', false);
  });

  it('shows no-results state when search query matches nothing', async () => {
    const user = userEvent.setup();
    render(<ProfessionSelector value="" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search your profession...');
    await user.type(input, 'NonExistentProfession123');

    expect(screen.getByText('No matching professions found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use custom profession \(\+ Other\)/i })).toBeInTheDocument();
  });

  it('opens custom profession input when "+ Other" is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ProfessionSelector value="" onChange={handleChange} />);

    const otherButton = screen.getByRole('button', { name: /\+ Other/i });
    await user.click(otherButton);

    expect(screen.getByLabelText(/Enter your profession/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Quantum Computing Specialist/i)).toBeInTheDocument();
  });

  it('validates custom profession input and rejects empty/whitespace input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ProfessionSelector value="+ Other" onChange={handleChange} />);

    const customInput = screen.getByLabelText(/Enter your profession/i);
    await user.clear(customInput);
    await user.type(customInput, '   ');

    expect(screen.getByText(/Please enter your profession/i)).toBeInTheDocument();
  });

  it('accepts valid custom profession and passes sanitized text with isCustom = true', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ProfessionSelector value="+ Other" onChange={handleChange} />);

    const customInput = screen.getByLabelText(/Enter your profession/i);
    await user.type(customInput, 'Quantum Computing Researcher');

    expect(handleChange).toHaveBeenLastCalledWith('Quantum Computing Researcher', true);
  });
});
