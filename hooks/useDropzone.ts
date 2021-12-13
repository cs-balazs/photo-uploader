import { useCallback, useState } from "react";
import {
  DropEvent,
  DropzoneOptions,
  FileRejection,
  useDropzone as useReactDropzone,
} from "react-dropzone";
import { v4 as uuidv4 } from "uuid";

export interface UploadedFile extends File {
  id: string;
  preview: string;
}

type Props = {
  maxSizeMb?: number;
  onUploadError?: (error?: Error) => void;
  onDrop?: (
    acceptedFiles: Array<UploadedFile>,
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
} & Omit<DropzoneOptions, "onDrop">;

const uploadImages = async (
  files: File[],
  clientId: string,
  ids: string[]
): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file, index) => formData.append(ids[index], file));

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_UPLOADER_API}/${clientId}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const body = await response.json();

  if (response.ok) return body;
  else throw Error(body.message ?? "Failed to upload images");
};

const useDropzone = ({
  onUploadError = () => {},
  maxSizeMb = 10,
  ...dropzoneOptions
}: Props = {}) => {
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [acceptedFiles, setAcceptedFiles] = useState<UploadedFile[]>([]);

  const setupEventSource = useCallback((clientId: string) => {
    const source = new EventSource(
      `${process.env.NEXT_PUBLIC_UPLOADER_API}/${clientId}`
    );

    source.addEventListener("progress", (event: Event) => {
      try {
        const [id, progress] = JSON.parse(
          (event as Event & { data: string }).data
        );
        setProgresses((prev) => ({ ...prev, [id]: progress }));
      } catch (error) {
        console.error(`Failed to parse SSE "progress" event message`, error);
      }
    });

    source.addEventListener("hash", (event: Event) => {
      try {
        const [id, hash] = JSON.parse((event as Event & { data: string }).data);
        setHashes((prev) => ({ ...prev, [id]: hash }));
      } catch (error) {
        console.error(`Failed to parse SSE "hash" event message`, error);
      }
    });

    return source;
  }, []);

  // Start uploading files on drop event. After the POST request, the backend will start sending SSE messages
  const dropzone = useReactDropzone({
    ...dropzoneOptions,
    accept: dropzoneOptions.accept ?? "image/*",
    noClick: dropzoneOptions.noClick ?? true,
    maxSize: dropzoneOptions.maxSize ?? maxSizeMb * 1024 * 1024,
    onDrop: (_acceptedFiles, fileRejections, event) => {
      const uploadProgressId = uuidv4();
      const progressEventSource = setupEventSource(uploadProgressId);

      const withPreviewAndId = _acceptedFiles.map((file) => ({
        ...file,
        preview: URL.createObjectURL(file),
        id: uuidv4(),
      }));

      setAcceptedFiles(withPreviewAndId);

      setHashes((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.values(withPreviewAndId).map(({ id }) => [id, ""])
        ),
      }));

      setProgresses((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.values(withPreviewAndId).map(({ id }) => [id, 0])
        ),
      }));

      // Intentionally not awaiting here
      uploadImages(
        _acceptedFiles,
        uploadProgressId,
        Object.values(withPreviewAndId).map(({ id }) => id)
      )
        .catch(onUploadError)
        .finally(() => progressEventSource.close());

      dropzoneOptions.onDrop?.(withPreviewAndId, fileRejections, event);
    },
  });

  return { ...dropzone, progresses, hashes, acceptedFiles };
};

export default useDropzone;
