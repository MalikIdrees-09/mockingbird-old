import { setLogout } from "../state";

// Base API URL - use environment variable or fallback to new backend domain
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mockingbird-backend.idrees.in/';

// Utility function to handle API responses and check for banned user
export const handleApiResponse = async (response, dispatch) => {
  // Check if response indicates user is banned
  if (response.status === 403) {
    try {
      const data = await response.clone().json();
      if (data.error === 'USER_BANNED' || data.logout) {
        console.log('🚫 User is banned, forcing logout');
        dispatch(setLogout());

        // Show banned message
        const bannedMessage = `Your account has been banned.

Reason: ${data.details || data.message || 'Violation of community guidelines'}

You have been logged out.`;

        alert(bannedMessage);

        // Redirect to login
        window.location.href = '/';

        return null; // Return null to indicate logout occurred
      }
    } catch (error) {
      // If we can't parse the response, continue with normal error handling
    }
  }

  return response;
};

// Wrapper function for fetch that handles banned user logout
export const apiFetch = async (url, options = {}, dispatch) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const handledResponse = await handleApiResponse(response, dispatch);

    if (handledResponse === null) {
      // User was logged out due to ban
      throw new Error('USER_BANNED');
    }

    return handledResponse;
  } catch (error) {
    if (error.message === 'USER_BANNED') {
      throw error;
    }
    throw new Error(`API request failed: ${error.message}`);
  }
};

// Simple helper for components that don't want to use the full apiFetch
export const handleBannedUserError = async (response, dispatch) => {
  return await handleApiResponse(response, dispatch);
};
