const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errJson = await response.json();
      message = errJson.detail || errJson.error || message;
    } catch (_) {
      try {
        const text = await response.text();
        message = text.substring(0, 150) || message;
      } catch (__) {}
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  fetchDashboard: () => request('/dashboard/'),
  fetchLatestDataset: () => request('/datasets/latest/'),
  fetchDatasetRecords: (datasetId) => request(`/datasets/${datasetId}/records/`),
  queryDataset: (datasetId, queryConfig) => request(`/datasets/${datasetId}/query/`, {
    method: 'POST',
    body: JSON.stringify(queryConfig),
  }),
  uploadDataset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/datasets/', {
      method: 'POST',
      body: formData,
    });
  },
  loadDemoDataset: () => request('/datasets/demo/bike/', { method: 'POST' }),
};
