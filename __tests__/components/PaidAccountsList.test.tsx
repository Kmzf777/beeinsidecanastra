import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaidAccountsList } from '@/components/categorias/PaidAccountsList';
import type { CategoryType } from '@/components/categorias/PaidAccountsList';
import type { PaidAccount } from '@/types';

const accounts: PaidAccount[] = [
  {
    id: '101-1',
    descricao: 'Aluguel',
    valor: 3000,
    dataPagamento: '2026-01-10',
    contaOrigem: 1,
    fornecedor: 'Imobiliária XYZ',
  },
  {
    id: '102-1',
    descricao: 'Matéria-Prima',
    valor: 1500,
    dataPagamento: '2026-01-15',
    contaOrigem: 1,
    fornecedor: 'Fornecedor ABC',
  },
  {
    id: '103-2',
    descricao: 'Frete',
    valor: 500,
    dataPagamento: '2026-01-20',
    contaOrigem: 2,
    fornecedor: '',
  },
];

function renderList(
  overrides: {
    initialCategories?: Record<string, CategoryType>;
    onSaveAndContinue?: jest.Mock;
    accts?: PaidAccount[];
  } = {}
) {
  const onSave = overrides.onSaveAndContinue ?? jest.fn().mockResolvedValue(undefined);
  return {
    onSave,
    ...render(
      <PaidAccountsList
        accounts={overrides.accts ?? accounts}
        initialCategories={overrides.initialCategories ?? {}}
        onSaveAndContinue={onSave}
      />
    ),
  };
}

describe('PaidAccountsList', () => {
  describe('rendering', () => {
    it('displays all accounts in the table', () => {
      renderList();
      expect(screen.getByText('Aluguel')).toBeInTheDocument();
      expect(screen.getByText('Matéria-Prima')).toBeInTheDocument();
      expect(screen.getByText('Frete')).toBeInTheDocument();
    });

    it('displays column headers', () => {
      renderList();
      expect(screen.getByRole('columnheader', { name: /Descrição/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Valor/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Data de Pagamento/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Fornecedor/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Categoria/i })).toBeInTheDocument();
    });

    it('formats dates as DD/MM/YYYY', () => {
      renderList();
      expect(screen.getByText('10/01/2026')).toBeInTheDocument();
    });

    it('shows fornecedor name', () => {
      renderList();
      expect(screen.getByText('Imobiliária XYZ')).toBeInTheDocument();
      expect(screen.getByText('Fornecedor ABC')).toBeInTheDocument();
    });

    it('shows dash when fornecedor is empty', () => {
      renderList();
      // Frete has empty fornecedor, should show "—"
      const rows = screen.getAllByRole('row');
      const freteRow = rows.find((r) => r.textContent?.includes('Frete'));
      expect(freteRow?.textContent).toContain('—');
    });

    it('renders the save button', () => {
      renderList();
      expect(screen.getByRole('button', { name: /Salvar e Continuar/i })).toBeInTheDocument();
    });

    it('renders 3 category buttons per row', () => {
      renderList();
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(accounts.length * 3);
    });
  });

  describe('default categories', () => {
    it('defaults all accounts to "Ignorar" when no initialCategories provided', () => {
      renderList();
      const ignorarButtons = screen.getAllByRole('radio', { name: /Ignorar/i });
      for (const btn of ignorarButtons) {
        expect(btn).toHaveAttribute('aria-checked', 'true');
      }
    });
  });

  describe('auto-suggestion by description (AC: 3)', () => {
    it('pre-selects category from initialCategories (case-insensitive normalized key)', () => {
      renderList({
        initialCategories: {
          aluguel: 'Despesa',     // normalized form of "Aluguel"
          'matéria-prima': 'Custo de Produto',
        },
      });

      const aluguelGroup = screen.getByRole('radiogroup', { name: /Categoria para Aluguel/i });
      const despesaBtn = aluguelGroup.querySelector('[aria-label="Despesa"]');
      expect(despesaBtn).toHaveAttribute('aria-checked', 'true');

      const materiaGroup = screen.getByRole('radiogroup', { name: /Categoria para Matéria-Prima/i });
      const custoBtn = materiaGroup.querySelector('[aria-label="Custo de Produto"]');
      expect(custoBtn).toHaveAttribute('aria-checked', 'true');
    });

    it('falls back to "Ignorar" when no suggestion found for an account', () => {
      renderList({ initialCategories: { aluguel: 'Despesa' } });
      // Frete has no suggestion → should be Ignorar
      const freteGroup = screen.getByRole('radiogroup', { name: /Categoria para Frete/i });
      const ignorarBtn = freteGroup.querySelector('[aria-label="Ignorar"]');
      expect(ignorarBtn).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('real-time totals (AC: 4)', () => {
    it('starts with R$ 0,00 for both totals when all accounts are Ignorar', () => {
      renderList();
      expect(screen.getByLabelText(/Total despesas:/i).textContent).toMatch(/R\$\s*0/);
      expect(screen.getByLabelText(/Total custo de produto:/i).textContent).toMatch(/R\$\s*0/);
    });

    it('updates Despesas total in real-time when category is changed to Despesa', async () => {
      const user = userEvent.setup();
      renderList();

      const aluguelGroup = screen.getByRole('radiogroup', { name: /Categoria para Aluguel/i });
      const despesaBtn = aluguelGroup.querySelector('[aria-label="Despesa"]') as HTMLElement;
      await user.click(despesaBtn);

      // Aluguel = R$ 3.000,00
      expect(screen.getByLabelText(/Total despesas:/i).textContent).toMatch(/3\.000/);
    });

    it('updates Custo de Produto total in real-time', async () => {
      const user = userEvent.setup();
      renderList();

      const materiaGroup = screen.getByRole('radiogroup', {
        name: /Categoria para Matéria-Prima/i,
      });
      const custoBtn = materiaGroup.querySelector('[aria-label="Custo de Produto"]') as HTMLElement;
      await user.click(custoBtn);

      // Matéria-Prima = R$ 1.500,00
      expect(screen.getByLabelText(/Total custo de produto:/i).textContent).toMatch(/1\.500/);
    });

    it('accumulates totals from multiple accounts', async () => {
      const user = userEvent.setup();
      renderList();

      const aluguelGroup = screen.getByRole('radiogroup', { name: /Categoria para Aluguel/i });
      const freteGroup = screen.getByRole('radiogroup', { name: /Categoria para Frete/i });

      await user.click(aluguelGroup.querySelector('[aria-label="Despesa"]') as HTMLElement);
      await user.click(freteGroup.querySelector('[aria-label="Despesa"]') as HTMLElement);

      // Aluguel (3000) + Frete (500) = 3500
      expect(screen.getByLabelText(/Total despesas:/i).textContent).toMatch(/3\.500/);
    });

    it('"Ignorar" does NOT add to any total (AC: 4)', async () => {
      const user = userEvent.setup();
      // Start with all as Despesa
      renderList({
        initialCategories: {
          aluguel: 'Despesa',
          'matéria-prima': 'Despesa',
          frete: 'Despesa',
        },
      });

      // Change Aluguel to Ignorar
      const aluguelGroup = screen.getByRole('radiogroup', { name: /Categoria para Aluguel/i });
      await user.click(aluguelGroup.querySelector('[aria-label="Ignorar"]') as HTMLElement);

      // Total should be 1500 + 500 = 2000, NOT 3000 + 1500 + 500
      expect(screen.getByLabelText(/Total despesas:/i).textContent).toMatch(/2\.000/);
      // Aluguel 3000 should NOT be counted
      expect(screen.getByLabelText(/Total despesas:/i).textContent).not.toMatch(/3\.0/);
    });

    it('moves value between totals when category changes', async () => {
      const user = userEvent.setup();
      renderList({ initialCategories: { aluguel: 'Despesa' } });

      // Aluguel starts as Despesa
      expect(screen.getByLabelText(/Total despesas:/i).textContent).toMatch(/3\.000/);

      // Change to Custo de Produto
      const aluguelGroup = screen.getByRole('radiogroup', { name: /Categoria para Aluguel/i });
      await user.click(
        aluguelGroup.querySelector('[aria-label="Custo de Produto"]') as HTMLElement
      );

      expect(screen.getByLabelText(/Total despesas:/i).textContent).toMatch(/R\$\s*0/);
      expect(screen.getByLabelText(/Total custo de produto:/i).textContent).toMatch(/3\.000/);
    });
  });

  describe('save behaviour (AC: 5)', () => {
    it('calls onSaveAndContinue with only Despesa and Custo de Produto entries', async () => {
      const user = userEvent.setup();
      const { onSave } = renderList({
        initialCategories: {
          aluguel: 'Despesa',
          'matéria-prima': 'Custo de Produto',
          // frete stays Ignorar
        },
      });

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));

      expect(onSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          { description: 'Aluguel', category: 'Despesa' },
          { description: 'Matéria-Prima', category: 'Custo de Produto' },
        ])
      );
      // Frete (Ignorar) should NOT be in the payload
      const callArg = onSave.mock.calls[0][0] as { description: string; category: CategoryType }[];
      expect(callArg.find((c) => c.description === 'Frete')).toBeUndefined();
    });

    it('calls onSaveAndContinue with empty array when all are Ignorar', async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));
      expect(onSave).toHaveBeenCalledWith([]);
    });

    it('shows loading spinner on the button while saving', async () => {
      const user = userEvent.setup();
      let resolve: () => void;
      const onSave = jest.fn(
        () => new Promise<void>((r) => { resolve = r; })
      );

      renderList({ onSaveAndContinue: onSave });

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));
      expect(screen.getByRole('button', { name: /Salvando/i })).toBeDisabled();

      await act(async () => { resolve!(); });
    });
  });

  describe('accessibility', () => {
    it('each row has a radiogroup with accessible label', () => {
      renderList();
      expect(
        screen.getByRole('radiogroup', { name: /Categoria para Aluguel/i })
      ).toBeInTheDocument();
    });

    it('summary cards have aria-live for screen readers', () => {
      renderList();
      const despesasEl = screen.getByLabelText(/Total despesas:/i);
      expect(despesasEl).toHaveAttribute('aria-live', 'polite');
      const custoEl = screen.getByLabelText(/Total custo de produto:/i);
      expect(custoEl).toHaveAttribute('aria-live', 'polite');
    });
  });
});
