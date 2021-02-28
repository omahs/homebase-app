import { Transfer } from "services/contracts/baseDAO";

export const fromMigrationParamsFile = async (
  file: File
): Promise<Transfer[]> => {
  const fileReader = new FileReader();
  fileReader.readAsText(file);

  await new Promise<void>(
    (resolve) => (fileReader.onloadend = () => resolve())
  );

  if (fileReader.result === null) {
    throw Error("Unable to read file.");
  }

  const json = fileReader.result as string | ArrayBuffer;
  if (typeof json === "string") {
    return JSON.parse(json as string);
  } else {
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(json as ArrayBuffer));
  }
};
