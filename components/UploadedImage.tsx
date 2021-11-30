import { Box, Text, VStack } from "@chakra-ui/layout";
import Image from "next/image";
import shortenHex from "../utils/shortenHex";

type Props = {
  preview: string;
  progress: number;
  hash: string;
};

const UploadedImage = ({ preview, progress, hash }: Props) => (
  <VStack key={preview} padding={2}>
    <Box height={200} width="full" position="relative" overflow="hidden">
      <Box
        zIndex={10}
        position="absolute"
        top={0}
        left={`${progress * 100}%`}
        height="full"
        width="full"
        backgroundColor="white"
        opacity={0.5}
      ></Box>
      <Image
        src={preview}
        alt="Preview Image"
        layout="fill"
        objectFit="cover"
      />
    </Box>
    {hash && (
      <Box maxWidth="full">
        <a
          href={`https://ipfs.infura.io/ipfs/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          <Text>{shortenHex(hash, 8)}</Text>
        </a>
      </Box>
    )}
  </VStack>
);

export default UploadedImage;
