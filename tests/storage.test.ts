import { afterEach, describe, expect, it } from 'vitest'

import { storage } from '../server/services/storage'

const originalStorageDir = process.env.STORAGE_DIR

afterEach(() => {
  process.env.STORAGE_DIR = originalStorageDir
})

describe('storage service path handling', () => {
  it('builds safe upload and job storage paths', () => {
    expect(storage.uploadPath('upload-1')).toBe('uploads/upload-1.png')
    expect(storage.jobPath('job-1', 'variants', 'variant-1.png')).toBe('jobs/job-1/variants/variant-1.png')
    expect(storage.editPath('edit-1')).toBe('edits/edit-1.png')
  })

  it('rejects unsafe storage paths', () => {
    expect(() => storage.resolvePath('../outside.png')).toThrow('unsafe segment')
    expect(() => storage.resolvePath('/tmp/outside.png')).toThrow('must not be absolute')
    expect(() => storage.resolvePath('jobs//bad.png')).toThrow('unsafe segment')
    expect(() => storage.resolvePath('')).toThrow('non-empty relative path')
  })

  it('rejects unsafe edit storage identifiers', () => {
    expect(() => storage.editPath('../outside')).toThrow('unsafe segment')
    expect(() => storage.editPath('/tmp/outside')).toThrow('unsafe segment')
    expect(() => storage.editPath('nested/edit')).toThrow('unsafe segment')
  })

  it('resolves safe paths inside the configured storage directory', () => {
    process.env.STORAGE_DIR = './tmp/test-storage'

    const resolved = storage.resolvePath('jobs/job-1/variants/variant-1.png')

    expect(resolved).toMatch(/tmp[/\\]test-storage[/\\]jobs[/\\]job-1[/\\]variants[/\\]variant-1\.png$/)
  })
})
