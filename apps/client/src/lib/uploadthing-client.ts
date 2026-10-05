import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/v1/uploadthings/core";

export const { uploadFiles } = generateReactHelpers<UploadRouter>({
  url: "/api/v1/uploadthings",
});
