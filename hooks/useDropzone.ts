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

  const response = await fetch(`/api/upload-images/${clientId}`, {
    method: "POST",
    body: formData,
  });
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

  useEffect(
    () => () => progressEventSource.current?.close(),
    [progressEventSource]
  );

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

      uploadImages(acceptedFiles, uploadProgressId.current)
        .then((hashes) =>
          setAcceptedFiles((prev) => {
            const newUploadedFiles = [...prev];
            hashes.forEach(
              (hash, index) => (newUploadedFiles[index].hash = hash)
            );
            return newUploadedFiles;
          })
        )
        .catch(onUploadError);

      dropzoneOptions.onDrop?.(acceptedFiles, fileRejections, event);
    },
  });

  useEffect(() => {
    console.log(dropzoneOptions);
    const source = new EventSource(
      `/api/upload-images/${uploadProgressId.current}`
    );
    source.addEventListener("message", (event) => {
      const [index, progress] = JSON.parse(event.data);

      setAcceptedFiles((prev) => {
        const newAcceptedFiles = [...prev];
        newAcceptedFiles[index].progress = progress;
        return newAcceptedFiles;
      });
    });
    progressEventSource.current = source;
  }, []);

  return { ...dropzone, acceptedFiles };
};

export default useDropzone;
