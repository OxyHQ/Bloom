import { FileUpload } from '@oxy.so/bloom/file-upload';
import { RiFilePdf2Line } from '@oxy.so/bloom/icons';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const on = () => {};
const pick = () => null;
/** A zone fills its container in an app; here, a fixed width (a narrow zone measures its own text). */
const ZONE = { width: 320 };
const FILE = { name: 'report.pdf', size: 2_400_000, mimeType: 'application/pdf' };

export const FILE_UPLOAD_CASES: readonly ParityCase[] = [
  {
    name: 'an empty zone',
    language: () =>
      toElement(L.FileUpload().frame({ width: '320' }).onFileSelected(on).label('Attach a file')),
    bloom: () => <FileUpload style={ZONE} onFileSelected={on} accessibilityLabel="Attach a file" />,
  },
  {
    name: 'a zone that checks, picks and speaks its own words',
    language: () =>
      toElement(
        L.FileUpload()
          .frame({ width: '320' })
          .allowedExtensions(['pdf', 'png'])
          .maxBytes(5_000_000)
          .onReject(on)
          .picker(pick)
          .labels({ prompt: 'Drop a PDF', select: 'Choose' })
          .testID('upload'),
      ),
    bloom: () => (
      <FileUpload
        style={ZONE}
        allowedExtensions={['pdf', 'png']}
        maxBytes={5_000_000}
        onReject={on}
        onPickFiles={pick}
        labels={{ prompt: 'Drop a PDF', select: 'Choose' }}
        testID="upload"
      />
    ),
  },
  {
    name: 'a file uploading, its own glyph',
    language: () =>
      toElement(
        L.FileUpload()
          .frame({ width: '320' })
          .file(FILE)
          .uploadProgress(40)
          .onUploadComplete(on)
          .fileIcon(() => L.Icon(RiFilePdf2Line)),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <FileUpload
            style={ZONE}
            file={FILE}
            progress={40}
            onUploadComplete={on}
            renderFileIcon={() => <RiFilePdf2Line size="md" fill={c.text} />}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'a file uploaded',
    language: () =>
      toElement(L.FileUpload().frame({ width: '320' }).file(FILE).uploadProgress(100)),
    bloom: () => <FileUpload style={ZONE} file={FILE} progress={100} />,
  },
  {
    name: 'a disabled zone',
    language: () => toElement(L.FileUpload().frame({ width: '320' }).disabled()),
    bloom: () => <FileUpload style={ZONE} disabled />,
  },
];
