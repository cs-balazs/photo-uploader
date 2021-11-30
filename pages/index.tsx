import { Grid } from "@chakra-ui/layout";
import type { NextPage } from "next";
import Dropzone from "../components/Dropzone";
import UploadedImage from "../components/UploadedImage";
import useDropzone from "../hooks/useDropzone";

const Home: NextPage = () => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    previews,
    progresses,
    hashes,
  } = useDropzone();

  return (
    <Grid templateColumns="1fr 2fr" h="100vh" w="100vw">
      <Dropzone
        dropzoneProps={getRootProps()}
        inputProps={getInputProps()}
        isDragActive={isDragActive}
      />

      <Grid alignItems="center" templateColumns="repeat(4, 1fr)">
        {previews.map((preview, index) => (
          <UploadedImage
            key={preview}
            preview={preview}
            progress={progresses[index]}
            hash={hashes[index]}
          />
        ))}
      </Grid>
    </Grid>
  );
};

export default Home;
