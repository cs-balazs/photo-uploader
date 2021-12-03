import { Grid } from "@chakra-ui/layout";
import type { NextPage } from "next";
import Dropzone from "../components/Dropzone";
import UploadedImage from "../components/UploadedImage";
import useDropzone from "../hooks/useDropzone";

const Home: NextPage = () => {
  const { getRootProps, getInputProps, isDragActive, uploadedFiles } =
    useDropzone();

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
