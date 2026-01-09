import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from '../SearchInput';

describe('SearchInput Component', () => {
  test('renders input with placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Buscar..." />);
    
    const input = screen.getByPlaceholderText('Buscar...');
    expect(input).toBeInTheDocument();
  });

  test('displays current value', () => {
    render(<SearchInput value="test value" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test value');
  });

  test('calls onChange when user types', () => {
    const handleChange = jest.fn();
    render(<SearchInput value="" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new text' } });
    
    expect(handleChange).toHaveBeenCalledWith('new text');
  });

  test('shows clear button when value is not empty', () => {
    render(<SearchInput value="some text" onChange={() => {}} />);
    
    const clearButton = screen.getByRole('button', { name: /limpar busca/i });
    expect(clearButton).toBeInTheDocument();
  });

  test('hides clear button when value is empty', () => {
    render(<SearchInput value="" onChange={() => {}} />);
    
    const clearButton = screen.queryByRole('button', { name: /limpar busca/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  test('clears input when clear button is clicked', () => {
    const handleChange = jest.fn();
    render(<SearchInput value="some text" onChange={handleChange} />);
    
    const clearButton = screen.getByRole('button', { name: /limpar busca/i });
    fireEvent.click(clearButton);
    
    expect(handleChange).toHaveBeenCalledWith('');
  });

  test('has proper accessibility attributes', () => {
    render(<SearchInput value="" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Campo de busca de produtos');
  });
});
