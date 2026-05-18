import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import { useAuth } from './auth-state.provider';
import { GlobalSpinnerProvider } from './global-spinner.provider';

jest.mock('@/providers/auth-state.provider', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);

describe('GlobalSpinnerProvider', () => {
  const defaultProps = {
    children: <div data-testid="children">App Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Conditional Rendering', () => {
    it('should render children if loading state is true', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        isAuthorized: false,
        isAuthorizing: true,
        setUser: jest.fn(),
        setAuthorizing: jest.fn(),
      });

      render(<GlobalSpinnerProvider {...defaultProps} />);

      expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('should render children if loading state is false', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        isAuthorized: false,
        isAuthorizing: false,
        setUser: jest.fn(),
        setAuthorizing: jest.fn(),
      });

      render(<GlobalSpinnerProvider {...defaultProps} />);

      expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('should show SpinnerCustom when isAuthorizing is true', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        isAuthorized: false,
        isAuthorizing: true,
        setUser: jest.fn(),
        setAuthorizing: jest.fn(),
      });

      render(<GlobalSpinnerProvider {...defaultProps} />);

      expect(screen.getByTestId('global-overlay-spinner')).toBeInTheDocument();
    });

    it('should hide SpinnerCustom when isAuthorizing is false', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        isAuthorized: false,
        isAuthorizing: false,
        setUser: jest.fn(),
        setAuthorizing: jest.fn(),
      });

      render(<GlobalSpinnerProvider {...defaultProps} />);

      expect(screen.queryByTestId('global-overlay-spinner')).not.toBeInTheDocument();
    });
  });
});
