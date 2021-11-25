import https from "https";
import { create } from "ipfs-http-client";
import multer from "multer";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import emitter from "../../../eventEmitter";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const client = create({
  url: process.env.INFURA_IPFS_KEY,
  agent: new https.Agent({ keepAlive: true }),
});

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
};

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

type NextRequestWithFiles = NextApiRequest & { files: MulterFile[] };

const uploadImage = (
  id: string,
  index: number,
  buffer: Buffer // TODO: Should allow string as well
): Promise<string> =>
  client
    .add(buffer, {
      progress: (bytes) =>
        emitter.emit(
          `progress-${id}`,
          index,
          Math.floor((bytes / buffer.byteLength) * 100)
        ),
    })
    .then((added) => added.path);

const handler = nextConnect({
  onError(error, req, res: NextApiResponse) {
    res.status(501).json({ message: `${error.message}` });
  },
});
handler.use(upload.any());

handler.post(async (req: NextRequestWithFiles, res: NextApiResponse) => {
  const { id } = req.query;

  const hashes = await Promise.all(
    req.files.map(({ buffer }, index) =>
      uploadImage(id as string, index, buffer)
    )
  ).catch(() => undefined);

  if (!hashes) {
    res.status(500).json({ message: "Failed to upload images" });
    return;
  }

  res.status(200).json(hashes);
});

handler.get((req: NextRequestWithFiles, res: NextApiResponse) => {
  const { id } = req.query;
  console.log("Client connected to SSE, id:", id);

  res.writeHead(200, SSE_HEADERS);
  res.shouldKeepAlive = true;
  setInterval(() => res.write(`data: test\n\n`), 2000);

  emitter.on(`progress-${id}`, (index, progress) => {
    res.write(`data: ${index} - ${progress}%\n\n`);
  });
});

// TODO: This is just for testing SSE and EventEmitter
handler.put(async (req: NextRequestWithFiles, res: NextApiResponse) => {
  const { id } = req.query;
  emitter.emit(`progress-${id}`, "test", "test");
  res.status(200).send("Test event emitted");
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
