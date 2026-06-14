import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File storage that transparently uses a Google Cloud Storage bucket in
 * production (when GCS_BUCKET is set) and the local filesystem in development.
 *
 * References returned by `save()` are opaque strings:
 *   - `gs://<bucket>/<object>` when backed by GCS
 *   - an absolute filesystem path when backed by local disk
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName = process.env.GCS_BUCKET;
  private readonly prefix = process.env.GCS_PREFIX ?? 'reports';
  private gcs?: Storage;

  private get usesGcs(): boolean {
    return !!this.bucketName;
  }

  private get storage(): Storage {
    if (!this.gcs) this.gcs = new Storage();
    return this.gcs;
  }

  private localDir(): string {
    const dir = path.join(process.cwd(), 'storage', this.prefix);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** Persist a file and return an opaque reference for later retrieval. */
  async save(filename: string, buffer: Buffer): Promise<string> {
    if (this.usesGcs) {
      const objectName = `${this.prefix}/${filename}`;
      await this.storage.bucket(this.bucketName!).file(objectName).save(buffer, {
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        resumable: false,
      });
      return `gs://${this.bucketName}/${objectName}`;
    }

    const filePath = path.join(this.localDir(), filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /** Open a readable stream for a previously saved reference. */
  async getStream(ref: string): Promise<Readable> {
    if (ref.startsWith('gs://')) {
      const { bucket, object } = this.parseGsUri(ref);
      const file = this.storage.bucket(bucket).file(object);
      const [exists] = await file.exists();
      if (!exists) throw new Error(`Object not found: ${ref}`);
      return file.createReadStream();
    }

    if (!fs.existsSync(ref)) throw new Error(`File not found: ${ref}`);
    return fs.createReadStream(ref);
  }

  private parseGsUri(uri: string): { bucket: string; object: string } {
    const without = uri.replace('gs://', '');
    const slash = without.indexOf('/');
    return { bucket: without.slice(0, slash), object: without.slice(slash + 1) };
  }
}
