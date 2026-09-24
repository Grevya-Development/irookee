import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelector, CategoryItem } from '../CategorySelector';

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Technology', description: 'Software engineering, AI, cloud computing, and hardware' },
  { id: 'cat-2', name: 'Business & Entrepreneurship', description: 'Startups, venture capital, and business strategy' },
  { id: 'cat-3', name: 'Health & Wellness', description: 'Physical health, mental wellness, nutrition, and fitness' },
  { id: 'cat-4', name: 'Design & Creative', description: 'UI/UX design, graphic design, and brand identity' },
  { id: 'cat-5', name: 'Data Science & AI', description: 'Machine learning, big data analytics, and artificial intelligence' },
  { id: 'cat-6', name: 'Finance & Investing', description: 'Personal finance, fintech, crypto, and accounting' },
  { id: 'cat-7', name: 'Education & Career', description: 'Study abroad, career coaching, and skill development' },
];

describe('CategorySelector Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input with descriptive placeholder and search icon', () => {
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search categories/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search categories (e.g. Technology, Health, Business)...');
  });

  it('renders all categories by default when search query is empty', () => {
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
      />
    );

    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Health & Wellness')).toBeInTheDocument();
    expect(screen.getByText('Finance & Investing')).toBeInTheDocument();
    expect(screen.getByText(/Showing all 7 categories/i)).toBeInTheDocument();
  });

  it('filters available categories immediately while typing (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search categories/i });
    await user.type(input, 'tech');

    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Finance & Investing')).toBeInTheDocument(); // matches "fintech" in description
    expect(screen.queryByText('Health & Wellness')).not.toBeInTheDocument();
  });

  it('handles whitespace in search query correctly', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search categories/i });
    await user.type(input, '   design   ');

    expect(screen.getByText('Design & Creative')).toBeInTheDocument();
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
  });

  it('clearing search query restores all category options', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search categories/i });
    await user.type(input, 'wellness');

    expect(screen.getByText('Health & Wellness')).toBeInTheDocument();
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /clear search text/i });
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Health & Wellness')).toBeInTheDocument();
    expect(screen.getByText(/Showing all 7 categories/i)).toBeInTheDocument();
  });

  it('shows clear no-results state with a reset button when no categories match', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search categories/i });
    await user.type(input, 'ZzzNonExistentCategory999');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No categories matching "ZzzNonExistentCategory999"/i)).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /^Clear search$/i });
    await user.click(clearBtn);

    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('invokes onToggleCategory when clicking a category option', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={handleToggle}
      />
    );

    const techButton = screen.getByRole('button', { name: 'Technology' });
    expect(techButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(techButton);
    expect(handleToggle).toHaveBeenCalledWith('cat-1');
  });

  it('renders selected categories with visual checkmark and aria-pressed="true"', () => {
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={['cat-1', 'cat-4']}
        onToggleCategory={vi.fn()}
      />
    );

    const techButton = screen.getByRole('button', { name: 'Technology' });
    const designButton = screen.getByRole('button', { name: 'Design & Creative' });
    const healthButton = screen.getByRole('button', { name: 'Health & Wellness' });

    expect(techButton).toHaveAttribute('aria-pressed', 'true');
    expect(designButton).toHaveAttribute('aria-pressed', 'true');
    expect(healthButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('filters down to Suggested categories based on user profession and expertise from Stage 2', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
        userProfession="AI / Machine Learning Engineer"
        userExpertise="Deep Learning, Neural Networks"
      />
    );

    // The "Suggested" tab should appear because keywords match
    const suggestedTab = screen.getByRole('button', { name: /Suggested/i });
    expect(suggestedTab).toBeInTheDocument();

    await user.click(suggestedTab);

    // Technology and Data Science & AI match
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Data Science & AI')).toBeInTheDocument();
    expect(screen.queryByText('Health & Wellness')).not.toBeInTheDocument();
  });

  it('filters down to Selected tab to review currently selected categories', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={['cat-3']}
        onToggleCategory={vi.fn()}
      />
    );

    const selectedTab = screen.getByRole('button', { name: /Selected/i });
    await user.click(selectedTab);

    expect(screen.getByText('Health & Wellness')).toBeInTheDocument();
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
    expect(screen.queryByText('Design & Creative')).not.toBeInTheDocument();
  });

  it('calls onClearSelection when clicking the "Clear selection" action', async () => {
    const user = userEvent.setup();
    const handleClearSelection = vi.fn();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={['cat-1', 'cat-2']}
        onToggleCategory={vi.fn()}
        onClearSelection={handleClearSelection}
      />
    );

    const clearSelectionBtn = screen.getByRole('button', { name: /Clear selection/i });
    await user.click(clearSelectionBtn);

    expect(handleClearSelection).toHaveBeenCalledTimes(1);
  });

  it('handles empty or null Stage 2 profession/expertise values gracefully without crashing', () => {
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
        userProfession=""
        userExpertise=""
      />
    );

    expect(screen.getByText('Technology')).toBeInTheDocument();
    // Suggested tab should not be displayed when no suggestions match
    expect(screen.queryByRole('button', { name: /Suggested/i })).not.toBeInTheDocument();
  });

  it('does not create misleading suggestions from generic filler/role words', () => {
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
        userProfession="Senior Lead Consultant & Specialist"
        userExpertise="General services, 10 years experience"
      />
    );

    // No suggestions should be generated solely from generic stop words
    expect(screen.queryByRole('button', { name: /Suggested/i })).not.toBeInTheDocument();
  });

  it('preserves selected categories when switching between All, Suggested, and Selected tabs', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={['cat-1']}
        onToggleCategory={vi.fn()}
        userProfession="Software Engineer"
        userExpertise="Cloud Computing"
      />
    );

    // Check Technology is selected on "All" tab
    expect(screen.getByRole('button', { name: 'Technology' })).toHaveAttribute('aria-pressed', 'true');

    // Switch to Suggested tab
    const suggestedTab = screen.getByRole('button', { name: /Suggested/i });
    await user.click(suggestedTab);
    expect(screen.getByRole('button', { name: 'Technology' })).toHaveAttribute('aria-pressed', 'true');

    // Switch to Selected tab
    const selectedTab = screen.getByRole('button', { name: /Selected/i });
    await user.click(selectedTab);
    expect(screen.getByRole('button', { name: 'Technology' })).toHaveAttribute('aria-pressed', 'true');

    // Switch back to All tab
    const allTab = screen.getByRole('button', { name: /All/i });
    await user.click(allTab);
    expect(screen.getByRole('button', { name: 'Technology' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('clearing search query does not clear or alter existing user selections', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <CategorySelector
        categories={MOCK_CATEGORIES}
        selectedCategories={['cat-1', 'cat-3']}
        onToggleCategory={handleToggle}
      />
    );

    const input = screen.getByRole('textbox', { name: /search categories/i });
    await user.type(input, 'Technology');

    expect(screen.getByRole('button', { name: 'Technology' })).toHaveAttribute('aria-pressed', 'true');

    // Clear search using the clear button
    const clearButton = screen.getByRole('button', { name: /clear search text/i });
    await user.click(clearButton);

    // Both previously selected categories must still be selected
    expect(screen.getByRole('button', { name: 'Technology' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Health & Wellness' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(handleToggle).not.toHaveBeenCalled();
  });
});
