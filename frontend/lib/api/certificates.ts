import { api } from '../api';
import { Certificate, CertificateFormData, CertificateTemplate, CertificateTemplateFormData } from '@/types/certificate';

export const certificateApi = {
  // Certificate Templates
  getTemplates: async (): Promise<CertificateTemplate[]> => {
    const response: any = await api.get('/certificates/templates');
    return response.templates || [];
  },

  getTemplate: async (id: number): Promise<CertificateTemplate> => {
    const response: any = await api.get(`/certificates/templates/${id}`);
    return response.template;
  },

  createTemplate: async (data: FormData): Promise<CertificateTemplate> => {
    const response: any = await api.post('/certificates/templates', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.template;
  },

  updateTemplate: async (id: number, data: FormData): Promise<CertificateTemplate> => {
    const response: any = await api.put(`/certificates/templates/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.template;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/certificates/templates/${id}`);
  },

  setDefaultTemplate: async (id: number): Promise<void> => {
    await api.post(`/certificates/templates/${id}/set-default`);
  },

  // Certificates
  getCertificates: async (params?: Record<string, any>): Promise<Certificate[]> => {
    let url = '/certificates';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    const response: any = await api.get(url);
    return response.data.certificates || [];
  },

  getCertificate: async (id: number): Promise<Certificate> => {
    const response: any = await api.get(`/certificates/${id}`);
    return response.data.certificate;
  },

  issueCertificate: async (data: CertificateFormData): Promise<Certificate> => {
    const response: any = await api.post('/certificates', data);
    return response.data.certificate;
  },

  revokeCertificate: async (id: number, reason?: string): Promise<void> => {
    const response: any = await api.post(`/certificates/${id}/revoke`, { reason });
  },

  deleteCertificate: async (id: number): Promise<void> => {
    await api.delete(`/certificates/${id}`);
  },

  bulkDeleteCertificates: async (certificateIds: number[]): Promise<void> => {
    await api.post('/certificates/bulk/delete', { certificateIds });
  },

  downloadCertificate: async (id: number): Promise<void> => {
    // Backend handles the download directly, so we use fetch with credentials
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

    try {
      console.log(`📥 Downloading certificate ${id}...`);
      const response = await fetch(`${API_BASE}/certificates/${id}/download`, {
        method: 'GET',
        credentials: 'include', // Include session cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Download failed:', response.status, errorText);

        // If the response is HTML (error page), show a better error message
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error(`Download failed: ${response.status} - The certificate file may not exist or you may not have permission to access it.`);
        }

        throw new Error(`Download failed: ${response.status}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `certificate-${id}.pdf`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      console.log('✅ Certificate downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
      throw error;
    }
  },

  uploadExternalCertificate: async (file: File, userId: number): Promise<Certificate> => {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('userId', userId.toString());

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

    console.log(`📤 Uploading certificate:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: userId
    });
    console.log(`🌐 Upload URL: ${API_BASE}/certificates/upload`);
    console.log(`📋 FormData contents:`, Array.from(formData.entries()));

    try {
      const response = await fetch(`${API_BASE}/certificates/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.log(`📡 Upload response status: ${response.status}`);
      console.log(`📡 Upload response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', response.status, errorText);

        // If the response is HTML (error page), show a better error message
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error(`Upload failed: ${response.status} - Server returned HTML error page. Check backend logs for details.`);
        }

        throw new Error(`Upload failed: ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Upload successful:`, result);
      return result.data.certificate;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  },

  // Trainer upload - automatically sets userId to authenticated user
  uploadMyCertificate: async (file: File): Promise<Certificate> => {
    const formData = new FormData();
    formData.append('certificate', file);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

    console.log(`👤 Trainer uploading certificate:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      const response = await fetch(`${API_BASE}/certificates/trainer/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.log(`📡 Trainer upload response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Trainer upload failed:', response.status, errorText);

        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error(`Upload failed: ${response.status} - Server returned HTML error page. Check backend logs for details.`);
        }

        throw new Error(`Upload failed: ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Trainer upload successful:`, result);
      return result.data.certificate;
    } catch (error) {
      console.error('❌ Trainer upload error:', error);
      throw error;
    }
  },

  // User Certificates
  getMyCertificates: async (): Promise<Certificate[]> => {
    const response: any = await api.get('/certificates/me/certificates');
    return response.data.certificates || [];
  }
};

export default certificateApi;
