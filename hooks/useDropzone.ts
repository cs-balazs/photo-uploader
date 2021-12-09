import { useEffect, useRef, useState } from "react";
import {
  DropzoneOptions,
  useDropzone as useReactDropzone,
} from "react-dropzone";

type Props = {
  maxSizeMb?: number;
  onUploadError?: (error?: Error) => void;
} & DropzoneOptions;

interface UploadedFile extends File {
  progress: number;
  preview: string;
  hash?: string;
}

const uploadImages = async (
  files: File[],
  clientId: number
): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file, index) => formData.append(index.toString(), file));

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_UPLOADER_API}/${clientId}`,
    {
      method: "POST",
      body: formData,
    }
  );

  console.log("response", response);

  const body = await response.json();

  if (response.ok) return body;
  else throw Error(body.message ?? "Failed to upload images");
};

const useDropzone = ({
  onUploadError = () => {},
  maxSizeMb = 10,
  ...dropzoneOptions
}: Props = {}) => {
  // Needed to handle SSE
  const progressEventSource = useRef<EventSource | null>(null);
  const uploadProgressId = useRef<number>(+Date.now());

  // To store the file objects with the extra 'progress', 'preview' and 'hash' properties
  const [acceptedFiles, setAcceptedFiles] = useState<UploadedFile[]>([]);

  // Start uploading files on drop event. After the POST request, the backend will start sending SSE messages
  const dropzone = useReactDropzone({
    ...dropzoneOptions,
    accept: dropzoneOptions.accept ?? "image/*",
    noClick: dropzoneOptions.noClick ?? true,
    maxSize: dropzoneOptions.maxSize ?? maxSizeMb * 1024 * 1024,
    onDrop: (acceptedFiles, fileRejections, event) => {
      const newUploadedFiles = acceptedFiles.map((file) => ({
        ...file,
        progress: 0,
        preview: URL.createObjectURL(file),
      }));

      setAcceptedFiles((prev) => [...prev, ...newUploadedFiles]);

      uploadImages(acceptedFiles, uploadProgressId.current).catch(
        onUploadError
      );

      dropzoneOptions.onDrop?.(acceptedFiles, fileRejections, event);
    },
  });

  // Set up SSE client on mount
  useEffect(() => {
    const source = new EventSource(
      `${process.env.NEXT_PUBLIC_UPLOADER_API}/${uploadProgressId.current}`
    );
    source.addEventListener("progress", (event) => {
      const [index, progress] = JSON.parse(
        (event as Event & { data: string }).data
      );

      setAcceptedFiles((prev) => {
        const newAcceptedFiles = [...prev];
        newAcceptedFiles[index].progress = progress;
        return newAcceptedFiles;
      });
    });

    source.addEventListener("hash", (event) => {
      const [index, hash] = JSON.parse(
        (event as Event & { data: string }).data
      );

      setAcceptedFiles((prev) => {
        const newAcceptedFiles = [...prev];
        newAcceptedFiles[index].hash = hash;
        return newAcceptedFiles;
      });
    });

    progressEventSource.current = source;
  }, []);

  // Disconnect SSE on unmount
  useEffect(
    () => () => progressEventSource.current?.close(),
    [progressEventSource]
  );

  return { ...dropzone, acceptedFiles };
};

export default useDropzone;
