import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { vi } from 'vitest';
import * as React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) =>
    React.createElement('img', { src, alt, ...props }),
}));

// Mock react-webcam
vi.mock('react-webcam', () => ({
  default: ({ ...props }: any) =>
    React.createElement('div', { 'data-testid': 'webcam', ...props }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock @vis.gl/react-google-maps
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: any) => React.createElement('div', {}, children),
  Map: ({ ...props }: any) => React.createElement('div', { 'data-testid': 'google-map', ...props }),
  Marker: ({ ...props }: any) => React.createElement('div', { 'data-testid': 'marker', ...props }),
  InfoWindow: ({ children }: any) => React.createElement('div', { 'data-testid': 'info-window' }, children),
}));

// Mock lucide-react icons - include all icons used in the codebase
const iconNames = [
  'Camera', 'Loader2', 'RotateCcw', 'ScanLine', 'Upload', 'History',
  'ArrowRight', 'Recycle', 'Trash2', 'ArrowDown', 'MapPin', 'Globe', 'Github',
  'Compass', 'Phone', 'Navigation', 'ChevronDown', 'ChevronUp', 'AlertCircle',
  'Clock', 'Battery', 'Heart', 'Leaf', 'MapPin', 'Search', 'X', 'Check', 'Circle',
  'Menu', 'Sun', 'Moon', 'Settings', 'User', 'LogOut', 'Home', 'Plus', 'Minus',
  'Edit', 'Delete', 'Save', 'Download', 'Share', 'Copy', 'Link', 'ExternalLink',
  'Mail', 'MessageSquare', 'Bell', 'Archive', 'Bookmark', 'Flag', 'Star',
  'AlertTriangle', // Used in locationCategories.ts
];

vi.mock('lucide-react', () => {
  const mockComponents: Record<string, any> = {};
  iconNames.forEach(name => {
    mockComponents[name] = ({ ...props }: any) =>
      React.createElement('svg', { 'data-testid': `icon-${name.toLowerCase()}`, ...props });
  });
  return mockComponents;
});

// Suppress console.error for specific known warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.('act(...) is not supported') ||
      args[0]?.includes?.('Warning: An update to') ||
      args[0]?.includes?.('ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
