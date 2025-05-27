import { render, act } from '@testing-library/react';
import { useAppDispatch } from '../redux/redux-hooks';
import NotificationListener from '../components/NotificationListener';

// Mock dependencies
jest.mock('../redux/redux-hooks', () => ({
  useAppDispatch: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock EventSource
const mockEventSource = {
  addEventListener: jest.fn(),
  close: jest.fn(),
  onopen: jest.fn(),
  onerror: jest.fn(),
};
global.EventSource = jest.fn(() => mockEventSource) as any;

// Mock fetch
global.fetch = jest.fn();

// Mock atob for token decoding
global.atob = jest.fn();

describe('NotificationListener Component', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('retrieves token from localStorage and decodes userId', () => {
    const token = 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ==.signature';
    mockLocalStorage.getItem.mockReturnValue(token);
    (global.atob as jest.Mock).mockReturnValue('{"email":"test@example.com"}');

    render(<NotificationListener />);

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    expect(global.atob).toHaveBeenCalledWith('eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ==');
    expect(global.EventSource).toHaveBeenCalledWith('/api/notifications/stream?userId=test@example.com');
  });

  it('falls back to default SSE URL when no token is present', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<NotificationListener />);

    expect(global.EventSource).toHaveBeenCalledWith('/api/notifications/stream');
  });

  it('handles token decoding error gracefully', () => {
    const token = 'header.invalid.signature';
    mockLocalStorage.getItem.mockReturnValue(token);
    (global.atob as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<NotificationListener />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error decoding token:', expect.any(Error));
    expect(global.EventSource).toHaveBeenCalledWith('/api/notifications/stream');
    consoleErrorSpy.mockRestore();
  });

  it('dispatches notification event to Redux', () => {
    const token = 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ==.signature';
    mockLocalStorage.getItem.mockReturnValue(token);
    (global.atob as jest.Mock).mockReturnValue('{"email":"test@example.com"}');

    let notificationCallback: (event: MessageEvent) => void;
    mockEventSource.addEventListener.mockImplementation((event, callback) => {
      if (event === 'notification') {
        notificationCallback = callback;
      }
    });

    render(<NotificationListener />);

    const notification = {
      id: '1',
      title: 'Test Notification',
      body: 'This is a test',
      createdAt: '2025-05-27T12:00:00Z',
    };
    act(() => {
      notificationCallback({ data: JSON.stringify(notification) } as MessageEvent);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'sseMessages/addSSEMessage',
      payload: {
        id: '1',
        title: 'Test Notification',
        body: 'This is a test',
        timestamp: '2025-05-27T12:00:00Z',
      },
    });
  });

  it('subscribes user via API call when token and userId are present', async () => {
    const token = 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ==.signature';
    mockLocalStorage.getItem.mockReturnValue(token);
    (global.atob as jest.Mock).mockReturnValue('{"email":"test@example.com"}');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    render(<NotificationListener />);

    expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: 'test@example.com' }),
    });
  });

  it('handles subscription API call error gracefully', async () => {
    const token = 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ==.signature';
    mockLocalStorage.getItem.mockReturnValue(token);
    (global.atob as jest.Mock).mockReturnValue('{"email":"test@example.com"}');
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<NotificationListener />);

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async fetch
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error subscribing:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('closes EventSource on component unmount', () => {
    render(<NotificationListener />);
    const { unmount } = render(<NotificationListener />);
    unmount();
    expect(mockEventSource.close).toHaveBeenCalled();
  });

});