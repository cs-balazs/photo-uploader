import { Center, HStack, Text } from "@chakra-ui/layout";
import { FileArrowUp } from "phosphor-react";
import { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";

type Props = {
  dropzoneProps: DropzoneRootProps;
  inputProps: DropzoneInputProps;
  isDragActive: boolean;
};

const Dropzone = ({ dropzoneProps, inputProps, isDragActive }: Props) => (
  <Center>
    <input id="dropzone" {...inputProps} hidden />
    <Center
      {...dropzoneProps}
      borderColor="teal"
      borderWidth={2}
      borderRadius="xl"
      as="label"
      htmlFor="dropzone"
      backgroundColor="teal.50"
      width={isDragActive ? 420 : 400}
      height={isDragActive ? 420 : 400}
      color="teal.700"
      fontSize="lg"
      transition="0.1s linear"
    >
      {isDragActive ? (
        <Text>Drop the files here ...</Text>
      ) : (
        <HStack>
          <FileArrowUp size={30} />
          <Text>Upload files</Text>
        </HStack>
      )}
    </Center>
  </Center>
);

export default Dropzone;
