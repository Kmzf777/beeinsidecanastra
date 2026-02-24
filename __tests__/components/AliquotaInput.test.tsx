import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AliquotaInput } from '@/components/aliquota/AliquotaInput';
import type { AliquotaPreviewProduct } from '@/components/aliquota/AliquotaInput';

const sampleProduct: AliquotaPreviewProduct = {
  name: 'Camiseta',
  price: 100,
};

function renderInput(
  value: string,
  onChange = jest.fn(),
  product: AliquotaPreviewProduct | null = sampleProduct
) {
  return render(
    <AliquotaInput value={value} onChange={onChange} previewProduct={product} />
  );
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('AliquotaInput — validation', () => {
  it('renders the label and hint', () => {
    renderInput('');
    expect(screen.getByLabelText('Alíquota de Imposto (%)')).toBeInTheDocument();
    expect(screen.getByText(/Ex: 6 para Simples Nacional/)).toBeInTheDocument();
  });

  it('shows no error when field is empty', () => {
    renderInput('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no error for valid value 0', () => {
    renderInput('0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no error for valid value 100', () => {
    renderInput('100');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no error for decimal value 6.5', () => {
    renderInput('6.5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows error for value -1', () => {
    renderInput('-1');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A alíquota deve ser entre 0% e 100%'
    );
  });

  it('shows error for value 101', () => {
    renderInput('101');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A alíquota deve ser entre 0% e 100%'
    );
  });

  it('shows error for non-numeric input', () => {
    renderInput('abc');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A alíquota deve ser entre 0% e 100%'
    );
  });

  it('calls onChange when user types', async () => {
    const onChange = jest.fn();
    render(<AliquotaInput value="" onChange={onChange} previewProduct={null} />);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(screen.getByLabelText('Alíquota de Imposto (%)'), '6');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('AliquotaInput — preview calculation', () => {
  it('shows placeholder when value is empty', () => {
    renderInput('');
    act(() => jest.runAllTimers());
    expect(screen.getByTestId('preview-placeholder')).toBeInTheDocument();
  });

  it('shows placeholder when value is invalid', () => {
    renderInput('-1');
    act(() => jest.runAllTimers());
    expect(screen.getByTestId('preview-placeholder')).toBeInTheDocument();
  });

  it('shows preview text with correct calculation for 6%', () => {
    renderInput('6');
    act(() => jest.runAllTimers());
    const preview = screen.getByTestId('preview-text');
    expect(preview).toHaveTextContent('Camiseta');
    expect(preview).toHaveTextContent('R$ 100,00');
    expect(preview).toHaveTextContent('R$ 6,00');
    expect(preview).toHaveTextContent('R$ 94,00');
  });

  it('shows preview text with correct calculation for 50%', () => {
    renderInput('50');
    act(() => jest.runAllTimers());
    const preview = screen.getByTestId('preview-text');
    expect(preview).toHaveTextContent('R$ 50,00'); // imposto
    expect(preview).toHaveTextContent('R$ 50,00'); // liquido
  });

  it('shows preview text for 0% — no tax', () => {
    renderInput('0');
    act(() => jest.runAllTimers());
    const preview = screen.getByTestId('preview-text');
    expect(preview).toHaveTextContent('R$ 0,00'); // zero tax
    expect(preview).toHaveTextContent('R$ 100,00'); // full price net
  });

  it('shows no preview section when previewProduct is null', () => {
    renderInput('6', jest.fn(), null);
    act(() => jest.runAllTimers());
    expect(screen.queryByTestId('preview-text')).not.toBeInTheDocument();
    expect(screen.queryByTestId('preview-placeholder')).not.toBeInTheDocument();
  });
});
