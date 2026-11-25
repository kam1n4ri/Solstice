import {
  PDFArray,
  PDFBool,
  PDFContext,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFRawStream,
  PDFString,
} from 'pdf-lib';
import { PdfCipherMode, StandardEncryptParams } from './pdfDecryptCrypto';

export type PdfDecryptErrorCode = 'PASSWORD_REQUIRED' | 'INCORRECT_PASSWORD' | 'UNSUPPORTED_ENCRYPTION';

export class PdfDecryptError extends Error {
  readonly code: PdfDecryptErrorCode;
  constructor(code: PdfDecryptErrorCode, message: string) {
    super(message);
    this.name = 'PdfDecryptError';
    this.code = code;
  }
}

function asBytesOrEmpty(obj: PDFObject | undefined): Uint8Array {
  if (obj instanceof PDFString || obj instanceof PDFHexString) {
    return obj.asBytes();
  }
  return new Uint8Array(0);
}

function asNumberOr(obj: PDFObject | undefined, fallback: number): number {
  return obj instanceof PDFNumber ? obj.asNumber() : fallback;
}

export function isSignatureDict(dict: PDFDict): boolean {
  const type = dict.get(PDFName.of('Type'));
  const typeName = type instanceof PDFName ? type.asString() : null;
  if (typeName === '/Sig' || typeName === '/DocTimeStamp') return true;
  if (typeName !== null) return false;
  const byteRange = dict.get(PDFName.of('ByteRange'));
  return byteRange instanceof PDFArray && byteRange.size() === 4 && dict.has(PDFName.of('Contents'));
}

export function streamUsesIdentityCrypt(stream: PDFRawStream): boolean {
  const filter = stream.dict.lookup(PDFName.of('Filter'));
  const hasCrypt =
    (filter instanceof PDFName && filter.asString() === '/Crypt') ||
    (filter instanceof PDFArray && filter.asArray().some((f) => f instanceof PDFName && f.asString() === '/Crypt'));
  if (!hasCrypt) return false;

  const parms = stream.dict.lookup(PDFName.of('DecodeParms'));
  const checkParm = (p: PDFObject | undefined) =>
    p instanceof PDFDict && p.lookup(PDFName.of('Name'))?.toString() === '/Identity';
  if (parms instanceof PDFArray) {
    return parms.asArray().some((p) => checkParm(stream.dict.context.lookup(p)));
  }
  return checkParm(parms);
}

function resolveCipherMode(
  cfDict: PDFDict | undefined,
  filterName: PDFObject | undefined,
  defaultMode: PdfCipherMode
): { mode: PdfCipherMode; cfLengthBits?: number } {
  if (!(filterName instanceof PDFName)) return { mode: defaultMode };
  const nameStr = filterName.asString();
  if (nameStr === '/Identity') return { mode: 'None' };
  if (!cfDict) return { mode: defaultMode };

  const entry = cfDict.lookup(filterName);
  if (!(entry instanceof PDFDict)) return { mode: defaultMode };

  const cfm = entry.lookup(PDFName.of('CFM'));
  const cfmStr = cfm instanceof PDFName ? cfm.asString() : '';
  const rawLen = asNumberOr(entry.lookup(PDFName.of('Length')), 0);
  const cfLengthBits = rawLen > 0 ? (rawLen <= 32 ? rawLen * 8 : rawLen) : undefined;

  if (cfmStr === '/V2') return { mode: 'RC4', cfLengthBits };
  if (cfmStr === '/AESV2') return { mode: 'AES-128', cfLengthBits };
  if (cfmStr === '/AESV3') return { mode: 'AES-256', cfLengthBits };
  if (cfmStr === '/None') return { mode: 'None' };
  throw new PdfDecryptError('UNSUPPORTED_ENCRYPTION', `Unsupported PDF crypt filter method: ${cfmStr || 'unknown'}`);
}

export function extractEncryptParams(encryptDict: PDFDict, context: PDFContext): StandardEncryptParams {
  const filter = encryptDict.lookup(PDFName.of('Filter'));
  if (!(filter instanceof PDFName) || filter.asString() !== '/Standard') {
    throw new PdfDecryptError(
      'UNSUPPORTED_ENCRYPTION',
      'This PDF uses an unsupported encryption handler (only Standard password encryption is supported).'
    );
  }

  const v = asNumberOr(encryptDict.lookup(PDFName.of('V')), 0);
  const r = asNumberOr(encryptDict.lookup(PDFName.of('R')), 2);
  if (![1, 2, 4, 5].includes(v) || r < 2 || r > 6) {
    throw new PdfDecryptError('UNSUPPORTED_ENCRYPTION', `Unsupported PDF encryption version (V=${v}, R=${r}).`);
  }

  const permissions = asNumberOr(encryptDict.lookup(PDFName.of('P')), 0) | 0;
  const encMetaObj = encryptDict.lookup(PDFName.of('EncryptMetadata'));
  const encryptMetadata = encMetaObj instanceof PDFBool ? encMetaObj.asBoolean() : true;

  let stmMode: PdfCipherMode = v >= 5 ? 'AES-256' : 'RC4';
  let strMode: PdfCipherMode = stmMode;
  let keyLengthBits = asNumberOr(encryptDict.lookup(PDFName.of('Length')), v === 5 ? 256 : v === 1 ? 40 : 128);

  if (v === 4 || v === 5) {
    const cfRaw = encryptDict.lookup(PDFName.of('CF'));
    const cfDict = cfRaw instanceof PDFDict ? cfRaw : undefined;
    const defaultV4Mode: PdfCipherMode = v === 5 ? 'AES-256' : 'None';
    const stmResolved = resolveCipherMode(cfDict, encryptDict.lookup(PDFName.of('StmF')), defaultV4Mode);
    const strResolved = resolveCipherMode(cfDict, encryptDict.lookup(PDFName.of('StrF')), defaultV4Mode);
    stmMode = stmResolved.mode;
    strMode = strResolved.mode;
    if (!encryptDict.has(PDFName.of('Length'))) {
      keyLengthBits = stmResolved.cfLengthBits ?? strResolved.cfLengthBits ?? (v === 5 ? 256 : 128);
    }
  }

  const idArray = context.lookupMaybe(context.trailerInfo.ID, PDFArray);
  const id0 = idArray && idArray.size() > 0 ? asBytesOrEmpty(idArray.get(0)) : new Uint8Array(0);

  return {
    v,
    r,
    keyLengthBits,
    permissions,
    encryptMetadata,
    o: asBytesOrEmpty(encryptDict.lookup(PDFName.of('O'))),
    u: asBytesOrEmpty(encryptDict.lookup(PDFName.of('U'))),
    oe: asBytesOrEmpty(encryptDict.lookup(PDFName.of('OE'))),
    ue: asBytesOrEmpty(encryptDict.lookup(PDFName.of('UE'))),
    fileId: id0,
    stmMode,
    strMode,
  };
}
