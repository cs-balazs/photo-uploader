import { Grid } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/react";
import type { NextPage } from "next";
import Dropzone from "../components/Dropzone";
import UploadedImage from "../components/UploadedImage";
import useDropzone from "../hooks/useDropzone";

const Home: NextPage = () => {
  const toast = useToast();

  const { getRootProps, getInputProps, isDragActive, uploadedFiles } =
    useDropzone({
      onDrop: (_, fileRejections) =>
        fileRejections.forEach((file) =>
          toast({
            status: "error",
            title: "Upload failed",
            description: `Failed to upload file ${file.file.name}`,
          })
        ),
    });

  return (
    <Grid templateColumns="1fr 2fr" h="100vh" w="100vw">
      <Dropzone
        dropzoneProps={getRootProps()}
        inputProps={getInputProps()}
        isDragActive={isDragActive}
      />

      <Grid alignItems="center" templateColumns="repeat(4, 1fr)">
        {Object.entries(uploadedFiles).map(([id, file]) => (
          <UploadedImage
            key={id}
            preview={file.preview}
            progress={file.progress}
            hash={file.hash}
          />
        ))}
      </Grid>
    </Grid>
  );
};

export default Home;
