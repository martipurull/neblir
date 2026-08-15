import { prisma } from "./client";

export function getReferenceEntryAttachments(referenceEntryId: string) {
  return prisma.referenceEntryAttachment.findMany({
    where: { referenceEntryId },
    orderBy: { createdAt: "asc" },
  });
}

export function getReferenceEntryAttachmentById(id: string) {
  return prisma.referenceEntryAttachment.findUnique({ where: { id } });
}

export function createReferenceEntryAttachment(data: {
  referenceEntryId: string;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
}) {
  return prisma.referenceEntryAttachment.create({ data });
}

export function deleteReferenceEntryAttachment(id: string) {
  return prisma.referenceEntryAttachment.delete({ where: { id } });
}
