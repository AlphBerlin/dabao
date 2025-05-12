import { api } from './api';

// Types
export type EmailTemplateType = 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION' | 'CUSTOM';
export type EmailTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface EmailTemplateVersion {
  id: string;
  versionNumber: number;
  html: string;
  plainText: string;
  name?: string;
  createdAt: string;
  isActive: boolean;
}

export interface EmailTemplateCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  templatesCount?: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description?: string;
  previewText?: string;
  type: EmailTemplateType;
  status: EmailTemplateStatus;
  createdAt: string;
  updatedAt: string;
  activeVersion?: EmailTemplateVersion;
  category?: EmailTemplateCategory;
  versionsCount: number;
}

export interface EmailTemplateListFilters {
  type?: EmailTemplateType;
  status?: EmailTemplateStatus;
  categoryId?: string;
  search?: string;
}

export interface CreateTemplateVersionData {
  html: string;
  plainText: string;
  name?: string;
  isActive: boolean;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  description?: string;
  previewText?: string;
  type: EmailTemplateType;
  categoryId?: string;
}

export interface UpdateTemplateData {
  name?: string;
  subject?: string;
  description?: string;
  previewText?: string;
  type?: EmailTemplateType;
  status?: EmailTemplateStatus;
  categoryId?: string | null;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

// API endpoints

// Templates
export async function fetchTemplates(
  projectId: string,
  filters: EmailTemplateListFilters = {}
): Promise<EmailTemplate[]> {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.search) params.append('search', filters.search);

  return api.get<EmailTemplate[]>(
    `/projects/${projectId}/email-templates?${params.toString()}`
  );
}

export async function fetchTemplate(
  projectId: string,
  templateId: string
): Promise<EmailTemplate> {
  return api.get<EmailTemplate>(
    `/projects/${projectId}/email-templates/${templateId}`
  );
}

export async function createTemplate(
  projectId: string,
  data: CreateTemplateData
): Promise<EmailTemplate> {
  return api.post<EmailTemplate>(
    `/projects/${projectId}/email-templates`,
    data
  );
}

export async function updateTemplate(
  projectId: string,
  templateId: string,
  data: UpdateTemplateData
): Promise<EmailTemplate> {
  return api.patch<EmailTemplate>(
    `/projects/${projectId}/email-templates/${templateId}`,
    data
  );
}

export async function deleteTemplate(
  projectId: string,
  templateId: string
): Promise<void> {
  return api.delete<void>(
    `/projects/${projectId}/email-templates/${templateId}`
  );
}

// Template versions
export async function fetchTemplateVersions(
  projectId: string,
  templateId: string
): Promise<EmailTemplateVersion[]> {
  return api.get<EmailTemplateVersion[]>(
    `/projects/${projectId}/email-templates/${templateId}/versions`
  );
}

export async function fetchTemplateVersion(
  projectId: string,
  templateId: string,
  versionId: string
): Promise<EmailTemplateVersion> {
  return api.get<EmailTemplateVersion>(
    `/projects/${projectId}/email-templates/${templateId}/versions/${versionId}`
  );
}

export async function createTemplateVersion(
  projectId: string,
  templateId: string,
  data: CreateTemplateVersionData
): Promise<EmailTemplateVersion> {
  return api.post<EmailTemplateVersion>(
    `/projects/${projectId}/email-templates/${templateId}/versions`,
    data
  );
}

export async function activateTemplateVersion(
  projectId: string,
  templateId: string,
  versionId: string
): Promise<EmailTemplateVersion> {
  return api.post<EmailTemplateVersion>(
    `/projects/${projectId}/email-templates/${templateId}/versions/${versionId}/activate`,
    {}
  );
}

// Categories
export async function fetchTemplateCategories(
  projectId: string
): Promise<EmailTemplateCategory[]> {
  return api.get<EmailTemplateCategory[]>(
    `/projects/${projectId}/email-template-categories`
  );
}

export async function fetchTemplateCategory(
  projectId: string,
  categoryId: string
): Promise<EmailTemplateCategory> {
  return api.get<EmailTemplateCategory>(
    `/projects/${projectId}/email-template-categories/${categoryId}`
  );
}

export async function createTemplateCategory(
  projectId: string,
  data: CreateCategoryData
): Promise<EmailTemplateCategory> {
  return api.post<EmailTemplateCategory>(
    `/projects/${projectId}/email-template-categories`,
    data
  );
}

export async function updateTemplateCategory(
  projectId: string,
  categoryId: string,
  data: UpdateCategoryData
): Promise<EmailTemplateCategory> {
  return api.patch<EmailTemplateCategory>(
    `/projects/${projectId}/email-template-categories/${categoryId}`,
    data
  );
}

export async function deleteTemplateCategory(
  projectId: string,
  categoryId: string
): Promise<void> {
  return api.delete<void>(
    `/projects/${projectId}/email-template-categories/${categoryId}`
  );
}