import { FormControl } from "@chakra-ui/form-control";
import { AspectRatio, Box, Center, Text } from "@chakra-ui/layout";
import type { NextPage } from "next";
import { useEffect } from "react";
import useIPFSDropzone from "../hooks/useIPFSDropzone";

const Home: NextPage = () => {
  const { getRootProps, getInputProps, isDragActive, previews, acceptedFiles } =
    useIPFSDropzone();

  useEffect(() => console.log(previews), [previews]);

  return (
    <Box {...getRootProps()}>
      <FormControl>
        <input id="dropzone" {...getInputProps()} hidden />
        <AspectRatio maxWidth={400} ratio={1}>
          <Center as="label" htmlFor="dropzone" backgroundColor="gray.300">
            <Text>
              {isDragActive ? (
                <Text>Drop the files here ...</Text>
              ) : (
                <Text>Drag and drop some files here</Text>
              )}
            </Text>
          </Center>
        </AspectRatio>
      </FormControl>
    </Box>
  );
};

export default Home;
