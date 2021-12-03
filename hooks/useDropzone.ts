import { useEffect, useRef, useState } from "react";
import {
  DropzoneOptions,
  useDropzone as useReactDropzone,
} from "react-dropzone";
import { v4 as uuidv4 } from "uuid";

type Props = {
  maxFileSizeMb?: number;
  onUploadError?: (error?: Error) => void;
} & DropzoneOptions;

const uploadImages = async (
  files: File[],
  fileIds: string[],
  clientId: string
): Promise<Record<string, string>> => {
  const formData = new FormData();
  files.forEach((file, index) => formData.append(fileIds[index], file));

  const response = await fetch(`/api/upload-images/${clientId}`, {
    method: "POST",
    body: formData,
  });
  const body = await response.json();

  if (response.ok) return body;
  else throw Error(body.message ?? "Failed to upload images");
};

interface UploadedFile extends File {
  progress: number;
  preview: string;
  hash?: string;
}

const useDropzone = (
  {
    onUploadError = () => {},
    maxFileSizeMb = 10,
    ...dropzoneOptions
  }: Props = {
    accept: "image/*",
    noClick: true,
  }
) => {
  const [progressEventSource, setProgressEventSource] =
    useState<EventSource | null>(null);
  const uploadProgressId = useRef<string>(uuidv4());

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile>
  >({});

  useEffect(() => () => progressEventSource?.close(), [progressEventSource]);

  const dropzone = useReactDropzone({
    ...dropzoneOptions,
    onDrop: (acceptedFiles, fileRejections, event) => {
      const newUploadedFiles = Object.fromEntries(
        acceptedFiles.map((file) => [
          uuidv4(),
          {
            ...file,
            progress: 0,
            preview: URL.createObjectURL(file),
          },
        ])
      );

      setUploadedFiles((prev) => ({
        ...prev,
        ...newUploadedFiles,
      }));

      uploadImages(
        acceptedFiles,
        Object.keys(newUploadedFiles),
        uploadProgressId.current
      )
        .then((hashes) =>
          setUploadedFiles((prev) => {
            const newUploadedFiles = { ...prev };
            Object.entries(hashes).forEach(
              ([id, hash]) => (newUploadedFiles[id].hash = hash)
            );
            return newUploadedFiles;
          })
        )
        .catch(onUploadError);

      dropzoneOptions.onDrop?.(acceptedFiles, fileRejections, event);
    },
    maxSize: maxFileSizeMb * 1024 * 1024,
  });

  useEffect(() => {
    setProgressEventSource(() => {
      const source = new EventSource(
        `/api/upload-images/${uploadProgressId.current}`
      );
      source.addEventListener("message", (event) => {
        const [id, progress] = JSON.parse(event.data);

        setUploadedFiles((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            progress,
          },
        }));
      });
      return source;
    });
  }, []);

  return { ...dropzone, uploadedFiles };
};

export default useDropzone;
