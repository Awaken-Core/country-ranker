import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session || session.user.role !== "CUSTOMER") {
        throw new UploadThingError("Customer access is required.");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      return {
        userId: metadata.userId,
        url: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof ourFileRouter;
