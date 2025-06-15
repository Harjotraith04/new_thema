/**
 * API Utility for making requests to the backend
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Makes an API request with authentication
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Request options
 * @returns {Promise} - API response
 */
// Helper to redirect to login page when auth fails
const redirectToLogin = () => {
  console.log('Authentication failed. Redirecting to login page...');
  // Clear any stale tokens
  localStorage.removeItem('authToken');
  // Use window.location for a full page reload to the login
  window.location.href = '/login';
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  if (!token && options.requireAuth !== false) {
    console.warn('No auth token found for request to:', endpoint);
    redirectToLogin();
    throw new Error('Authentication required');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      // Handle authentication errors specially
      if (response.status === 401 || response.status === 403) {
        console.error(`Authentication error for endpoint ${endpoint}: ${response.status}`);
        redirectToLogin();
        throw new Error('Authentication failed. Please log in again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    // For 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Error: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Project API functions
 */
export const projectsApi = {
  /**
   * Get all projects for the current user
   */
  getProjects: () => apiRequest('/projects/'),
  
  /**
   * Get a specific project by ID
   * @param {number|string} id - Project ID
   */
  getProject: (id) => apiRequest(`/projects/${id}`),
  
  /**
   * Get a project with all its content (documents, segments, codes, quotes, annotations)
   * @param {number|string} id - Project ID
   * @returns {Promise} - Complete project data including all related content
   */  getProjectWithContent: (id) => {
    if (!id) {
      throw new Error('Project ID is required to fetch project content');
    }
    console.log(`Fetching full project data for project ${id}`);
    return apiRequest(`/projects/${id}`)
      .then(result => {
        console.log(`Fetched complete project data for project ${id}`);
        
        // Debug response contents
        console.log("Project data structure:", Object.keys(result));
        
        if (result.documents && result.documents.length > 0) {
          console.log("Document has segments field:", result.documents[0].hasOwnProperty('segments'));
          if (result.documents[0].segments) {
            console.log("First document segments count:", result.documents[0].segments.length);
          }
        }
        
        return result;
      });
  },
  
  /**
   * Create a new project
   * @param {object} projectData - Project data object with title and description
   */
  createProject: (projectData) => apiRequest('/projects/', {
    method: 'POST',
    body: JSON.stringify(projectData)
  }),
  
  /**
   * Update an existing project
   * @param {number|string} id - Project ID
   * @param {object} projectData - Updated project data
   */
  updateProject: (id, projectData) => apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData)
  }),
  
  /**
   * Delete a project
   * @param {number|string} id - Project ID
   */
  deleteProject: (id) => apiRequest(`/projects/${id}`, {
    method: 'DELETE'
  }),
    /**
   * Add a collaborator to a project
   * @param {number|string} projectId - Project ID
   * @param {string} email - Collaborator email address
   */
  addCollaborator: (projectId, email) => apiRequest(`/projects/${projectId}/collaborators?collaborator_email=${encodeURIComponent(email)}`, {
    method: 'POST'
  }),
  
  /**
   * Remove a collaborator from a project
   * @param {number|string} projectId - Project ID
   * @param {string} email - Collaborator email address
   */
  removeCollaborator: (projectId, email) => apiRequest(`/projects/${projectId}/collaborators/${email}`, {
    method: 'DELETE'
  })
};

/**
 * Document API functions
 */
export const documentsApi = {  
  /**
   * Process document segments from a project content response
   * @param {Object} document - Document object with segments array
   * @returns {Object} - Document with processed segments
   */
  processDocumentSegments: (document) => {
    if (!document || !document.segments) {
      return document;
    }
    
    // Process segments based on segment_type or other criteria
    return {
      ...document,
      processedSegments: document.segments.map(segment => {
        const { id, content, segment_type, line_number, row_index, additional_data } = segment;
        
        return {
          id,
          content,
          type: segment_type,
          lineNumber: line_number,
          rowIndex: row_index,
          additionalData: additional_data,
          // Add any other useful processed data here
        };
      })
    };
  },
  
  /**
   * Upload a single document
   * @param {number|string} projectId - Project ID
   * @param {File} file - File object to upload
   * @param {string} name - Optional name for the document
   * @param {string} description - Optional description for the document
   */
  uploadDocument: async (projectId, file, name = null, description = null) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Ensure projectId is provided and valid
    if (!projectId) {
      throw new Error('Project ID is required for document upload');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    
    if (name) {
      formData.append('name', name);
    }
    
    if (description) {
      formData.append('description', description);
    }
    
    try {
      console.log(`Uploading document: ${file.name} (${file.size} bytes) to project ${projectId}`);
      
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do NOT set Content-Type here - the browser will set it automatically with the boundary
        },
        body: formData,
      });
      
      // Log response status for debugging
      console.log(`Single document upload response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Single document upload result:', result);
      return result;
    } catch (error) {
      console.error('Upload Document Error:', error);
      throw error;
    }
  },
    /**
   * Upload multiple documents
   * @param {number|string} projectId - Project ID
   * @param {File[]} files - Array of File objects to upload
   */
  bulkUploadDocuments: async (projectId, files) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Ensure projectId is provided and valid
    if (!projectId) {
      throw new Error('Project ID is required for bulk upload');
    }
    
    const formData = new FormData();
    formData.append('project_id', projectId);
    
    // Append each file to the FormData with the same field name 'files'
    // This is crucial for FastAPI to correctly parse the files as a list
    files.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      console.log(`Preparing to upload ${files.length} files to project ${projectId}`);
      
      const response = await fetch(`${API_BASE_URL}/documents/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do NOT set Content-Type here - the browser will set it automatically with the boundary
        },
        body: formData,
      });
      
      // Log response status for debugging
      console.log(`Bulk upload response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Bulk upload result:', result);
      return result;
    } catch (error) {
      console.error('Bulk Upload Documents Error:', error);
      throw error;
    }
  },
    /**
   * Get all documents for a project
   * @param {number|string} projectId - Project ID
   */
  getProjectDocuments: (projectId) => {
    if (!projectId) {
      throw new Error('Project ID is required to fetch documents');
    }
    console.log(`Fetching documents for project ${projectId}`);
    return apiRequest(`/documents/project/${projectId}`)
      .then(result => {
        console.log(`Fetched ${result?.length || 0} documents for project ${projectId}`);
        return result;
      });
  },
    /**
   * Get a specific document
   * @param {number|string} documentId - Document ID
   */
  getDocument: (documentId) => {
    if (!documentId) {
      throw new Error('Document ID is required to fetch document details');
    }
    console.log(`Fetching document details for document ${documentId}`);
    return apiRequest(`/documents/${documentId}`)
      .then(result => {
        console.log(`Fetched document details for document ${documentId}`, result);
        return result;
      });
  },
  
  /**
   * Update a document
   * @param {number|string} documentId - Document ID
   * @param {object} documentData - Document data to update
   */
  updateDocument: (documentId, documentData) => apiRequest(`/documents/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(documentData)
  }),
  
  /**
   * Delete a document
   * @param {number|string} documentId - Document ID
   */
  deleteDocument: (documentId) => apiRequest(`/documents/${documentId}`, {
    method: 'DELETE'
  })
};

export default {
  projects: projectsApi,
  documents: documentsApi,
  
  /**
   * Utility function to get a complete project with content and process it
   * @param {number|string} projectId - Project ID
   * @returns {Promise} - Processed project data
   */
  getProcessedProjectContent: async (projectId) => {
    const projectData = await projectsApi.getProjectWithContent(projectId);
    
    // Process documents and their segments
    if (projectData && projectData.documents && projectData.documents.length > 0) {
      projectData.documents = projectData.documents.map(doc => documentsApi.processDocumentSegments(doc));
    }
    
    return projectData;
  }
};