import {
  CharCodes,
  PDFArray,
  PDFContext,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFObjectStreamParser,
  PDFParser,
  PDFRawStream,
  PDFRef,
  PDFString,
  PDFWriter,
  PDFXRefStreamParser,
} from 'pdf-lib';
import { bytesToHex } from '@pdfsmaller/pdf-encrypt';
import {
  authenticatePdfPassword,
  bytesToPDFStringValue,
  decryptPdfData,
  importAes256DecryptKey,
  PdfCipherMode,
} from './pdfDecryptCrypto';
import {
  extractEncryptParams,
  isSignatureDict,
  PdfDecryptError,
  PdfDecryptErrorCode,
  streamUsesIdentityCrypt,
} from './pdfEncryptParams';

export { PdfDecryptError };
export type { PdfDecryptErrorCode };

export interface DecryptPdfResult {
  bytes: Uint8Array;
  wasEncrypted: boolean;
}

const KW_ENDOBJ = [CharCodes.e, CharCodes.n, CharCodes.d, CharCodes.o, CharCodes.b, CharCodes.j];

async function decryptStringsRecursive(
  obj: PDFObject,
  objNum: number,
  genNum: number,
  mode: PdfCipherMode,
  fileKey: Uint8Array,
  aes256Key: CryptoKey | null,
  seen: WeakSet<PDFObject>
): Promise<void> {
  if (!obj || mode === 'None' || seen.has(obj)) return;

  if (obj instanceof PDFString) {
    seen.add(obj);
    const plain = await decryptPdfData(obj.asBytes(), objNum, genNum, mode, fileKey, aes256Key);
    (obj as unknown as { value: string }).value = bytesToPDFStringValue(plain);
  } else if (obj instanceof PDFHexString) {
    seen.add(obj);
    const plain = await decryptPdfData(obj.asBytes(), objNum, genNum, mode, fileKey, aes256Key);
    (obj as unknown as { value: string }).value = bytesToHex(plain);
  } else if (obj instanceof PDFDict) {
    seen.add(obj);
    const isSig = isSignatureDict(obj);
    for (const [key, value] of obj.entries()) {
      if (isSig && key.asString() === '/Contents') continue;
      await decryptStringsRecursive(value, objNum, genNum, mode, fileKey, aes256Key, seen);
    }
  } else if (obj instanceof PDFArray) {
    seen.add(obj);
    for (const elem of obj.asArray()) {
      await decryptStringsRecursive(elem, objNum, genNum, mode, fileKey, aes256Key, seen);
    }
  }
}

async function parseWithDeferredObjStms(srcBytes: Uint8Array): Promise<{
  context: PDFContext;
  objStmEntries: Array<{ ref: PDFRef; stream: PDFRawStream }>;
}> {
  const parser = PDFParser.forBytesWithOptions(srcBytes, Infinity, false) as any;
  const objStmEntries: Array<{ ref: PDFRef; stream: PDFRawStream }> = [];

  parser.parseIndirectObject = async function () {
    const ref: PDFRef = this.parseIndirectObjectHeader();
    this.skipWhitespaceAndComments();
    const object: PDFObject = this.parseObject();
    this.skipWhitespaceAndComments();
    this.matchKeyword(KW_ENDOBJ);

    if (object instanceof PDFRawStream && object.dict.lookup(PDFName.of('Type')) === PDFName.of('ObjStm')) {
      this.context.assign(ref, object);
      objStmEntries.push({ ref, stream: object });
    } else if (object instanceof PDFRawStream && object.dict.lookup(PDFName.of('Type')) === PDFName.of('XRef')) {
      PDFXRefStreamParser.forStream(object).parseIntoContext();
    } else {
      this.context.assign(ref, object);
    }
    return ref;
  };

  const context: PDFContext = await parser.parseDocument();
  return { context, objStmEntries };
}

export async function decryptPdf(srcBytes: Uint8Array, password = ''): Promise<DecryptPdfResult> {
  const { context, objStmEntries } = await parseWithDeferredObjStms(srcBytes);
  const encryptEntry = context.trailerInfo.Encrypt;
  const encryptDict = context.lookup(encryptEntry);

  if (!encryptDict) {
    for (const { ref, stream } of objStmEntries) {
      await PDFObjectStreamParser.forStream(stream).parseIntoContext();
      context.delete(ref);
    }
    const cleanDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: false, updateMetadata: false });
    return {
      bytes: await cleanDoc.save({ updateFieldAppearances: false }),
      wasEncrypted: false,
    };
  }

  if (!(encryptDict instanceof PDFDict)) {
    throw new PdfDecryptError('UNSUPPORTED_ENCRYPTION', 'Invalid encryption dictionary in PDF.');
  }

  const params = extractEncryptParams(encryptDict, context);
  const fileKey = await authenticatePdfPassword(password, params);
  if (!fileKey) {
    if (!password) {
      throw new PdfDecryptError(
        'PASSWORD_REQUIRED',
        'This PDF requires a password to unlock. Enter the open or owner password and try again.'
      );
    }
    throw new PdfDecryptError('INCORRECT_PASSWORD', 'Incorrect password. Unable to decrypt this PDF.');
  }

  const needsAes256 = params.stmMode === 'AES-256' || params.strMode === 'AES-256';
  const aes256Key = needsAes256 ? await importAes256DecryptKey(fileKey) : null;
  const encryptRef = encryptEntry instanceof PDFRef ? encryptEntry : null;
  const seen = new WeakSet<PDFObject>();

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (encryptRef && ref === encryptRef) continue;
    if (obj instanceof PDFDict && obj.get(PDFName.of('Filter'))?.toString() === '/Standard') continue;

    if (obj instanceof PDFRawStream) {
      const typeName = obj.dict.get(PDFName.of('Type'))?.toString();
      if (typeName === '/XRef') continue;

      const skipMetaStream = !params.encryptMetadata && typeName === '/Metadata';
      if (!skipMetaStream && !streamUsesIdentityCrypt(obj)) {
        const plainStream = await decryptPdfData(
          obj.contents,
          ref.objectNumber,
          ref.generationNumber || 0,
          params.stmMode,
          fileKey,
          aes256Key
        );
        (obj as unknown as { contents: Uint8Array }).contents = plainStream;
        obj.dict.set(PDFName.of('Length'), PDFNumber.of(plainStream.length));
      }
      await decryptStringsRecursive(obj.dict, ref.objectNumber, ref.generationNumber || 0, params.strMode, fileKey, aes256Key, seen);
    } else {
      await decryptStringsRecursive(obj, ref.objectNumber, ref.generationNumber || 0, params.strMode, fileKey, aes256Key, seen);
    }
  }

  for (const { ref, stream } of objStmEntries) {
    await PDFObjectStreamParser.forStream(stream).parseIntoContext();
    context.delete(ref);
  }

  if (encryptRef) context.delete(encryptRef);
  context.trailerInfo.Encrypt = undefined;

  const rootCandidate = context.lookup(context.trailerInfo.Root);
  if (!(rootCandidate instanceof PDFDict)) {
    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFDict && obj.lookup(PDFName.of('Type')) === PDFName.of('Catalog')) {
        context.trailerInfo.Root = ref;
        break;
      }
    }
  }

  const serialized = await PDFWriter.forContext(context, Infinity).serializeToBuffer();
  const cleanDoc = await PDFDocument.load(serialized, { ignoreEncryption: false, updateMetadata: false });
  const cleanBytes = await cleanDoc.save({ updateFieldAppearances: false });

  return { bytes: cleanBytes, wasEncrypted: true };
}
