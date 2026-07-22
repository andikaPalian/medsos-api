export interface UploadMediaDTO {
  url: string;
  publicId: string;
}

export interface UploadPostMediaDTO {
  url: string;
  publicId: string;
  detectedResourceType: string;
}

export interface UploadAttachmentDTO {
  url: string;
  publicId: string;
}
