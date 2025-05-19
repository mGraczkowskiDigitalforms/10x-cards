import { http, HttpResponse } from 'msw';

// Define handlers array
export const handlers = [
  // Example handler for API endpoints
  http.get('/api/example', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        message: 'This is a mocked response',
      },
    });
  }),
]; 