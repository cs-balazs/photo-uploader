import { useToast } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ErrorCode,
  FileRejection,
  useDropzone as useReactDropzone,
} from "react-dropzone";

type Props = {
  acceptedFilesCallback?: (acceptedFiles: File[]) => void;
  rejectedFilesCallback?: (fileRejections: FileRejection[]) => void;
  shouldShowErrorToasts?: boolean;
  maxFileSizeMb?: number;
};

type ErrorKey =
  | ErrorCode.FileInvalidType
  | ErrorCode.FileTooLarge
  | ErrorCode.FileTooSmall
  | ErrorCode.TooManyFiles;

const errorTitles = {
  [ErrorCode.FileInvalidType]: "Invalid file type",
  [ErrorCode.FileTooLarge]: "File too large",
  [ErrorCode.FileTooSmall]: "File too small",
  [ErrorCode.TooManyFiles]: "Too many files",
};

const uploadImages = async (files: File[], id: number) => {
  const formData = new FormData();
  files.forEach((file, index) => formData.append(index.toString(), file));

  const response = await fetch(`/api/upload-images/${id}`, {
    method: "POST",
    body: formData,
  });
  const body = await response.json();

  if (response.ok) return body;
  else throw Error(body.message ?? "Failed to upload images");
};

const useDropzone = ({
  shouldShowErrorToasts = true,
  maxFileSizeMb = 10,
}: Props = {}) => {
  const toast = useToast();
  const [previews, setPreviews] = useState<string[]>([]);
  const [hashes, setHashes] = useState<string[]>([]);
  const [progressEventSource, setProgressEventSource] =
    useState<EventSource | null>(null);
  const uploadProgressId = useRef<number>(+Date.now());
  const [progresses, setProgresses] = useState<number[]>([]);

  useEffect(() => {
    setProgressEventSource(() => {
      const source = new EventSource(
        `/api/upload-images/${uploadProgressId.current}`
      );
      source.addEventListener("message", (event) => {
        const [index, progress] = JSON.parse(event.data);
        setProgresses((prev) => {
          const newProgresses = [...prev];
          newProgresses[index] = progress;
          return newProgresses;
        });
      });
      return source;
    });
  }, []);

  useEffect(() => () => progressEventSource?.close(), [progressEventSource]);

  const showErrorToasts = useCallback(
    (fileRejections: FileRejection[]) => {
      if (shouldShowErrorToasts) {
        fileRejections.forEach((file) =>
          file.errors.forEach(({ code, message }) =>
            toast({
              status: "error",
              title: errorTitles[code as ErrorKey] ?? "Error",
              description: message,
            })
          )
        );
      }
    },
    [shouldShowErrorToasts, toast]
  );

  const dropzone = useReactDropzone({
    onDrop: (acceptedFiles, fileRejections) => {
      setProgresses(acceptedFiles.map(() => 0));
      setPreviews(acceptedFiles.map(URL.createObjectURL));
      showErrorToasts(fileRejections);

      uploadImages(acceptedFiles, uploadProgressId.current)
        .then(setHashes)
        .catch((error) =>
          toast({
            status: "error",
            title: "Failed to upload",
            description: error.message,
          })
        );
    },
    accept: "image/*",
    noClick: true,
    maxSize: maxFileSizeMb * 1024 * 1024,
  });

  return { ...dropzone, previews, hashes, progresses };
};

export default useDropzone;
