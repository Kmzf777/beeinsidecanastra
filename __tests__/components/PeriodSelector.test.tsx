import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodSelector } from '@/components/ui/period-selector';
import { PeriodProvider, usePeriod } from '@/lib/context/period-context';

function TestHarness() {
  const { selectedPeriod } = usePeriod();
  return (
    <>
      <PeriodSelector />
      <output data-testid="period-output">
        {selectedPeriod.month}/{selectedPeriod.year}
      </output>
    </>
  );
}

function renderWithProvider() {
  return render(
    <PeriodProvider>
      <TestHarness />
    </PeriodProvider>,
  );
}

describe('PeriodSelector', () => {
  it('defaults to the current month and year', () => {
    renderWithProvider();
    const now = new Date();
    expect(screen.getByTestId('period-output').textContent).toBe(
      `${now.getMonth() + 1}/${now.getFullYear()}`,
    );
  });

  it('updates the context when a different month is selected', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    const monthSelect = screen.getByLabelText('Mês', { selector: 'select' });
    await user.selectOptions(monthSelect, '3'); // Março

    const now = new Date();
    expect(screen.getByTestId('period-output').textContent).toBe(`3/${now.getFullYear()}`);
  });

  it('updates the context when a different year is selected', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    const yearSelect = screen.getByLabelText('Ano', { selector: 'select' });
    const targetYear = String(new Date().getFullYear() - 1);
    await user.selectOptions(yearSelect, targetYear);

    const now = new Date();
    expect(screen.getByTestId('period-output').textContent).toBe(
      `${now.getMonth() + 1}/${targetYear}`,
    );
  });

  it('has accessible labels for both dropdowns', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Mês', { selector: 'select' })).toBeInTheDocument();
    expect(screen.getByLabelText('Ano', { selector: 'select' })).toBeInTheDocument();
  });
});
