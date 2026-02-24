import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCMVTable } from '@/components/cmv/ProductCMVTable';
import type { ProductSale } from '@/types';

const products: ProductSale[] = [
  { nomeProduto: 'Camiseta', quantidade: 5, valorUnitario: 50, valorTotal: 250, contas: [1] },
  { nomeProduto: 'Calça', quantidade: 3, valorUnitario: 80, valorTotal: 240, contas: [1] },
];

function renderTable(
  overrides: {
    initialCmvs?: Record<string, number>;
    onSaveAndContinue?: jest.Mock;
    prods?: ProductSale[];
  } = {}
) {
  const onSave = overrides.onSaveAndContinue ?? jest.fn().mockResolvedValue(undefined);
  return {
    onSave,
    ...render(
      <ProductCMVTable
        products={overrides.prods ?? products}
        initialCmvs={overrides.initialCmvs ?? {}}
        onSaveAndContinue={onSave}
      />
    ),
  };
}

describe('ProductCMVTable', () => {
  describe('rendering', () => {
    it('displays all products in the table', () => {
      renderTable();
      expect(screen.getByText('Camiseta')).toBeInTheDocument();
      expect(screen.getByText('Calça')).toBeInTheDocument();
    });

    it('displays column headers', () => {
      renderTable();
      expect(screen.getByRole('columnheader', { name: /Produto/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Qtd Vendida/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Preço Médio/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /CMV Unitário/i })).toBeInTheDocument();
    });

    it('shows pending counter when all CMVs are empty', () => {
      renderTable({ initialCmvs: {} });
      expect(screen.getByText(/2 produtos sem CMV/i)).toBeInTheDocument();
    });

    it('shows singular counter when only 1 CMV is missing', () => {
      renderTable({ initialCmvs: { Camiseta: 10 } });
      expect(screen.getByText(/1 produto sem CMV/i)).toBeInTheDocument();
    });

    it('hides the counter when all CMVs are filled', () => {
      renderTable({ initialCmvs: { Camiseta: 10, Calça: 20 } });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('pre-fills inputs from initialCmvs', () => {
      renderTable({ initialCmvs: { Camiseta: 12.5 } });
      const input = screen.getByLabelText('CMV de Camiseta') as HTMLInputElement;
      expect(input.value).toBe('12.5');
    });

    it('renders the save button', () => {
      renderTable();
      expect(screen.getByRole('button', { name: /Salvar e Continuar/i })).toBeInTheDocument();
    });
  });

  describe('amber pending highlight', () => {
    it('applies amber border class to rows without CMV', () => {
      renderTable({ initialCmvs: {} });
      const row = screen.getByText('Camiseta').closest('tr');
      expect(row).toHaveClass('border-l-amber-400');
    });

    it('does not apply amber border to rows with CMV filled', () => {
      renderTable({ initialCmvs: { Camiseta: 10, Calça: 20 } });
      const row = screen.getByText('Camiseta').closest('tr');
      expect(row).not.toHaveClass('border-l-amber-400');
    });
  });

  describe('inline editing', () => {
    it('updates pending counter as user fills inputs', async () => {
      const user = userEvent.setup();
      renderTable();

      expect(screen.getByText(/2 produtos sem CMV/i)).toBeInTheDocument();

      const input = screen.getByLabelText('CMV de Camiseta');
      await user.clear(input);
      await user.type(input, '10');

      expect(screen.getByText(/1 produto sem CMV/i)).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows error when CMV is not a positive number', async () => {
      const user = userEvent.setup();
      renderTable();

      const input = screen.getByLabelText('CMV de Camiseta');
      await user.clear(input);
      await user.type(input, '-5');

      expect(screen.getByText(/CMV deve ser maior que zero/i)).toBeInTheDocument();
    });

    it('shows error when CMV equals the sale price', async () => {
      const user = userEvent.setup();
      renderTable();

      const input = screen.getByLabelText('CMV de Camiseta');
      await user.clear(input);
      await user.type(input, '50'); // Camiseta valorUnitario = 50

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert').textContent).toMatch(/menor que/i);
    });

    it('shows error when CMV exceeds the sale price', async () => {
      const user = userEvent.setup();
      renderTable();

      const input = screen.getByLabelText('CMV de Camiseta');
      await user.clear(input);
      await user.type(input, '99'); // > 50

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('clears error when valid value is entered after invalid one', async () => {
      const user = userEvent.setup();
      renderTable();

      const input = screen.getByLabelText('CMV de Camiseta');
      await user.type(input, '99');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      await user.clear(input);
      await user.type(input, '20');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not call onSaveAndContinue when there are validation errors', async () => {
      const user = userEvent.setup();
      const { onSave } = renderTable({ initialCmvs: { Camiseta: 99, Calça: 20 } });
      // Camiseta CMV 99 >= valorUnitario 50 — invalid

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('save behaviour', () => {
    it('calls onSaveAndContinue with filled CMV data', async () => {
      const user = userEvent.setup();
      const { onSave } = renderTable({ initialCmvs: { Camiseta: 10, Calça: 25 } });

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));

      expect(onSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          { productName: 'Camiseta', cmvUnitario: 10 },
          { productName: 'Calça', cmvUnitario: 25 },
        ])
      );
    });

    it('omits products without a CMV value from the save payload', async () => {
      const user = userEvent.setup();
      const { onSave } = renderTable({ initialCmvs: { Camiseta: 10 } });
      // Calça has no CMV

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));

      expect(onSave).toHaveBeenCalledWith([{ productName: 'Camiseta', cmvUnitario: 10 }]);
    });

    it('shows loading spinner on the button while saving', async () => {
      const user = userEvent.setup();
      let resolve: () => void;
      const onSave = jest.fn(
        () => new Promise<void>((r) => { resolve = r; })
      );

      renderTable({ initialCmvs: { Camiseta: 10 }, onSaveAndContinue: onSave });

      await user.click(screen.getByRole('button', { name: /Salvar e Continuar/i }));
      expect(screen.getByRole('button', { name: /Salvando/i })).toBeDisabled();

      // Resolve the promise inside act to flush state updates
      await act(async () => { resolve!(); });
    });
  });

  describe('accessibility', () => {
    it('each CMV input has an accessible label', () => {
      renderTable();
      expect(screen.getByLabelText('CMV de Camiseta')).toBeInTheDocument();
      expect(screen.getByLabelText('CMV de Calça')).toBeInTheDocument();
    });

    it('input is marked aria-invalid when it has an error', async () => {
      const user = userEvent.setup();
      renderTable();

      const input = screen.getByLabelText('CMV de Camiseta');
      await user.type(input, '-1');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('pending counter has role=status', () => {
      renderTable();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
